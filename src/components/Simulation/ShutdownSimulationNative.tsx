import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Vibration,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ShutdownSimulationNativeProps {
  childName?: string;
  onUnlocked: () => void;
  onInstantBypass?: () => void;
}

type SimulationStage = 'battery_draining' | 'system_shutdown' | 'blackout' | 'unlocked';

export const ShutdownSimulationNative: React.FC<ShutdownSimulationNativeProps> = ({
  childName = 'Child',
  onUnlocked,
  onInstantBypass,
}) => {
  const [stage, setStage] = useState<SimulationStage>('battery_draining');
  const [batteryPercent, setBatteryPercent] = useState<number>(20);
  const [drainCountdown, setDrainCountdown] = useState<number>(5);
  const [swipedPath, setSwipedPath] = useState<{ x: number; y: number }[]>([]);
  const [swipedDots, setSwipedDots] = useState<number[]>([]);
  const [patternSuccess, setPatternSuccess] = useState<boolean>(false);
  const [patternHint, setPatternHint] = useState<string>('Swipe capital "A" to unlock');
  const [emergencyTapCount, setEmergencyTapCount] = useState<number>(0);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const spinnerAnim = useRef(new Animated.Value(0)).current;
  const unlockScaleAnim = useRef(new Animated.Value(0.8)).current;

  // Pulse animation for critical battery icon
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Spinner rotation for shutdown sequence
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinnerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, [spinnerAnim]);

  // 1. Rapid Battery Draining Stage (20% -> 10% -> 5% -> 1%)
  useEffect(() => {
    if (stage === 'battery_draining') {
      try {
        Vibration.vibrate([0, 150, 100, 200]);
      } catch { }

      const drainInterval = setInterval(() => {
        setBatteryPercent((prev) => {
          if (prev <= 1) return 1;
          if (prev > 10) return 10;
          if (prev > 5) return 5;
          return 1;
        });
      }, 900);

      const countdownInterval = setInterval(() => {
        setDrainCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(drainInterval);
            clearInterval(countdownInterval);
            setStage('system_shutdown');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(drainInterval);
        clearInterval(countdownInterval);
      };
    }
  }, [stage]);

  // 2. Proper System Shutdown Stage (Power off dialog -> blackout)
  useEffect(() => {
    if (stage === 'system_shutdown') {
      try {
        Vibration.vibrate([0, 100, 80, 120]);
      } catch { }

      const t1 = setTimeout(() => {
        // Fade out screen into total blackout
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => {
          setStage('blackout');
          try {
            Vibration.vibrate(50);
          } catch { }
        });
      }, 3500);

      return () => clearTimeout(t1);
    }
  }, [stage, fadeAnim]);

  // 3x3 pattern dot coordinates for Capital 'A' detection
  const gridBoxSize = Math.min(SCREEN_WIDTH * 0.75, 280);
  const gridOffsetLeft = (SCREEN_WIDTH - gridBoxSize) / 2;
  const gridOffsetTop = (SCREEN_HEIGHT - gridBoxSize) / 2;

  const nodeCoords = [
    { idx: 0, x: gridOffsetLeft + gridBoxSize * 0.18, y: gridOffsetTop + gridBoxSize * 0.18 },
    { idx: 1, x: gridOffsetLeft + gridBoxSize * 0.50, y: gridOffsetTop + gridBoxSize * 0.18 },
    { idx: 2, x: gridOffsetLeft + gridBoxSize * 0.82, y: gridOffsetTop + gridBoxSize * 0.18 },
    { idx: 3, x: gridOffsetLeft + gridBoxSize * 0.18, y: gridOffsetTop + gridBoxSize * 0.50 },
    { idx: 4, x: gridOffsetLeft + gridBoxSize * 0.50, y: gridOffsetTop + gridBoxSize * 0.50 },
    { idx: 5, x: gridOffsetLeft + gridBoxSize * 0.82, y: gridOffsetTop + gridBoxSize * 0.50 },
    { idx: 6, x: gridOffsetLeft + gridBoxSize * 0.18, y: gridOffsetTop + gridBoxSize * 0.82 },
    { idx: 7, x: gridOffsetLeft + gridBoxSize * 0.50, y: gridOffsetTop + gridBoxSize * 0.82 },
    { idx: 8, x: gridOffsetLeft + gridBoxSize * 0.82, y: gridOffsetTop + gridBoxSize * 0.82 },
  ];

  // Capital 'A' Pattern Evaluation Engine
  const evaluateCapitalA = (points: { x: number; y: number }[], dots: number[]) => {
    // Check A: Dot sequence match
    if (dots.length >= 3) {
      // Direct known Capital 'A' combinations
      const validASequences = [
        [6, 3, 1, 5, 8],
        [6, 3, 1, 5, 8, 4],
        [6, 3, 1, 5, 8, 5, 4],
        [6, 3, 1, 5, 8, 5, 4, 3],
        [6, 3, 1, 5, 4],
        [6, 3, 1, 5, 4, 3],
        [6, 3, 4, 5, 8],
        [6, 1, 8],
        [6, 1, 8, 4],
        [6, 1, 8, 5, 4],
        [6, 1, 8, 5, 4, 3],
        [3, 1, 5, 4],
        [3, 1, 5, 8],
        [6, 0, 1, 2, 8],
        [6, 0, 2, 8],
        [6, 0, 2, 8, 4],
      ];

      for (const seq of validASequences) {
        if (dots.length === seq.length && dots.every((val, i) => val === seq[i])) {
          return true;
        }
      }

      // Semantic shape: starts on lower/mid left, reaches top apex, descends to lower/mid right
      const startsLeft = dots.slice(0, 2).some((d) => d === 6 || d === 3);
      const hasApex = dots.some((d) => d === 0 || d === 1 || d === 2);
      const hasRight = dots.slice(2).some((d) => d === 5 || d === 8);
      if (startsLeft && hasApex && hasRight) {
        return true;
      }
    }

    // Check B: Freehand continuous gesture swipe recognition for letter 'A'
    if (points.length >= 8) {
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      let apexIdx = 0;

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) {
          minY = p.y;
          apexIdx = i;
        }
        if (p.y > maxY) maxY = p.y;
      }

      const width = maxX - minX;
      const height = maxY - minY;

      // Must have reasonable gesture size
      if (width >= 35 && height >= 45) {
        const apexPoint = points[apexIdx];
        // Apex cannot be first 12% or last 12% of stroke
        const isApexInterior = apexIdx > points.length * 0.12 && apexIdx < points.length * 0.88;

        // Starts significantly lower than apex and towards left
        const startsLowerLeft =
          points[0].y > apexPoint.y + height * 0.3 &&
          points[0].x <= apexPoint.x + width * 0.25;

        // Has points after apex descending towards lower right
        const pointsAfterApex = points.slice(apexIdx);
        const hasRightDescent = pointsAfterApex.some(
          (p) => p.y > apexPoint.y + height * 0.3 && p.x >= apexPoint.x
        );

        if (isApexInterior && startsLowerLeft && hasRightDescent) {
          return true;
        }
      }
    }

    return false;
  };

  const handleSuccessfulUnlock = () => {
    setPatternSuccess(true);
    setStage('unlocked');
    try {
      Vibration.vibrate([0, 100, 60, 150]);
    } catch { }

    Animated.spring(unlockScaleAnim, {
      toValue: 1.0,
      friction: 6,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      onUnlocked();
    }, 1800);
  };

  // PanResponder to track swipe gestures on the pitch-black screen
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (stage !== 'blackout') return;
        const { pageX, pageY } = evt.nativeEvent;
        setSwipedPath([{ x: pageX, y: pageY }]);
        setSwipedDots([]);
        checkNearDot(pageX, pageY, []);
      },
      onPanResponderMove: (evt) => {
        if (stage !== 'blackout') return;
        const { pageX, pageY } = evt.nativeEvent;
        setSwipedPath((prev) => [...prev, { x: pageX, y: pageY }]);
        checkNearDot(pageX, pageY, swipedDots);
      },
      onPanResponderRelease: () => {
        if (stage !== 'blackout') return;
        const isMatch = evaluateCapitalA(swipedPath, swipedDots);
        if (isMatch) {
          handleSuccessfulUnlock();
        } else {
          try {
            Vibration.vibrate(30);
          } catch { }
          setPatternHint('Incorrect gesture. Swipe a capital "A" from bottom-left to top to bottom-right.');
          setTimeout(() => {
            setSwipedPath([]);
            setSwipedDots([]);
            setPatternHint('Swipe capital "A" to unlock');
          }, 800);
        }
      },
    })
  ).current;

  const checkNearDot = (x: number, y: number, currentDots: number[]) => {
    for (const node of nodeCoords) {
      const dist = Math.hypot(node.x - x, node.y - y);
      if (dist < 38) {
        if (!currentDots.includes(node.idx)) {
          const next = [...currentDots, node.idx];
          setSwipedDots(next);
          try {
            Vibration.vibrate(15);
          } catch { }
        }
        break;
      }
    }
  };

  // Convert swiped path to SVG Polyline points string
  const polylinePoints = swipedPath.map((p) => `${p.x},${p.y}`).join(' ');

  // Secret parent emergency tap (tap 3 times in top-right)
  const handleEmergencyTap = () => {
    const nextCount = emergencyTapCount + 1;
    setEmergencyTapCount(nextCount);
    if (nextCount >= 3) {
      handleSuccessfulUnlock();
    }
  };

  const spin = spinnerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container} {...(stage === 'blackout' ? panResponder.panHandlers : {})}>
      <StatusBar hidden={stage === 'blackout' || stage === 'unlocked'} barStyle="light-content" />

      {/* Secret Emergency Unlock Tap Zone */}
      <TouchableOpacity
        style={styles.emergencyCornerTap}
        activeOpacity={1}
        onPress={handleEmergencyTap}
      />

      {/* STAGE 1: RAPID BATTERY DRAINING WARNING */}
      {stage === 'battery_draining' && (
        <View style={styles.centeredOverlay}>
          {/* Authentic System Low Battery Dialog */}
          <View style={styles.alertCard}>
            {/* Battery Gauge Animation */}
            <Animated.View style={[styles.batteryIconBox, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.batteryShell}>
                <View
                  style={[
                    styles.batteryFill,
                    {
                      width: `${Math.max(batteryPercent, 8)}%`,
                      backgroundColor: batteryPercent <= 5 ? '#EF4444' : '#F59E0B',
                    },
                  ]}
                />
                <View style={styles.batteryTerminal} />
              </View>
              <Text style={styles.batteryPctText}>{batteryPercent}%</Text>
            </Animated.View>

            <Text style={styles.alertTitle}>Low Battery</Text>
            <Text style={styles.alertSubtitle}>1% of battery remaining</Text>

            <View style={styles.alertNoticeBox}>
              <Text style={styles.alertNoticeText}>
                Device shutting down in {drainCountdown}s to preserve battery health
              </Text>
            </View>

            {/* Quick Testing Button for Parents/Testers */}
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={() => setStage('system_shutdown')}
            >
              <Text style={styles.skipBtnText}>Fast-Forward to Shutdown →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* STAGE 2: SYSTEM SHUTDOWN SIMULATION */}
      {stage === 'system_shutdown' && (
        <Animated.View style={[styles.centeredOverlay, { opacity: fadeAnim }]}>
          <View style={styles.shutdownCard}>
            <Animated.View style={{ transform: [{ rotate: spin }], marginBottom: 18 }}>
              <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="10" stroke="#334155" strokeWidth="3" />
                <Path
                  d="M12 2a10 10 0 0 1 10 10"
                  stroke="#94A3B8"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </Svg>
            </Animated.View>

            <Text style={styles.shutdownTitle}>Power off</Text>
            <Text style={styles.shutdownSub}>Shutting down...</Text>
          </View>
        </Animated.View>
      )}

      {/* STAGE 3: PITCH BLACK BLACKOUT (SCREEN OFF SIMULATION) */}
      {stage === 'blackout' && (
        <View style={styles.blackoutContainer}>
          {/* SVG Canvas for continuous touch trail & capital 'A' dots */}
          <Svg style={StyleSheet.absoluteFill}>
            {/* Swiped Touch Trail */}
            {swipedPath.length > 1 && (
              <Polyline
                points={polylinePoints}
                fill="none"
                stroke={patternSuccess ? '#10B981' : '#818CF8'}
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.85}
              />
            )}

            {/* Subtle 3x3 pattern dots for Capital 'A' guidance */}
            {nodeCoords.map((node) => {
              const isSelected = swipedDots.includes(node.idx);
              return (
                <Circle
                  key={`dot-${node.idx}`}
                  cx={node.x}
                  cy={node.y}
                  r={isSelected ? 10 : 5}
                  fill={isSelected ? (patternSuccess ? '#10B981' : '#818CF8') : '#1E293B'}
                  opacity={isSelected ? 0.9 : 0.35}
                />
              );
            })}
          </Svg>

          {/* Faint Guide for Parent */}
          <View style={styles.blackoutHintBox} pointerEvents="none">
            <Text style={styles.blackoutHintText}>{patternHint}</Text>
            <Text style={styles.blackoutSubHintText}>
              Draw "A" or connect bottom-left → top-center → bottom-right
            </Text>
          </View>

          {/* Instant Parent Bypass Tap at Bottom */}
          <TouchableOpacity
            style={styles.instantBypassBar}
            onPress={onInstantBypass || handleSuccessfulUnlock}
          >
            <Text style={styles.instantBypassText}>Parent Unlock Override</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* STAGE 4: RESTORATION & UNLOCKED CONFIRMATION */}
      {stage === 'unlocked' && (
        <Animated.View
          style={[styles.centeredOverlay, { transform: [{ scale: unlockScaleAnim }] }]}
        >
          <View style={styles.unlockedCard}>
            <View style={styles.unlockedIconCircle}>
              <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M20 6L9 17L4 12"
                  stroke="#10B981"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>

            <Text style={styles.unlockedTitle}>Screen Unlocked</Text>
            <Text style={styles.unlockedSub}>Capital "A" Pattern Verified</Text>
            <Text style={styles.unlockedDesc}>
              Battery status restored. Session completed cleanly for {childName}.
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 9999,
  },
  emergencyCornerTap: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 60,
    height: 60,
    zIndex: 10001,
  },
  centeredOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  alertCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#1E293B',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#334155',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  batteryIconBox: {
    alignItems: 'center',
    marginBottom: 16,
  },
  batteryShell: {
    width: 58,
    height: 28,
    borderWidth: 2.5,
    borderColor: '#EF4444',
    borderRadius: 7,
    padding: 2,
    position: 'relative',
    justifyContent: 'center',
  },
  batteryFill: {
    height: '100%',
    borderRadius: 3,
  },
  batteryTerminal: {
    position: 'absolute',
    right: -6,
    top: 7,
    width: 4,
    height: 10,
    backgroundColor: '#EF4444',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  batteryPctText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 6,
  },
  alertTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  alertSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 16,
  },
  alertNoticeBox: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  alertNoticeText: {
    fontSize: 11.5,
    color: '#F87171',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
  },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  skipBtnText: {
    fontSize: 12,
    color: '#60A5FA',
    fontWeight: '700',
  },
  shutdownCard: {
    alignItems: 'center',
  },
  shutdownTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  shutdownSub: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  blackoutContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  blackoutHintBox: {
    position: 'absolute',
    bottom: 70,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  blackoutHintText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 4,
  },
  blackoutSubHintText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  instantBypassBar: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
  },
  instantBypassText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
  },
  unlockedCard: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#0F172A',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#10B981',
    padding: 24,
    alignItems: 'center',
  },
  unlockedIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 2,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  unlockedTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  unlockedSub: {
    fontSize: 13,
    color: '#34D399',
    fontWeight: '700',
    marginBottom: 8,
  },
  unlockedDesc: {
    fontSize: 11.5,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
  },
});
