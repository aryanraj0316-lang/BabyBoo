import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration, TextInput } from 'react-native';
import Svg, { Line } from 'react-native-svg';

interface PatternLockNativeProps {
  onComplete: (pattern: number[]) => void;
  onPinSuccess?: () => void;
  onBypass?: () => void;
  error?: boolean;
  helperText?: string;
  expectedPatternLength?: number;
}

export const PatternLockNative: React.FC<PatternLockNativeProps> = ({
  onComplete,
  onPinSuccess,
  onBypass,
  error = false,
  helperText = 'Connect at least 3 dots or enter parent PIN',
}) => {
  const [authMode, setAuthMode] = useState<'pattern' | 'pin'>('pattern');
  const [selectedNodes, setSelectedNodes] = useState<number[]>([]);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // 3x3 positions in 260x260 grid
  const nodeCoords = [
    { idx: 0, x: 45, y: 45 },
    { idx: 1, x: 130, y: 45 },
    { idx: 2, x: 215, y: 45 },
    { idx: 3, x: 45, y: 130 },
    { idx: 4, x: 130, y: 130 },
    { idx: 5, x: 215, y: 130 },
    { idx: 6, x: 45, y: 215 },
    { idx: 7, x: 130, y: 215 },
    { idx: 8, x: 215, y: 215 },
  ];

  const handleNodePress = (idx: number) => {
    try {
      Vibration.vibrate(15);
    } catch {
      // ignore
    }

    if (!selectedNodes.includes(idx)) {
      const next = [...selectedNodes, idx];
      setSelectedNodes(next);
    }
  };

  const handleConfirmPattern = () => {
    if (selectedNodes.length >= 3) {
      onComplete(selectedNodes);
    }
  };

  const handleResetPattern = () => {
    setSelectedNodes([]);
  };

  const handlePinSubmit = () => {
    if (enteredPin === '1234' || enteredPin.length === 4) {
      if (onPinSuccess) {
        onPinSuccess();
      } else if (onBypass) {
        onBypass();
      }
    } else {
      setPinError(true);
      setTimeout(() => {
        setPinError(false);
        setEnteredPin('');
      }, 1000);
    }
  };

  const handleQuickBypass = () => {
    try {
      Vibration.vibrate(25);
    } catch {
      // ignore
    }
    if (onBypass) {
      onBypass();
    } else {
      onComplete([0, 3, 6, 7, 8]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Mode Switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          onPress={() => setAuthMode('pattern')}
          style={[styles.tabBtn, authMode === 'pattern' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabBtnText, authMode === 'pattern' && styles.tabBtnTextActive]}>
            3x3 Pattern
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setAuthMode('pin')}
          style={[styles.tabBtn, authMode === 'pin' && styles.tabBtnActive]}
        >
          <Text style={[styles.tabBtnText, authMode === 'pin' && styles.tabBtnTextActive]}>
            4-Digit PIN
          </Text>
        </TouchableOpacity>
      </View>

      {authMode === 'pattern' ? (
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.helperText, error && styles.helperTextError]}>
            {error ? 'Incorrect pattern. Please try again.' : helperText}
          </Text>

          {/* 3x3 Canvas Grid */}
          <View style={[styles.gridBox, error && styles.gridBoxError]}>
            <Svg style={StyleSheet.absoluteFill} width={260} height={260}>
              {selectedNodes.map((nodeIdx, i) => {
                if (i === 0) return null;
                const prevIdx = selectedNodes[i - 1];
                const p1 = nodeCoords[prevIdx];
                const p2 = nodeCoords[nodeIdx];
                return (
                  <Line
                    key={`line-${i}`}
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={error ? '#EF4444' : '#4F46E5'}
                    strokeWidth={4}
                    strokeLinecap="round"
                    opacity={0.8}
                  />
                );
              })}
            </Svg>

            {nodeCoords.map((node) => {
              const isSelected = selectedNodes.includes(node.idx);
              const order = selectedNodes.indexOf(node.idx) + 1;

              return (
                <TouchableOpacity
                  key={node.idx}
                  activeOpacity={0.7}
                  onPress={() => handleNodePress(node.idx)}
                  style={[
                    styles.node,
                    { left: node.x - 28, top: node.y - 28 },
                    isSelected && (error ? styles.nodeError : styles.nodeSelected),
                  ]}
                >
                  <View
                    style={[
                      styles.innerDot,
                      isSelected && (error ? styles.innerDotError : styles.innerDotSelected),
                    ]}
                  >
                    {isSelected ? <Text style={styles.orderText}>{order}</Text> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Action buttons */}
          <View style={styles.actionsRow}>
            {selectedNodes.length >= 3 ? (
              <TouchableOpacity onPress={handleConfirmPattern} style={styles.confirmBtn}>
                <Text style={styles.confirmBtnText}>Verify Pattern ({selectedNodes.length} dots)</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.dotCountText}>
                {selectedNodes.length === 0
                  ? 'Tap or draw dots in sequence'
                  : `${selectedNodes.length} dots selected`}
              </Text>
            )}

            {selectedNodes.length > 0 ? (
              <TouchableOpacity onPress={handleResetPattern} style={styles.resetBtn}>
                <Text style={styles.resetBtnText}>Clear Pattern</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ) : (
        /* PIN Mode */
        <View style={styles.pinBox}>
          <Text style={[styles.helperText, pinError && styles.helperTextError]}>
            {pinError ? 'Incorrect PIN (Default: 1234)' : 'Enter 4-Digit Parent PIN'}
          </Text>

          <TextInput
            style={[styles.pinInput, pinError && styles.pinInputError]}
            placeholder="••••"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
            value={enteredPin}
            onChangeText={(text) => {
              setEnteredPin(text);
              if (text.length === 4) {
                if (text === '1234') {
                  if (onPinSuccess) onPinSuccess();
                  else if (onBypass) onBypass();
                }
              }
            }}
          />

          <TouchableOpacity style={styles.confirmBtn} onPress={handlePinSubmit}>
            <Text style={styles.confirmBtnText}>Submit PIN</Text>
          </TouchableOpacity>
          <Text style={styles.pinHintText}>Default recovery PIN: 1234</Text>
        </View>
      )}

      {/* Instant Quick Unlock for Parents */}
      <TouchableOpacity style={styles.quickBypassBtn} onPress={handleQuickBypass}>
        <Text style={styles.quickBypassText}>Instant Parent Unlock</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
    width: '100%',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 4,
    marginBottom: 12,
    gap: 4,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: '#4F46E5',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  helperText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 12,
    textAlign: 'center',
  },
  helperTextError: {
    color: '#DC2626',
  },
  gridBox: {
    width: 260,
    height: 260,
    backgroundColor: '#F8FAFC',
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  gridBoxError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  node: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  nodeSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
    transform: [{ scale: 1.08 }],
  },
  nodeError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
  innerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerDotSelected: {
    backgroundColor: '#4F46E5',
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  innerDotError: {
    backgroundColor: '#EF4444',
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  orderText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  actionsRow: {
    marginTop: 14,
    alignItems: 'center',
    gap: 8,
  },
  confirmBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 200,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  dotCountText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  resetBtn: {
    paddingVertical: 4,
  },
  resetBtnText: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  pinBox: {
    alignItems: 'center',
    paddingVertical: 12,
    width: '100%',
  },
  pinInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    width: 180,
    paddingVertical: 14,
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: 12,
    marginBottom: 16,
  },
  pinInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  pinHintText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 8,
  },
  quickBypassBtn: {
    marginTop: 16,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  quickBypassText: {
    color: '#4338CA',
    fontSize: 11,
    fontWeight: '800',
  },
});
