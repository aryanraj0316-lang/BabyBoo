import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  AppState, Image, KeyboardAvoidingView, Platform, Keyboard, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { loadProfileDraft, saveProfileDraft } from '../onboarding/screen2/profileDraftStorage';
import { palette, type as typography } from '../onboarding/screen1/tokens';

export interface OnboardingSecondChildData {
  name: string;
  ageCategory: string;
  ageLabel: string;
}

interface OnboardingSecondScreenNativeProps {
  onBack?: () => void;
  onContinue: (childData: OnboardingSecondChildData) => void;
  onSkip?: () => void;
  initialLanguage?: 'en' | 'hi';
}

type Language = 'en' | 'hi';
const AGE_OPTIONS = [
  { id: 'under_1', label: 'Under 1', desc: 'Under 12 months', hi: '1 से कम', hiDesc: '12 महीने से कम' },
  { id: 'age_1', label: '1 year', desc: '12–23 months', hi: '1 साल', hiDesc: '12–23 महीने' },
  { id: '2_4', label: '2–4', desc: 'Toddler / Preschool', hi: '2–4 साल', hiDesc: 'नन्हे बच्चे / प्रीस्कूल' },
  { id: '5_7', label: '5–7', desc: 'Early Elementary', hi: '5–7 साल', hiDesc: 'प्राथमिक कक्षाएं' },
  { id: '8_10', label: '8–10', desc: 'Middle Childhood', hi: '8–10 साल', hiDesc: 'बढ़ते बच्चे' },
];
const COPY = {
  en: {
    back: 'Back', intro: 'Hi I am Buddy. Tell me about your little one.',
    placeholder: 'What is the name of your child?', nameLabel: "Child's name", go: 'Next',
    clear: 'Clear name', continue: 'Continue', edit: 'Edit name', buddy: 'Buddy',
    hi: (name: string) => `Hi, ${name}!`,
    age: (name: string) => `How old is ${name}?`,
  },
  hi: {
    back: 'पीछे', intro: 'नमस्ते, मैं बडी हूँ। अपने बच्चे के बारे में बताइए।',
    placeholder: 'आपके बच्चे का नाम क्या है?', nameLabel: 'बच्चे का नाम', go: 'आगे',
    clear: 'नाम मिटाएं', continue: 'आगे बढ़ें', edit: 'नाम बदलें', buddy: 'बडी',
    hi: (name: string) => `नमस्ते, ${name}!`,
    age: (name: string) => `${name} की उम्र क्या है?`,
  },
};

/** One calm, non-scrolling page. Animation is deferred; the original Buddy stays still. */
export const OnboardingSecondScreenNative: React.FC<OnboardingSecondScreenNativeProps> = ({
  onBack, onContinue, initialLanguage = 'en',
}) => {
  const [saved] = useState(loadProfileDraft);
  const [lang, setLang] = useState<Language>(saved.name ? saved.language : initialLanguage);
  const [childName, setChildName] = useState(saved.name);
  const [selectedAge, setSelectedAge] = useState<string | null>(saved.age);
  const [nameConfirmed, setNameConfirmed] = useState(saved.confirmed);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const t = COPY[lang];
  const cleanName = childName.trim();
  const compactAge = contentHeight > 0 && contentHeight < 630;
  const tightKeyboard = keyboardVisible && contentHeight > 0 && contentHeight < 300;
  const buddySize = Math.min(width * 0.54, nameConfirmed ? 176 : keyboardVisible ? 156 : 220);
  const draft = useRef({ name: childName, age: selectedAge, confirmed: nameConfirmed, language: lang });
  draft.current = { name: childName, age: selectedAge, confirmed: nameConfirmed, language: lang };

  useEffect(() => {
    const pending = setTimeout(() => saveProfileDraft(draft.current), 300);
    return () => clearTimeout(pending);
  }, [childName, selectedAge, nameConfirmed, lang]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') saveProfileDraft(draft.current);
    });
    return () => { subscription.remove(); saveProfileDraft(draft.current); };
  }, []);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    // Focus after the existing page transition; no repeating focus/mascot clock.
    const focus = requestAnimationFrame(() => { if (!saved.confirmed) inputRef.current?.focus(); });
    return () => { cancelAnimationFrame(focus); show.remove(); hide.remove(); };
  }, []);

  const submitName = () => {
    if (!cleanName) { inputRef.current?.focus(); return; }
    setChildName(cleanName);
    setNameConfirmed(true);
    Keyboard.dismiss();
  };
  const editName = () => {
    setNameConfirmed(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  };
  const continueProfile = () => {
    const chosen = AGE_OPTIONS.find(option => option.id === selectedAge);
    if (!cleanName || !chosen) return;
    onContinue({ name: cleanName, ageCategory: chosen.id, ageLabel: chosen.label });
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={insets.top}>
      <View style={styles.header}>
        {onBack ? <TouchableOpacity onPress={onBack} accessibilityRole="button" accessibilityLabel={t.back} style={styles.back}>
          <Text style={styles.backText}>←  {t.back}</Text>
        </TouchableOpacity> : <View />}
        <View style={styles.languages}>
          {(['en', 'hi'] as const).map(language => <TouchableOpacity
            key={language} onPress={() => setLang(language)} accessibilityRole="button"
            accessibilityState={{ selected: language === lang }}
            accessibilityLabel={language === 'en' ? 'English' : 'हिन्दी'}
            style={[styles.language, lang === language && styles.languageActive]}>
            <Text style={[styles.languageText, lang === language && styles.languageTextActive]}>
              {language === 'en' ? 'EN' : 'हिन्दी'}
            </Text>
          </TouchableOpacity>)}
        </View>
      </View>
      <View onLayout={event => setContentHeight(event.nativeEvent.layout.height)} style={[
        styles.content, { paddingBottom: keyboardVisible ? 12 : insets.bottom + 20 },
      ]}>
        <View style={[styles.hero, tightKeyboard && styles.heroCompact]}>
          <View style={styles.dialogue}>
            <Text style={[styles.message, tightKeyboard && styles.messageCompact]} maxFontSizeMultiplier={typography.maxFontScale}>
              {cleanName ? t.hi(cleanName) : t.intro}
            </Text>
            {nameConfirmed && <Text style={styles.ageQuestion} maxFontSizeMultiplier={typography.maxFontScale}>{t.age(cleanName)}</Text>}
          </View>
          <View style={styles.buddySlot}>
            <View style={{ width: buddySize, height: '100%', maxHeight: buddySize * 159 / 160, maxWidth: '100%' }}>
              <View pointerEvents="none" style={styles.buddyShadow} />
              <Image source={require('../../assets/onboarding/screen1/buddy/buddy_wave.webp')}
                accessibilityLabel={t.buddy} accessible resizeMode="contain"
                style={{ width: '100%', height: '100%' }} />
            </View>
          </View>
        </View>
        {!nameConfirmed ? <View style={styles.nameSection}>
          <View style={styles.inputOutline}>
            <TextInput ref={inputRef} autoFocus value={childName} onChangeText={setChildName}
              onSubmitEditing={submitName} placeholder={t.placeholder} placeholderTextColor="#777C78"
              accessibilityLabel={t.nameLabel} style={styles.input} maxLength={25}
              autoCorrect={false} autoCapitalize="words" returnKeyType="go"
              maxFontSizeMultiplier={typography.maxFontScale} />
            {cleanName.length > 0 && <>
              <TouchableOpacity onPress={() => { setChildName(''); inputRef.current?.focus(); }}
                accessibilityRole="button" accessibilityLabel={t.clear} style={styles.clear}>
                <Text style={styles.clearText}>×</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitName} accessibilityRole="button" accessibilityLabel={t.go} style={styles.next}>
                <Text style={styles.nextText}>→</Text>
              </TouchableOpacity>
            </>}
          </View>
        </View> : <View style={styles.ageSection}>
          <TouchableOpacity onPress={editName} accessibilityRole="button" accessibilityLabel={t.edit} style={styles.edit}>
            <Text style={styles.editText}>{t.edit}</Text>
          </TouchableOpacity>
          <View style={styles.ageOptions}>
            {AGE_OPTIONS.map(option => <TouchableOpacity key={option.id}
              onPress={() => setSelectedAge(option.id)} accessibilityRole="radio"
              accessibilityState={{ checked: selectedAge === option.id }}
              accessibilityLabel={`${lang === 'hi' ? option.hi : option.label}, ${lang === 'hi' ? option.hiDesc : option.desc}`}
              style={[styles.ageOption, compactAge && styles.ageOptionCompact, selectedAge === option.id && styles.ageOptionSelected]}>
              <View style={styles.ageCopy}>
                <Text style={styles.ageLabel} maxFontSizeMultiplier={typography.maxFontScale}>{lang === 'hi' ? option.hi : option.label}</Text>
                {!compactAge && <Text style={styles.ageDescription} numberOfLines={2} maxFontSizeMultiplier={typography.maxFontScale}>{lang === 'hi' ? option.hiDesc : option.desc}</Text>}
              </View>
              <View style={[styles.radio, selectedAge === option.id && styles.radioSelected]}>
                {selectedAge === option.id && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>)}
          </View>
          <TouchableOpacity onPress={continueProfile} disabled={!selectedAge} accessibilityState={{ disabled: !selectedAge }} accessibilityRole="button"
            style={[styles.continue, !selectedAge && styles.continueHidden]}>
            <Text style={styles.continueText}>{t.continue}</Text>
          </TouchableOpacity>
        </View>}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFEFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, minHeight: 52 },
  back: { paddingVertical: 10, paddingRight: 12 },
  backText: { fontSize: 17, fontWeight: '600', color: palette.ink.primary },
  languages: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  language: { paddingHorizontal: 9, paddingVertical: 8, borderRadius: 14 },
  languageActive: { backgroundColor: '#F0F3ED' },
  languageText: { fontSize: 12, color: '#6B756E', fontWeight: '500' },
  languageTextActive: { color: palette.ink.primary },
  content: { flex: 1, minHeight: 0, paddingHorizontal: 24, alignItems: 'center' },
  hero: { flexGrow: 0, flexShrink: 1, minHeight: 0, height: '63%', alignItems: 'center', width: '100%', gap: 12, paddingTop: 14, paddingBottom: 20 },
  heroCompact: { paddingTop: 4, paddingBottom: 8, gap: 6 },
  buddySlot: { flex: 1, minHeight: 0, width: '100%', alignItems: 'center', justifyContent: 'flex-start' },
  buddyShadow: { position: 'absolute', bottom: '1.5%', left: '23%', width: '54%', height: 3,
    borderRadius: 100, backgroundColor: 'rgba(20,18,24,0.08)', boxShadow: '0 0 4px 2px rgba(20,18,24,0.12)' },
  dialogue: { alignItems: 'center', gap: 8, width: '100%', maxWidth: 400 },
  message: { fontFamily: Platform.select(typography.subline.family), fontSize: 18, lineHeight: 26, textAlign: 'center', color: '#424B44', fontWeight: '500' },
  messageCompact: { fontSize: 16, lineHeight: 22 },
  ageQuestion: { fontSize: 16, lineHeight: 23, textAlign: 'center', color: '#5D6B61' },
  nameSection: { width: '100%', maxWidth: 430, paddingTop: 16, paddingBottom: 8 },
  inputOutline: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#315E47', borderRadius: 20, paddingLeft: 18, paddingRight: 8, backgroundColor: '#FFFFFF', minHeight: 56 },
  input: { flex: 1, fontSize: 16, lineHeight: 23, paddingVertical: 14, color: '#263F30', minWidth: 0 },
  clear: { width: 32, height: 44, alignItems: 'center', justifyContent: 'center' },
  clearText: { fontSize: 24, color: '#7C887F' },
  next: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#315E47' },
  nextText: { color: 'white', fontSize: 24 },
  ageSection: { width: '100%', maxWidth: 430, paddingBottom: 8 },
  edit: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', marginBottom: 6 },
  editText: { color: '#5B7160', fontSize: 13, textDecorationLine: 'underline' },
  ageOptions: { gap: 8, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  ageOption: { width: '48%', flexDirection: 'row', alignItems: 'center', minHeight: 68, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E0E7DD', borderRadius: 18, backgroundColor: '#FFFFFF' },
  ageOptionCompact: { minHeight: 50 },
  ageOptionSelected: { backgroundColor: '#F0F5EC', borderColor: '#53785B' },
  ageCopy: { flex: 1 },
  ageLabel: { fontSize: 16, lineHeight: 22, color: '#2B4936', fontWeight: '600' },
  ageDescription: { fontSize: 12, lineHeight: 18, color: '#718074' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: '#B9C9B8', alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  radioSelected: { borderColor: '#53785B' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#53785B' },
  continue: { minHeight: 52, justifyContent: 'center', alignItems: 'center', backgroundColor: '#315E47', borderRadius: 20, marginTop: 18 },
  continueText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  continueHidden: { opacity: 0.4 },
});
