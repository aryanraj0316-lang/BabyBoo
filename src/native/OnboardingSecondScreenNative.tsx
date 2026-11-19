import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  AppState, Image, KeyboardAvoidingView, Platform, Keyboard, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
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
  const compactAge = contentHeight > 0 && contentHeight < 640;
  const tightKeyboard = keyboardVisible && contentHeight > 0 && contentHeight < 300;
  const buddySize = Math.min(width * 0.56, nameConfirmed ? 204 : keyboardVisible ? 196 : 220);
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
      <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants"
        style={[StyleSheet.absoluteFill, { top: -insets.top }]}>
        <Svg width="100%" height="100%" viewBox="0 0 393 874" preserveAspectRatio="none">
          <Path d="M0 0H158C140 36 136 67 105 86C70 108 24 106 0 153Z" fill="#EFF0E8" />
          <Path d="M0 0H119C103 32 83 44 57 57C24 74 8 102 0 128Z" fill="#E7EADD" />
          <Path d="M393 390C357 410 329 441 323 474C315 523 350 552 348 594C346 647 315 687 282 710C253 731 225 732 211 771C198 807 211 846 223 874H393Z" fill="#E9ECE1" />
          <Path d="M393 694C362 724 333 733 298 748C252 768 252 824 271 874H393Z" fill="#F1F2EB" />
        </Svg>
      </View>
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
        styles.content, { paddingBottom: keyboardVisible ? tightKeyboard ? 12 : 52 : insets.bottom + 38 },
      ]}>
        <View style={[styles.hero, keyboardVisible && styles.keyboardHero, nameConfirmed && styles.ageHero, compactAge && nameConfirmed && styles.ageHeroCompact, tightKeyboard && styles.heroCompact]}>
          <View style={styles.dialogue}>
            <Text style={[styles.message, nameConfirmed && styles.greeting, tightKeyboard && styles.messageCompact]} maxFontSizeMultiplier={typography.maxFontScale}>
              {cleanName ? t.hi(cleanName) : t.intro}
            </Text>
            {nameConfirmed && <Text style={styles.ageQuestion} maxFontSizeMultiplier={typography.maxFontScale}>{t.age(cleanName)}</Text>}
          </View>
          <View style={styles.buddySlot}>
            <View style={{ width: buddySize, height: '100%', maxHeight: buddySize * 159 / 160, maxWidth: '100%' }}>
              <View pointerEvents="none" style={styles.buddyShadow} />
              <Image source={require('../../assets/onboarding/screen2/buddy/buddy_note_approved.webp')}
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
                <Text style={styles.ageDescription} maxFontSizeMultiplier={typography.maxFontScale}>{lang === 'hi' ? option.hiDesc : option.desc}</Text>
              </View>
              <View style={[styles.radio, selectedAge === option.id && styles.radioSelected]}>
                {selectedAge === option.id && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>)}
          </View>
        </View>}
        {nameConfirmed && <TouchableOpacity onPress={continueProfile} disabled={!selectedAge} accessibilityState={{ disabled: !selectedAge }} accessibilityRole="button"
            style={[styles.continue, compactAge && styles.continueCompact, !selectedAge && styles.continueHidden]}>
            <Text style={styles.continueText}>{t.continue}</Text>
          </TouchableOpacity>}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FBFAF5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, minHeight: 64 },
  back: { paddingVertical: 10, paddingRight: 12 },
  backText: { fontSize: 17, fontWeight: '600', color: palette.ink.primary },
  languages: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  language: { minHeight: 36, minWidth: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 24, backgroundColor: '#F1F1E9' },
  languageActive: { backgroundColor: '#E6EADB' },
  languageText: { fontSize: 14, color: '#354B3B', fontWeight: '500' },
  languageTextActive: { color: palette.ink.primary },
  content: { flex: 1, minHeight: 0, paddingHorizontal: 24, alignItems: 'center' },
  hero: { flexGrow: 0, flexShrink: 1, minHeight: 0, height: '63%', alignItems: 'center', width: '100%', gap: 12, paddingTop: 14, paddingBottom: 20 },
  keyboardHero: { flex: 1, height: undefined, paddingTop: 40, gap: 44 },
  ageHero: { flex: 1, height: undefined, paddingTop: 34, paddingBottom: 18, gap: 22 },
  ageHeroCompact: { paddingTop: 10, paddingBottom: 8, gap: 10 },
  heroCompact: { paddingTop: 4, paddingBottom: 8, gap: 6 },
  buddySlot: { flex: 1, minHeight: 0, width: '100%', alignItems: 'center', justifyContent: 'flex-start' },
  buddyShadow: { position: 'absolute', bottom: '1.5%', left: '23%', width: '54%', height: 3,
    borderRadius: 100, backgroundColor: 'rgba(20,18,24,0.08)', boxShadow: '0 0 4px 2px rgba(20,18,24,0.12)' },
  dialogue: { alignItems: 'center', gap: 8, width: '100%', maxWidth: 400 },
  message: { fontFamily: Platform.select(typography.subline.family), fontSize: 18, lineHeight: 26, textAlign: 'center', color: '#424B44', fontWeight: '500' },
  messageCompact: { fontSize: 16, lineHeight: 22 },
  greeting: { fontSize: 28, lineHeight: 36, fontWeight: '700', color: '#244B38' },
  ageQuestion: { fontSize: 18, lineHeight: 26, textAlign: 'center', color: '#5E6C62' },
  nameSection: { width: '100%', maxWidth: 430, paddingTop: 16, paddingBottom: 8 },
  inputOutline: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#315E47', borderRadius: 20, paddingLeft: 18, paddingRight: 8, backgroundColor: '#FFFFFF', minHeight: 56 },
  input: { flex: 1, fontSize: 16, lineHeight: 23, paddingVertical: 14, color: '#263F30', minWidth: 0 },
  clear: { width: 32, height: 44, alignItems: 'center', justifyContent: 'center' },
  clearText: { fontSize: 24, color: '#7C887F' },
  next: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#315E47' },
  nextText: { color: 'white', fontSize: 24 },
  ageSection: { width: '100%', maxWidth: 430 },
  edit: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', marginBottom: 12 },
  editText: { color: '#356844', fontSize: 16, fontWeight: '600', textDecorationLine: 'underline' },
  ageOptions: { rowGap: 12, columnGap: '3%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  ageOption: { width: '48.5%', flexDirection: 'row', alignItems: 'center', minHeight: 70, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: '#DDDFD5', borderRadius: 24, backgroundColor: '#FCFBF7', boxShadow: '0 3px 5px rgba(37,62,37,0.05)' },
  ageOptionCompact: { minHeight: 58, paddingVertical: 8, paddingHorizontal: 12 },
  ageOptionSelected: { backgroundColor: '#E8EDDE', borderColor: '#89A184' },
  ageCopy: { flex: 1 },
  ageLabel: { fontSize: 16, lineHeight: 22, color: '#2B533B', fontWeight: '600' },
  ageDescription: { fontSize: 13, lineHeight: 18, color: '#7A8177', marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: '#CBD1C5', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  radioSelected: { borderColor: '#356844' },
  radioDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#356844' },
  continue: { width: '100%', maxWidth: 430, minHeight: 54, justifyContent: 'center', alignItems: 'center', backgroundColor: '#285A3E', borderRadius: 30, marginTop: 48, boxShadow: '0 8px 14px rgba(40,76,40,0.12)' },
  continueCompact: { marginTop: 24 },
  continueText: { color: '#FFFFFF', fontSize: 19, fontWeight: '600' },
  continueHidden: { opacity: 0.4 },
});
