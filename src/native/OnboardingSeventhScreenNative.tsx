import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  Easing,
  ScrollView,
} from 'react-native';
import Svg, { Line, Polygon } from 'react-native-svg';

const mascotBodySource = require('../../assets/mascot_body.png');
const mascotHandSource = require('../../assets/mascot_hand.png');

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSeventhScreenNativeProps {
  childName?: string;
  ageCategory?: string;
  dailyMinutes?: number;
  timeChipId?: string;
  dailyFrequency?: number;
  frequencyChipId?: string;
  handoverType?: string;
  hasWorryingContent?: boolean;
  onBack?: () => void;
  onContinue: () => void;
  onSkip?: () => void;
  initialLanguage?: 'en' | 'hi';
}

type Language = 'en' | 'hi';

interface ChangePair {
  id: string;
  noteTitle: string;
  noteTitleHi: string;
  color: string;
  rotation: string;
  parentRed: string;
  parentRedHi: string;
  babyBooGreen: string;
  babyBooGreenHi: string;
}

export const OnboardingSeventhScreenNative: React.FC<OnboardingSeventhScreenNativeProps> = ({
  childName = 'Leo',
  ageCategory = '2_4',
  dailyMinutes = 20,
  timeChipId = '2_4h',
  dailyFrequency = 3,
  frequencyChipId = '2_to_3',
  handoverType = 'tantrum',
  hasWorryingContent = true,
  onBack,
  onContinue,
  onSkip,
  initialLanguage = 'en',
}) => {
  const [lang, setLang] = useState<Language>(initialLanguage);
  const cleanName = childName?.trim() || 'Leo';

  // Dynamic text based on actual answers from screens 3, 4, 5, 6
  const getParentScreenTimeText = () => {
    if (timeChipId === 'more_4h') return { en: 'Over 4 hours of phone time a day', hi: 'दिन में 4 घंटे से अधिक फोन' };
    if (timeChipId === '2_4h') return { en: 'About 2 hours of phone time a day', hi: 'दिन में लगभग 2 घंटे फोन का समय' };
    if (timeChipId === '1_2h') return { en: 'About 1 to 2 hours of phone time a day', hi: 'दिन में लगभग 1 से 2 घंटे फोन' };
    if (timeChipId === 'under_1h') return { en: 'Under 1 hour of phone time a day', hi: 'दिन में 1 घंटे से कम फोन' };
    return { en: 'About 2 hours of phone time a day', hi: 'दिन में लगभग 2 घंटे फोन का समय' };
  };

  const getParentFrequencyText = () => {
    if (frequencyChipId === 'once') return { en: '1 goodbye a day', hi: 'दिन में 1 अलविदा' };
    if (frequencyChipId === '4_to_5') return { en: 'About 4 to 5 goodbyes a day', hi: 'दिन में लगभग 4 से 5 अलविदा' };
    if (frequencyChipId === 'more_than_5') return { en: 'More than 5 goodbyes a day', hi: 'दिन में 5 से ज्यादा बार अलविदा' };
    return { en: 'About 3 goodbyes a day', hi: 'दिन में लगभग 3 अलविदा' };
  };

  const getParentHandoverText = () => {
    if (handoverType === 'meltdown') return { en: 'Screen time ends with heavy crying or meltdown', hi: 'स्क्रीन समय भारी रोने या ड्रामे से खत्म होता है' };
    if (handoverType === 'mild') return { en: 'Screen time ends with fussing and resistance', hi: 'स्क्रीन समय हल्की ज़िद और ना-नुकुर से खत्म होता है' };
    if (handoverType === 'give_in') return { en: 'Screen time ends with negotiations & giving in', hi: 'स्क्रीन समय बहस और झुक जाने पर खत्म होता है' };
    return { en: 'Screen time ends with crying or a tantrum', hi: 'स्क्रीन समय रोने या नखरे के साथ खत्म होता है' };
  };

  const getParentExposureText = () => {
    return {
      en: 'Unfiltered videos, commercial ads, or random autoplay',
      hi: 'अनचाहे वीडियो, विज्ञापन या स्वचालित वीडियो',
    };
  };

  const pTime = getParentScreenTimeText();
  const pFreq = getParentFrequencyText();
  const pHandover = getParentHandoverText();
  const pExposure = getParentExposureText();

  const CHANGE_PAIRS: ChangePair[] = [
    {
      id: 'time',
      noteTitle: pTime.en,
      noteTitleHi: pTime.hi,
      color: '#FEF08A', // soft yellow sticky
      rotation: '-2deg',
      parentRed: pTime.en,
      parentRedHi: pTime.hi,
      babyBooGreen: 'A daily limit you can choose, kept for your automatic mode.',
      babyBooGreenHi: 'एक दैनिक सीमा जो आप चुनते हैं, स्वचालित मोड में सुरक्षित।',
    },
    {
      id: 'frequency',
      noteTitle: pFreq.en,
      noteTitleHi: pFreq.hi,
      color: '#BAE6FD', // soft sky sticky
      rotation: '1.8deg',
      parentRed: pFreq.en,
      parentRedHi: pFreq.hi,
      babyBooGreen: 'One-tap preset countdowns so every goodbye is calm and predictable.',
      babyBooGreenHi: 'एक-टैप टाइमर प्रीसेट ताकि हर अलविदा शांत और अनुमानित रहे।',
    },
    {
      id: 'handover',
      noteTitle: pHandover.en,
      noteTitleHi: pHandover.hi,
      color: '#FED7AA', // warm amber sticky
      rotation: '-1.5deg',
      parentRed: pHandover.en,
      parentRedHi: pHandover.hi,
      babyBooGreen: 'Natural simulated battery shutdown so the phone takes the blame, not you.',
      babyBooGreenHi: 'प्राकृतिक नकली बैटरी शटडाउन ताकि फोन को दोष मिले, आपको नहीं।',
    },
    {
      id: 'exposure',
      noteTitle: pExposure.en,
      noteTitleHi: pExposure.hi,
      color: '#FECDD3', // soft rose sticky
      rotation: '2deg',
      parentRed: pExposure.en,
      parentRedHi: pExposure.hi,
      babyBooGreen: 'Less screen time means less exposure, keeping early years protected.',
      babyBooGreenHi: 'कम स्क्रीन समय मतलब कम जोखिम, बचपन की सुरक्षा के साथ।',
    },
  ];

  // Animation values
  const pencilScribbleAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const nodAnim = useRef(new Animated.Value(0)).current;

  // Sticky notes animated drop values
  const note1Anim = useRef(new Animated.Value(0)).current;
  const note2Anim = useRef(new Animated.Value(0)).current;
  const note3Anim = useRef(new Animated.Value(0)).current;
  const note4Anim = useRef(new Animated.Value(0)).current;

  // Side-by-side transformation row animated values:
  // For each row: red statement appears -> dotted line appears -> green statement appears
  const rowAnims = useRef([
    { red: new Animated.Value(0), line: new Animated.Value(0), green: new Animated.Value(0) },
    { red: new Animated.Value(0), line: new Animated.Value(0), green: new Animated.Value(0) },
    { red: new Animated.Value(0), line: new Animated.Value(0), green: new Animated.Value(0) },
    { red: new Animated.Value(0), line: new Animated.Value(0), green: new Animated.Value(0) },
  ]).current;

  // Closing Statement & CTA button animation
  const resultsContainerFade = useRef(new Animated.Value(0)).current;
  const closingCardFade = useRef(new Animated.Value(0)).current;
  const continueBtnFade = useRef(new Animated.Value(0)).current;

  const [hasNodded, setHasNodded] = useState<boolean>(false);
  const [isWriting, setIsWriting] = useState<boolean>(true);

  // 1. Idle float and pencil scribble animation
  useEffect(() => {
    const scribbleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pencilScribbleAnim, { toValue: 1, duration: 180, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pencilScribbleAnim, { toValue: -1, duration: 200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pencilScribbleAnim, { toValue: 0.8, duration: 160, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pencilScribbleAnim, { toValue: 0, duration: 190, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    scribbleLoop.start();

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -4, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    floatLoop.start();

    return () => {
      scribbleLoop.stop();
      floatLoop.stop();
    };
  }, [pencilScribbleAnim, floatAnim]);

  // 2. Sequential Animation:
  // Notes drop -> Buddy nods -> Red appears -> Dotted line connects -> Green appears
  useEffect(() => {
    // Note 1 lands at 200ms
    const t1 = setTimeout(() => {
      Animated.spring(note1Anim, { toValue: 1, friction: 6, tension: 45, useNativeDriver: true }).start();
    }, 200);

    // Note 2 lands at 500ms
    const t2 = setTimeout(() => {
      Animated.spring(note2Anim, { toValue: 1, friction: 6, tension: 45, useNativeDriver: true }).start();
    }, 500);

    // Note 3 lands at 800ms
    const t3 = setTimeout(() => {
      Animated.spring(note3Anim, { toValue: 1, friction: 6, tension: 45, useNativeDriver: true }).start();
    }, 800);

    // Note 4 lands at 1100ms
    const t4 = setTimeout(() => {
      Animated.spring(note4Anim, { toValue: 1, friction: 6, tension: 45, useNativeDriver: true }).start(() => {
        // Last note landed: Buddy stops writing, smiles, and nods!
        setTimeout(() => {
          setIsWriting(false);
          setHasNodded(true);

          // Cheerful nod animation
          Animated.sequence([
            Animated.timing(nodAnim, { toValue: 6, duration: 220, useNativeDriver: true }),
            Animated.timing(nodAnim, { toValue: -3, duration: 200, useNativeDriver: true }),
            Animated.timing(nodAnim, { toValue: 5, duration: 200, useNativeDriver: true }),
            Animated.timing(nodAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
          ]).start(() => {
            // Fade in results container
            Animated.timing(resultsContainerFade, { toValue: 1, duration: 300, useNativeDriver: true }).start();

            // Trigger sequential side-by-side row animations:
            // For each row: Red appears -> Dotted line connects -> Green appears
            const animateRow = (idx: number, next?: () => void) => {
              Animated.sequence([
                // Step A: Red statement appears
                Animated.timing(rowAnims[idx].red, {
                  toValue: 1,
                  duration: 280,
                  easing: Easing.out(Easing.quad),
                  useNativeDriver: true,
                }),
                Animated.delay(120),
                // Step B: Dotted line appears connecting to green
                Animated.timing(rowAnims[idx].line, {
                  toValue: 1,
                  duration: 280,
                  easing: Easing.out(Easing.quad),
                  useNativeDriver: true,
                }),
                Animated.delay(120),
                // Step C: Green statement appears
                Animated.timing(rowAnims[idx].green, {
                  toValue: 1,
                  duration: 300,
                  easing: Easing.out(Easing.quad),
                  useNativeDriver: true,
                }),
              ]).start(() => {
                if (next) next();
              });
            };

            // Chain rows 0 -> 1 -> 2 -> 3 -> Closing Quote -> Button
            animateRow(0, () => {
              animateRow(1, () => {
                animateRow(2, () => {
                  animateRow(3, () => {
                    // Finally, reveal closing tagline & Get Started button
                    Animated.parallel([
                      Animated.timing(closingCardFade, { toValue: 1, duration: 450, useNativeDriver: true }),
                      Animated.timing(continueBtnFade, { toValue: 1, duration: 450, useNativeDriver: true }),
                    ]).start();
                  });
                });
              });
            });
          });
        }, 280);
      });
    }, 1100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  const pencilTranslateX = pencilScribbleAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-6, 6],
  });

  const pencilRotate = pencilScribbleAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-12deg', '14deg'],
  });

  const nodInterpolate = nodAnim.interpolate({
    inputRange: [-10, 10],
    outputRange: ['-10deg', '10deg'],
  });

  return (
    <View style={styles.container}>
      {/* 1. TOP HEADER: BACK, LANGUAGE TOGGLE & DEV SKIP */}
      <View style={styles.topHeader}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backText}>{lang === 'hi' ? 'पीछे' : 'Back'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* Monochrome Language Pill */}
          <View style={styles.langPill}>
            <TouchableOpacity
              onPress={() => setLang('en')}
              activeOpacity={0.8}
              style={[styles.langOption, lang === 'en' && styles.langOptionActive]}
            >
              <Text style={[styles.langText, lang === 'en' && styles.langTextActive]}>EN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setLang('hi')}
              activeOpacity={0.8}
              style={[styles.langOption, lang === 'hi' && styles.langOptionActive]}
            >
              <Text style={[styles.langText, lang === 'hi' && styles.langTextActive]}>हिन्दी</Text>
            </TouchableOpacity>
          </View>

          {/* Dev Skip Button */}
          {onSkip ? (
            <TouchableOpacity onPress={onSkip} activeOpacity={0.7} style={styles.devSkipButton}>
              <Text style={styles.devSkipText}>Skip</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. BUDDY TAKING NOTES & WRITING ANIMATION */}
        <View style={styles.mascotSection}>
          {/* Speech Bubble */}
          <View style={styles.speechBubbleWrapper}>
            <View style={styles.speechBubble}>
              <Text style={styles.speechText}>
                {hasNodded
                  ? (lang === 'hi'
                    ? `मैंने सब नोट कर लिया है। यहाँ बताया गया है कि BabyBoo क्या बदलता है:`
                    : `Buddy has taken notes on ${cleanName}. Here is what BabyBoo changes:`)
                  : (lang === 'hi'
                    ? `बडी ${cleanName} के बारे में नोट्स लिख रहा है...`
                    : `Buddy has been taking notes on ${cleanName}...`)}
              </Text>
            </View>
            <View style={styles.speechBubbleTail} />
          </View>

          {/* Mascot Figure with Notepad & Animated Writing Pencil */}
          <Animated.View
            style={[
              styles.mascotFigure,
              {
                transform: [
                  { translateY: floatAnim },
                  { rotate: nodInterpolate },
                ],
              },
            ]}
          >
            {/* Mascot Body */}
            <Image source={mascotBodySource} style={styles.mascotBodyImg} resizeMode="contain" />

            {/* Mascot Hand */}
            <View style={styles.mascotHandWrapper}>
              <Image source={mascotHandSource} style={styles.mascotHandImg} resizeMode="contain" />
            </View>

            {/* Little Notepad Pad held by Buddy */}
            <View style={styles.notepadPlate}>
              <View style={styles.notepadHeader} />
              <View style={styles.notepadLine} />
              <View style={styles.notepadLineShort} />
            </View>

            {/* Animated Writing Pencil */}
            {isWriting && (
              <Animated.View
                style={[
                  styles.pencilWrapper,
                  {
                    transform: [
                      { translateX: pencilTranslateX },
                      { rotate: pencilRotate },
                    ],
                  },
                ]}
              >
                <View style={styles.pencilBody}>
                  <View style={styles.pencilTip} />
                  <View style={styles.pencilEraser} />
                </View>
              </Animated.View>
            )}
          </Animated.View>
        </View>

        {/* 3. STICKY NOTES BOARD (Landing with gentle drops and rotations) */}
        <View style={styles.stickyBoardSection}>
          <Text style={styles.stickySectionTitle}>
            {lang === 'hi' ? `बडी के स्टिकी नोट्स:` : `Buddy’s Sticky Notes:`}
          </Text>

          <View style={styles.stickyGrid}>
            {/* Sticky Note 1 */}
            <Animated.View
              style={[
                styles.stickyNote,
                {
                  backgroundColor: CHANGE_PAIRS[0].color,
                  transform: [
                    { scale: note1Anim },
                    { translateY: note1Anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
                    { rotate: CHANGE_PAIRS[0].rotation },
                  ],
                  opacity: note1Anim,
                },
              ]}
            >
              <View style={styles.stickyPin} />
              <Text style={styles.stickyText}>
                {lang === 'hi' ? CHANGE_PAIRS[0].noteTitleHi : CHANGE_PAIRS[0].noteTitle}
              </Text>
            </Animated.View>

            {/* Sticky Note 2 */}
            <Animated.View
              style={[
                styles.stickyNote,
                {
                  backgroundColor: CHANGE_PAIRS[1].color,
                  transform: [
                    { scale: note2Anim },
                    { translateY: note2Anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
                    { rotate: CHANGE_PAIRS[1].rotation },
                  ],
                  opacity: note2Anim,
                },
              ]}
            >
              <View style={styles.stickyPin} />
              <Text style={styles.stickyText}>
                {lang === 'hi' ? CHANGE_PAIRS[1].noteTitleHi : CHANGE_PAIRS[1].noteTitle}
              </Text>
            </Animated.View>

            {/* Sticky Note 3 */}
            <Animated.View
              style={[
                styles.stickyNote,
                {
                  backgroundColor: CHANGE_PAIRS[2].color,
                  transform: [
                    { scale: note3Anim },
                    { translateY: note3Anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
                    { rotate: CHANGE_PAIRS[2].rotation },
                  ],
                  opacity: note3Anim,
                },
              ]}
            >
              <View style={styles.stickyPin} />
              <Text style={styles.stickyText}>
                {lang === 'hi' ? CHANGE_PAIRS[2].noteTitleHi : CHANGE_PAIRS[2].noteTitle}
              </Text>
            </Animated.View>

            {/* Sticky Note 4 */}
            <Animated.View
              style={[
                styles.stickyNote,
                {
                  backgroundColor: CHANGE_PAIRS[3].color,
                  transform: [
                    { scale: note4Anim },
                    { translateY: note4Anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
                    { rotate: CHANGE_PAIRS[3].rotation },
                  ],
                  opacity: note4Anim,
                },
              ]}
            >
              <View style={styles.stickyPin} />
              <Text style={styles.stickyText}>
                {lang === 'hi' ? CHANGE_PAIRS[3].noteTitleHi : CHANGE_PAIRS[3].noteTitle}
              </Text>
            </Animated.View>
          </View>
        </View>

        {/* 4. RESULTS SECTION: WHAT BABYBOO CHANGES */}
        {/* Side-by-side animation: Red statement appears -> dotted line appears -> green statement appears */}
        <Animated.View
          style={[
            styles.resultsSection,
            {
              opacity: resultsContainerFade,
            },
          ]}
        >
          <View style={styles.resultsHeaderRow}>
            <View style={styles.resultsBadge}>
              <Text style={styles.resultsBadgeText}>
                {lang === 'hi' ? 'परिवर्तन योजना (आमने-सामने)' : 'What Changes What'}
              </Text>
            </View>
          </View>

          {/* 4 Side-by-Side Comparison Rows */}
          <View style={styles.cardsList}>
            {CHANGE_PAIRS.map((item, idx) => (
              <View key={item.id} style={styles.sideBySideRowCard}>
                {/* Number Indicator */}
                <View style={styles.cardIndexBadge}>
                  <Text style={styles.cardIndexText}>{idx + 1}</Text>
                </View>

                <View style={styles.sideBySideInner}>
                  {/* Left: Parent Red Statement (Appears 1st) */}
                  <Animated.View
                    style={[
                      styles.parentRedSideBox,
                      {
                        opacity: rowAnims[idx].red,
                        transform: [
                          {
                            scale: rowAnims[idx].red.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.92, 1],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.sideTagRow}>
                      <View style={styles.redDot} />
                      <Text style={styles.redTagLabel}>
                        {lang === 'hi' ? 'वर्तमान' : 'Today'}
                      </Text>
                    </View>
                    <Text style={styles.parentRedSideText}>
                      {lang === 'hi' ? item.parentRedHi : item.parentRed}
                    </Text>
                  </Animated.View>

                  {/* Center: Dotted Connector Line (Appears 2nd) */}
                  <Animated.View
                    style={[
                      styles.dottedConnector,
                      {
                        opacity: rowAnims[idx].line,
                        transform: [
                          {
                            scaleX: rowAnims[idx].line,
                          },
                          {
                            translateX: rowAnims[idx].line.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-6, 0],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <Svg width={32} height={18} viewBox="0 0 32 18">
                      <Line
                        x1="2"
                        y1="9"
                        x2="24"
                        y2="9"
                        stroke="#7C6DF8"
                        strokeWidth="2"
                        strokeDasharray="3 3"
                      />
                      <Polygon
                        points="23,5 30,9 23,13"
                        fill="#7C6DF8"
                      />
                    </Svg>
                  </Animated.View>

                  {/* Right: BabyBoo Green Statement (Appears 3rd) */}
                  <Animated.View
                    style={[
                      styles.babyBooGreenSideBox,
                      {
                        opacity: rowAnims[idx].green,
                        transform: [
                          {
                            translateX: rowAnims[idx].green.interpolate({
                              inputRange: [0, 1],
                              outputRange: [10, 0],
                            }),
                          },
                          {
                            scale: rowAnims[idx].green.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.94, 1],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.sideTagRow}>
                      <View style={styles.greenDot} />
                      <Text style={styles.greenTagLabel}>
                        {lang === 'hi' ? 'BabyBoo' : 'With BabyBoo'}
                      </Text>
                    </View>
                    <Text style={styles.babyBooGreenSideText}>
                      {lang === 'hi' ? item.babyBooGreenHi : item.babyBooGreen}
                    </Text>
                  </Animated.View>
                </View>
              </View>
            ))}
          </View>

          {/* 5. CLOSING REASSURING STATEMENT */}
          <Animated.View
            style={[
              styles.closingStatementCard,
              {
                opacity: closingCardFade,
                transform: [
                  {
                    scale: closingCardFade.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.closingQuoteSymbol}>“</Text>
            <Text style={styles.closingStatementText}>
              {lang === 'hi'
                ? 'वही दिन, नया और शांत अंत। नियंत्रण हमेशा आपके हाथ में।'
                : 'Same day, different ending. You stay in charge.'}
            </Text>
          </Animated.View>

          {/* 6. PRIMARY CALL TO ACTION BUTTON */}
          <Animated.View
            style={{
              opacity: continueBtnFade,
              width: '100%',
              marginTop: 4,
            }}
          >
            <TouchableOpacity
              onPress={onContinue}
              activeOpacity={0.88}
              style={styles.continueBtn}
            >
              <Text style={styles.continueBtnText}>
                {lang === 'hi' ? 'BabyBoo शुरू करें' : 'Get Started with BabyBoo'}
              </Text>
              <Text style={styles.continueArrow}>→</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#F1EFEA',
  },
  backArrow: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A2436',
    marginRight: 4,
  },
  backText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A2436',
  },
  langPill: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 2,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  langOption: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  langOptionActive: {
    backgroundColor: '#000000',
  },
  langText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
  },
  langTextActive: {
    color: '#FFFFFF',
  },
  devSkipButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  devSkipText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748B',
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 40,
    alignItems: 'center',
  },
  mascotSection: {
    alignItems: 'center',
    marginVertical: 8,
    width: '100%',
  },
  speechBubbleWrapper: {
    alignItems: 'center',
    marginBottom: 6,
    maxWidth: 330,
    width: '100%',
  },
  speechBubble: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C6DF8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    width: '100%',
  },
  speechBubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#DDD6FE',
    alignSelf: 'center',
  },
  speechText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 19,
  },
  mascotFigure: {
    width: 120,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 2,
  },
  mascotBodyImg: {
    width: 90,
    height: 90,
  },
  mascotHandWrapper: {
    position: 'absolute',
    top: 6,
    right: 18,
    zIndex: 2,
  },
  mascotHandImg: {
    width: 28,
    height: 28,
  },
  notepadPlate: {
    position: 'absolute',
    bottom: 8,
    left: 20,
    width: 32,
    height: 40,
    backgroundColor: '#FFFBEB',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 3,
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  notepadHeader: {
    width: '100%',
    height: 6,
    backgroundColor: '#D97706',
    borderRadius: 2,
    marginBottom: 4,
  },
  notepadLine: {
    width: '80%',
    height: 2,
    backgroundColor: '#F59E0B',
    borderRadius: 1,
    marginBottom: 3,
  },
  notepadLineShort: {
    width: '55%',
    height: 2,
    backgroundColor: '#F59E0B',
    borderRadius: 1,
  },
  pencilWrapper: {
    position: 'absolute',
    bottom: 22,
    left: 42,
    zIndex: 4,
  },
  pencilBody: {
    width: 8,
    height: 28,
    backgroundColor: '#EAB308',
    borderRadius: 2,
    borderWidth: 0.8,
    borderColor: '#CA8A04',
    position: 'relative',
  },
  pencilTip: {
    position: 'absolute',
    bottom: -6,
    left: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1E293B',
  },
  pencilEraser: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 5,
    backgroundColor: '#F43F5E',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  stickyBoardSection: {
    width: '100%',
    maxWidth: 375,
    marginTop: 4,
  },
  stickySectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stickyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    width: '100%',
  },
  stickyNote: {
    width: (SCREEN_WIDTH - 44) / 2 > 175 ? 175 : (SCREEN_WIDTH - 44) / 2,
    minHeight: 84,
    padding: 9,
    paddingTop: 13,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
    position: 'relative',
    justifyContent: 'center',
  },
  stickyPin: {
    position: 'absolute',
    top: 4,
    left: '50%',
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  stickyText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    lineHeight: 16,
    textAlign: 'center',
  },
  resultsSection: {
    width: '100%',
    maxWidth: 395,
    marginTop: 18,
  },
  resultsHeaderRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsBadge: {
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
  },
  resultsBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#6D28D9',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardsList: {
    gap: 12,
    width: '100%',
  },
  sideBySideRowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 10,
    paddingTop: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
    position: 'relative',
    width: '100%',
  },
  cardIndexBadge: {
    position: 'absolute',
    top: -8,
    left: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4338CA',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  cardIndexText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '900',
  },
  sideBySideInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  parentRedSideBox: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 8,
    minHeight: 84,
    justifyContent: 'center',
  },
  sideTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626',
  },
  redTagLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#DC2626',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  parentRedSideText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#991B1B',
    lineHeight: 15.5,
  },
  dottedConnector: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
  },
  babyBooGreenSideBox: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 8,
    minHeight: 84,
    justifyContent: 'center',
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  greenTagLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  babyBooGreenSideText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#065F46',
    lineHeight: 15.5,
  },
  closingStatementCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#C4B5FD',
    padding: 16,
    marginTop: 18,
    marginBottom: 14,
    alignItems: 'center',
    shadowColor: '#7C6DF8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  closingQuoteSymbol: {
    fontSize: 26,
    fontWeight: '900',
    color: '#7C6DF8',
    lineHeight: 26,
    marginBottom: -4,
  },
  closingStatementText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#4C1D95',
    textAlign: 'center',
    lineHeight: 22,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5D997C',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#5D997C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
    gap: 8,
    width: '100%',
  },
  continueBtnText: {
    fontSize: 15.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  continueArrow: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
