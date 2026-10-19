import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Rect,
  Line,
  Polyline,
} from 'react-native-svg';
import { AccessibilityDisclosureScreen } from './AccessibilityDisclosureScreen';

export interface UserProfile {
  name: string;
  email: string;
  avatarInitial: string;
  role: string;
  memberSince: string;
}

export interface SettingsDrawerHubProps {
  initialLoggedIn?: boolean;
  userProfile?: UserProfile;
  activeChildName?: string;
  bottomPadding?: number;
  onClose?: () => void;
  onNavigateSchedule?: () => void;
  onNavigateAnalytics?: () => void;
  onModifyPin?: () => void;
  onLoadDemoProfiles?: () => void;
  onResetOnboarding?: () => void;
}

export const SettingsDrawerHubNative: React.FC<SettingsDrawerHubProps> = ({
  userProfile = {
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@familycloud.org',
    avatarInitial: 'S',
    role: 'Primary Parent Guardian',
    memberSince: 'March 2026',
  },
  activeChildName = 'Leo',
  bottomPadding = 90,
  onClose,
  onModifyPin,
  onResetOnboarding,
}) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(true);
  const [showA11yDisclosure, setShowA11yDisclosure] = useState<boolean>(false);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onClose}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityLabel="Back to dashboard"
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Controls & Preferences</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Parent Account & Security */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#5D997C" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </Svg>
              <Text style={styles.cardTitle}>Parent Account & Security</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>PIN Protected</Text>
            </View>
          </View>

          <View style={styles.rowBox}>
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>{userProfile.name}</Text>
              <Text style={styles.accountEmail}>{userProfile.email}</Text>
            </View>
            {onModifyPin && (
              <TouchableOpacity
                onPress={onModifyPin}
                style={styles.pinButton}
                activeOpacity={0.8}
              >
                <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#5D997C" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M21 2l-2 2m-1.5 1.5L16 7l-1.5-1.5 2-2 1.5 1.5z" />
                  <Circle cx="7.5" cy="15.5" r="5.5" />
                  <Path d="M16 7l-4.5 4.5" />
                </Svg>
                <Text style={styles.pinButtonText}>Change PIN</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Child Profile Status */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#5D997C" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <Rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <Line x1="12" y1="18" x2="12.01" y2="18" />
              </Svg>
              <Text style={styles.cardTitle}>Active Child Profile</Text>
            </View>
          </View>

          <View style={styles.rowBox}>
            <View style={styles.childAvatar}>
              <Text style={styles.childAvatarText}>
                {activeChildName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.childName}>{activeChildName}</Text>
              <Text style={styles.childMeta}>Active Screen-Time Protected Profile</Text>
            </View>
          </View>
        </View>

        {/* Audio & Haptic Preferences */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#5D997C" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M11 5L6 9H2v6h4l5 4V5z" />
                <Path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </Svg>
              <Text style={styles.cardTitle}>Audio & Haptics</Text>
            </View>
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Procedural Sound Effects</Text>
              <Text style={styles.toggleSub}>Gentle marimba chimes & wrap-up countdown cues</Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: '#E2E8F0', true: '#5D997C' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.toggleRow, { borderTopWidth: 1, borderTopColor: '#F1ECE4', marginTop: 10, paddingTop: 10 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Haptic Feedback</Text>
              <Text style={styles.toggleSub}>Subtle tactile vibrations on button taps & alerts</Text>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              trackColor={{ false: '#E2E8F0', true: '#5D997C' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Privacy & COPPA Guarantee */}
        <View style={styles.privacyCard}>
          <View style={styles.privacyHeader}>
            <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#5D997C" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </Svg>
            <Text style={styles.privacyTitle}>COPPA & Child Privacy Architecture</Text>
          </View>
          <Text style={styles.privacyText}>
            BabyBoo never collects biometric data, camera input, or microphone recordings. All screen time settings and progress logs reside securely on-device.
          </Text>
        </View>

        {/* Accessibility Service Disclosure (Google Play Compliance) */}
        <TouchableOpacity
          onPress={() => setShowA11yDisclosure(true)}
          style={styles.a11yDisclosureBtn}
          activeOpacity={0.8}
          accessibilityLabel="View Accessibility Service Disclosure"
        >
          <View style={styles.a11yDisclosureLeft}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </Svg>
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.a11yDisclosureTitle}>Accessibility Service Disclosure</Text>
              <Text style={styles.a11yDisclosureSub}>Learn how BabyBoo protects lockout sessions</Text>
            </View>
          </View>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M9 18l6-6-6-6" />
          </Svg>
        </TouchableOpacity>

        {/* Sign Out / Exit Action */}
        <TouchableOpacity
          onPress={onClose}
          style={styles.signOutBtn}
          activeOpacity={0.8}
        >
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <Polyline points="16 17 21 12 16 7" />
            <Line x1="21" y1="12" x2="9" y2="12" />
          </Svg>
          <Text style={styles.signOutText}>Close Settings</Text>
        </TouchableOpacity>

        {onResetOnboarding && (
          <TouchableOpacity
            onPress={onResetOnboarding}
            style={styles.resetLink}
            activeOpacity={0.7}
          >
            <Text style={styles.resetLinkText}>Reset Onboarding Assessment</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Prominent Accessibility Disclosure Modal */}
      <AccessibilityDisclosureScreen
        visible={showA11yDisclosure}
        onClose={() => setShowA11yDisclosure(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#EAE5DE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EAE5DE',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A2436',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAE5DE',
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: '#EBF4EF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#5D997C',
  },
  rowBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EAE5DE',
    borderRadius: 12,
    padding: 10,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A2436',
  },
  accountEmail: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  pinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE5DE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  pinButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1A2436',
  },
  childAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#5D997C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  childAvatarText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  childName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A2436',
  },
  childMeta: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A2436',
  },
  toggleSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  privacyCard: {
    backgroundColor: 'rgba(235, 244, 239, 0.75)',
    borderWidth: 1,
    borderColor: '#D1E6DA',
    borderRadius: 18,
    padding: 14,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  privacyTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2D5441',
  },
  privacyText: {
    fontSize: 11,
    color: '#2D5441',
    lineHeight: 16,
    opacity: 0.85,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE5DE',
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 4,
  },
  signOutText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  resetLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  resetLinkText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#94A3B8',
    textDecorationLine: 'underline',
  },
  a11yDisclosureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 16,
    padding: 12,
  },
  a11yDisclosureLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  a11yDisclosureTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#3730A3',
  },
  a11yDisclosureSub: {
    fontSize: 10,
    fontWeight: '500',
    color: '#4F46E5',
    marginTop: 1,
  },
});
