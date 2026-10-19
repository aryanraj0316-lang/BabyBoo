import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  Modal,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

export interface AccessibilityDisclosureScreenProps {
  visible?: boolean;
  onClose?: () => void;
  onEnable?: () => void;
}

export const AccessibilityDisclosureScreen: React.FC<AccessibilityDisclosureScreenProps> = ({
  visible = true,
  onClose,
  onEnable,
}) => {
  const handleEnable = async () => {
    if (onEnable) {
      onEnable();
      return;
    }
    try {
      // Try to open Android Accessibility settings directly
      if (Platform.OS === 'android') {
        const { NativeModules } = require('react-native');
        if (NativeModules.HandoverNative?.openPermissionSettings) {
          await NativeModules.HandoverNative.openPermissionSettings('accessibility');
        } else {
          await Linking.openSettings();
        }
      } else {
        await Linking.openSettings();
      }
    } catch (_e) {
      Linking.openSettings();
    }
    if (onClose) onClose();
  };

  const handleLearnMore = () => {
    Linking.openURL('https://babyboo.app/privacy');
  };

  const content = (
    <View style={styles.overlay}>
      <View style={styles.card}>
        {/* Shield Icon Badge */}
        <View style={styles.iconWrap}>
          <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </Svg>
        </View>

        {/* Verbatim Required Title */}
        <Text style={styles.title}>BabyBoo uses Android's Accessibility Service</Text>

        {/* Verbatim Required Body Copy */}
        <Text style={styles.body}>
          BabyBoo watches for app changes so it can show a full-screen blackout and hold the
          device locked. It does not collect or share personal data.{' '}
          <Text style={styles.link} onPress={handleLearnMore}>
            [Learn more]
          </Text>
        </Text>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.enableButton}
          onPress={handleEnable}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Enable in Settings"
        >
          <Text style={styles.enableText}>Enable in Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.notNowButton}
          onPress={onClose}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Not now"
        >
          <Text style={styles.notNowText}>Not now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      {content}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 14,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: '#334155',
    textAlign: 'center',
    marginBottom: 24,
  },
  link: {
    color: '#4F46E5',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  enableButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  enableText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  notNowButton: {
    width: '100%',
    height: 44,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notNowText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
});
