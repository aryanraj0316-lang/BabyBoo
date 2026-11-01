/** Small, quiet EN / हिन्दी switch at the top of the screen. */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LANGUAGES, STRINGS, type Language } from './strings';
import { languageToggle as LT, palette, type } from './tokens';

interface Props {
  value: Language;
  onChange: (lang: Language) => void;
}

export function LanguageToggle({ value, onChange }: Props) {
  return (
    <View style={styles.track} accessibilityRole="radiogroup">
      {LANGUAGES.map((lang) => {
        const active = lang === value;
        return (
          <Pressable
            key={lang}
            onPress={() => onChange(lang)}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            accessibilityLabel={STRINGS[lang].toggleA11y}
            hitSlop={8}
            style={[styles.option, active && styles.optionActive]}
          >
            <Text
              style={[styles.label, active && styles.labelActive]}
              maxFontSizeMultiplier={type.maxFontScale}
            >
              {STRINGS[lang].toggleLabel}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    height: LT.height,
    borderRadius: LT.height / 2,
    padding: LT.thumbInset,
    backgroundColor: palette.languageToggle.track,
  },
  option: {
    paddingHorizontal: LT.paddingH,
    borderRadius: (LT.height - LT.thumbInset * 2) / 2,
    justifyContent: 'center',
  },
  optionActive: {
    backgroundColor: palette.languageToggle.thumb,
  },
  label: {
    fontSize: type.toggle.size,
    color: palette.languageToggle.label,
  },
  labelActive: {
    color: palette.languageToggle.labelActive,
    fontWeight: '600',
  },
});
