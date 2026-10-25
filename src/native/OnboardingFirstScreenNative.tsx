import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { heroSetItem } from '../onboarding/hero/storage';
import { router } from 'expo-router';
import { HeroStage } from '../onboarding/hero/HeroStage';
import type { BeatId } from '../onboarding/hero/heroConfig';
import { HERO_STUDIO_UNLOCK_KEY } from '../onboarding/hero/studio/unlock';

interface OnboardingFirstScreenNativeProps {
  onGetStarted: () => void;
  onSkip?: () => void;
}

type Language = 'en' | 'hi';

const TRANSLATIONS = {
  en: {
    langLabel: 'English',
    welcomeTag: 'GENTLE SCREEN TIME',
    countdowns: [
      '0... Phone needs to sleep! 💤',
      '1... Night night phone! 🌙',
      '2... Ready, set! ✨',
      '3... Saying bye to games! 👋',
      '4... Almost time to rest! ⏰',
      '5... Getting ready to sleep! 🎈',
    ],
    cartoonsTitle: 'Fun Cartoons Playing',
    lowBattery: 'Low Battery',
    batteryRemaining: '1% battery remaining',
    shuttingDown: 'Phone shutting down to preserve power',
    phoneResting: 'Phone resting peacefully... 💤',
    parentUnlock: 'Parent Pattern Unlock',
    unlockedSuccess: 'Phone Unlocked! 🔓',
    homeScreen: 'Parent Home Restored',
    bottomMessage: 'Screen time ends with no one being the bad guy. BabyBoo helps your child to say goodbye to the phone gently.',
    getStartedBtn: 'Get Started',
    skip: 'Skip to setup',
  },
  hi: {
    langLabel: 'हिन्दी',
    welcomeTag: 'प्यार से स्क्रीन टाइम विदाई',
    countdowns: [
      '0... फोन के सोने का समय! 💤',
      '1... शुभ रात्रि फोन! 🌙',
      '2... तैयार हो जाओ! ✨',
      '3... खेलों को अलविदा! 👋',
      '4... अब आराम का समय! ⏰',
      '5... सोने की तैयारी! 🎈',
    ],
    cartoonsTitle: 'कार्टून चल रहा है',
    lowBattery: 'कम बैटरी',
    batteryRemaining: '1% बैटरी बची है',
    shuttingDown: 'बैटरी बचाने के लिए फोन बंद हो रहा है',
    phoneResting: 'फोन शांति से सो रहा है... 💤',
    parentUnlock: 'पैरेंट पैटर्न अनलॉक',
    unlockedSuccess: 'फोन अनलॉक हो गया! 🔓',
    homeScreen: 'पैरेंट स्क्रीन अनलॉक',
    bottomMessage: 'स्क्रीन टाइम बिना किसी के विलेन बने खत्म होता है। BabyBoo आपके बच्चे को प्यार से फोन को अलविदा कहने में मदद करता है।',
    getStartedBtn: 'शुरू करें',
    skip: 'सीधे आगे बढ़ें',
  },
};

export const OnboardingFirstScreenNative: React.FC<OnboardingFirstScreenNativeProps> = ({
  onGetStarted,
  onSkip,
}) => {
  const [lang, setLang] = useState<Language>('en');
  const t = TRANSLATIONS[lang];

  const [hasCompletedLoop, setHasCompletedLoop] = useState<boolean>(false);
  const [buttonVisible, setButtonVisible] = useState<boolean>(false);
  const [stage, setStage] = useState({ w: 0, h: 0 });

  const bottomTextFade = useRef(new Animated.Value(0)).current;
  const bottomTextTranslate = useRef(new Animated.Value(15)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.92)).current;

  // Seven taps on the tag open the Animation Studio (also in release builds).
  const taps = useRef<number[]>([]);
  const onTagPress = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((x) => now - x < 3000), now];
    if (taps.current.length >= 7) {
      taps.current = [];
      heroSetItem(HERO_STUDIO_UNLOCK_KEY, '1').finally(() => router.push('/dev/hero-studio'));
    }
  };

  // The message and button appear once the demo has shown the phone waking.
  const onBeat = (beat: BeatId) => {
    if (beat === 'wake') setHasCompletedLoop(true);
  };

  useEffect(() => {
    if (!hasCompletedLoop) return;
    Animated.parallel([
      Animated.timing(bottomTextFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(bottomTextTranslate, { toValue: 0, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start(() => {
      setButtonVisible(true);
      Animated.parallel([
        Animated.timing(buttonFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(buttonScale, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
      ]).start();
    });
  }, [hasCompletedLoop, bottomTextFade, bottomTextTranslate, buttonFade, buttonScale]);

  return (
    <View style={styles.container}>
      {/* 1. TOP HEADER: SKIP + LANGUAGE SELECTION */}
      <View style={styles.topHeader}>
        {onSkip ? (
          <TouchableOpacity onPress={onSkip} activeOpacity={0.7} style={styles.devSkipButton}>
            <Text style={styles.devSkipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
        )}

        <View style={styles.langBox}>
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth={2.4}>
            <Circle cx="12" cy="12" r="10" />
            <Line x1="2" y1="12" x2="22" y2="12" />
            <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </Svg>
          <TouchableOpacity onPress={() => setLang('en')} style={[styles.langBtn, lang === 'en' && styles.langBtnActive]}>
            <Text style={[styles.langBtnText, lang === 'en' && styles.langBtnTextActive]}>EN</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setLang('hi')} style={[styles.langBtn, lang === 'hi' && styles.langBtnActive]}>
            <Text style={[styles.langBtnText, lang === 'hi' && styles.langBtnTextActive]}>हिन्दी</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Pressable onPress={onTagPress} style={styles.tagWrap} accessibilityRole="text">
        <Text style={styles.welcomeTag}>{t.welcomeTag}</Text>
      </Pressable>

      {/* 2. ANIMATED HERO (one Skia canvas: phone demo + Buddy) */}
      <View
        style={styles.heroStage}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (Math.abs(width - stage.w) > 1 || Math.abs(height - stage.h) > 1) setStage({ w: width, h: height });
        }}
      >
        {stage.w > 0 && stage.h > 0 && (
          <HeroStage width={stage.w} height={stage.h} language={lang} onBeat={onBeat} />
        )}
      </View>

      {/* 3. BOTTOM SECTION: TEXT + BIG GET STARTED BUTTON */}
      <View style={styles.bottomSection}>
        <Animated.View
          style={[styles.bottomTextWrapper, { opacity: bottomTextFade, transform: [{ translateY: bottomTextTranslate }] }]}
        >
          <Text style={styles.bottomMessageText}>{t.bottomMessage}</Text>
        </Animated.View>

        {buttonVisible ? (
          <Animated.View style={[styles.buttonWrapper, { opacity: buttonFade, transform: [{ scale: buttonScale }] }]}>
            <TouchableOpacity onPress={onGetStarted} activeOpacity={0.85} style={styles.getStartedButton}>
              <Text style={styles.getStartedText}>{t.getStartedBtn}</Text>
              <Text style={styles.arrowIcon}>→</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <TouchableOpacity onPress={onGetStarted} style={styles.skipBtn} activeOpacity={0.7}>
            <Text style={styles.skipBtnText}>{t.skip} →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 40,
    paddingTop: 4,
  },
  devSkipButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  devSkipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  langBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#000000',
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    gap: 3,
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  langBtnActive: {
    backgroundColor: '#000000',
  },
  langBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#000000',
  },
  langBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  heroStage: {
    flex: 1,
    marginHorizontal: -16,
    minHeight: 320,
  },
  tagWrap: {
    alignSelf: 'center',
    marginTop: 6,
  },
  welcomeTag: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.6,
    color: '#7C6FA8',
  },
  centerStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 330,
  },
  orbitSvg: {
    position: 'absolute',
  },
  phoneCasing: {
    width: 156,
    height: 284,
    backgroundColor: '#0F172A',
    borderRadius: 30,
    padding: 5,
    borderWidth: 2,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 10,
    zIndex: 20,
  },
  hardwareBtn: {
    position: 'absolute',
    width: 3,
    backgroundColor: '#334155',
    borderRadius: 1.5,
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  dynamicIsland: {
    position: 'absolute',
    top: 5,
    alignSelf: 'center',
    width: 48,
    height: 12,
    backgroundColor: '#000000',
    borderRadius: 6,
    zIndex: 50,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 6,
  },
  cameraLens: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1E293B',
  },
  phoneStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 6,
    zIndex: 40,
  },
  phoneClock: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  batteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  batteryPctText: {
    fontSize: 7.5,
    fontWeight: '900',
  },
  batteryShell: {
    width: 16,
    height: 8,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 2,
    padding: 1,
    position: 'relative',
  },
  batteryLevel: {
    height: '100%',
    borderRadius: 1,
  },
  batteryCap: {
    position: 'absolute',
    right: -2.5,
    top: 1.5,
    width: 1.5,
    height: 3,
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 1,
    borderBottomRightRadius: 1,
  },
  screenInnerContent: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  cartoonStageView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#60A5FA',
    justifyContent: 'space-between',
    padding: 8,
  },
  cartoonSunRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  sunEmoji: { fontSize: 18 },
  cloudEmoji: { fontSize: 14 },
  cartoonCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lionEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  cartoonTitlePill: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  cartoonTitleText: {
    fontSize: 7.5,
    fontWeight: '900',
    color: '#1E293B',
  },
  musicNotes: {
    fontSize: 10,
    marginTop: 4,
  },
  videoProgressContainer: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  videoProgressBar: {
    height: '100%',
    backgroundColor: '#EF4444',
  },
  batteryDialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  batteryDialogCard: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.6)',
    borderRadius: 14,
    padding: 8,
    alignItems: 'center',
  },
  dialogBatteryIcon: {
    width: 22,
    height: 11,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 2,
    padding: 1,
    position: 'relative',
    marginBottom: 4,
  },
  dialogBatteryFill: {
    width: '20%',
    height: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 1,
  },
  dialogBatteryCap: {
    position: 'absolute',
    right: -2.5,
    top: 2,
    width: 1.5,
    height: 4,
    backgroundColor: '#EF4444',
  },
  dialogTitle: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
  },
  dialogSub: {
    color: '#F87171',
    fontSize: 7.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  dialogBanner: {
    backgroundColor: 'rgba(153, 27, 27, 0.7)',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 3,
    width: '100%',
  },
  dialogBannerText: {
    color: '#FECACA',
    fontSize: 7,
    fontWeight: '700',
    textAlign: 'center',
  },
  blackoutStageView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  spinnerCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#334155',
    borderTopColor: '#EF4444',
    marginBottom: 6,
  },
  blackoutText: {
    color: '#94A3B8',
    fontSize: 7.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  patternStageView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#020617',
    justifyContent: 'space-between',
    padding: 8,
  },
  patternHeader: {
    alignItems: 'center',
    paddingTop: 4,
  },
  patternHeaderText: {
    color: '#34D399',
    fontSize: 8,
    fontWeight: '900',
  },
  patternArea: {
    width: 110,
    height: 110,
    alignSelf: 'center',
    position: 'relative',
    marginVertical: 'auto',
  },
  patternDotWrapper: {
    position: 'absolute',
    transform: [{ translateX: -6 }, { translateY: -6 }],
  },
  patternDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternDotActive: {
    backgroundColor: '#10B981',
    borderColor: '#6EE7B7',
    transform: [{ scale: 1.2 }],
  },
  patternDotInner: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#94A3B8',
  },
  patternDotInnerActive: {
    backgroundColor: '#FFFFFF',
  },
  fingerWrapper: {
    position: 'absolute',
    width: 24,
    height: 24,
    transform: [{ translateX: -8 }, { translateY: -8 }],
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  fingerGlowRing: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(52, 211, 153, 0.4)',
  },
  fingerTouchPoint: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
  fingerEmoji: {
    fontSize: 18,
    marginTop: 8,
    marginLeft: 6,
  },
  patternBottomStatus: {
    alignItems: 'center',
    paddingBottom: 4,
  },
  unlockedPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unlockedPillText: {
    color: '#6EE7B7',
    fontSize: 7.5,
    fontWeight: '900',
  },
  swipingText: {
    color: '#64748B',
    fontSize: 7,
    fontFamily: 'monospace',
  },
  unlockedBloomView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#064E3B',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  unlockedCheckCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  unlockedCheckText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  unlockedBloomTitle: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
  },
  unlockedBloomSub: {
    color: '#A7F3D0',
    fontSize: 7.5,
    marginTop: 2,
  },
  phoneHomeBar: {
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneHomeIndicator: {
    width: 38,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  mascotOrbitContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  speechBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    shadowColor: '#7C6DF8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 4,
    maxWidth: 155,
  },
  speechBubbleTail: {
    position: 'absolute',
    bottom: -4,
    alignSelf: 'center',
    width: 8,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#DDD6FE',
    transform: [{ rotate: '45deg' }],
  },
  speechBubbleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  speechBubbleNumber: {
    fontSize: 12,
    fontWeight: '900',
    color: '#5D997C',
  },
  speechBubbleText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#1E293B',
  },
  mascotFigure: {
    width: 60,
    height: 44,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotHandWrapper: {
    position: 'absolute',
    left: 2,
    top: 6,
    width: 22,
    height: 22,
    zIndex: 10,
  },
  mascotHandImg: {
    width: '100%',
    height: '100%',
  },
  mascotBodyImg: {
    width: '100%',
    height: '100%',
    zIndex: 20,
  },
  bottomSection: {
    paddingHorizontal: 4,
    gap: 8,
  },
  bottomTextWrapper: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  bottomMessageText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A2436',
    textAlign: 'center',
    lineHeight: 18,
  },
  buttonWrapper: {
    width: '100%',
  },
  getStartedButton: {
    backgroundColor: '#5D997C',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#5D997C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  arrowIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  skipBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
});

export default OnboardingFirstScreenNative;
