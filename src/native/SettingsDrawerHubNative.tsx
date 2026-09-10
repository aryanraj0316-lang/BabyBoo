import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  TextInput,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Rect,
  G,
  Defs,
  LinearGradient,
  Stop,
  Line,
  Polyline,
} from 'react-native-svg';

const { width } = Dimensions.get('window');

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
  onClose?: () => void;
  onNavigateSchedule?: () => void;
  onNavigateAnalytics?: () => void;
  onModifyPin?: () => void;
  onLoadDemoProfiles?: () => void;
  onResetOnboarding?: () => void;
}

export const SettingsDrawerHubNative: React.FC<SettingsDrawerHubProps> = ({
  initialLoggedIn = true,
  userProfile = {
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@familycloud.org',
    avatarInitial: 'S',
    role: 'Primary Parent Admin',
    memberSince: 'March 2026',
  },
  activeChildName = 'Leo',
  onClose,
  onNavigateSchedule,
  onNavigateAnalytics,
  onModifyPin,
  onLoadDemoProfiles,
  onResetOnboarding,
}) => {
  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(initialLoggedIn);
  const [currentUser, setCurrentUser] = useState<UserProfile>(userProfile);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginEmailInput, setLoginEmailInput] = useState<string>('sarah.jenkins@familycloud.org');
  const [loginPasswordInput, setLoginPasswordInput] = useState<string>('••••••••');
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState<boolean>(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState<boolean>(false);

  // Core Configurations - Automation & Scheduling
  const [weeklyPatternEnabled, setWeeklyPatternEnabled] = useState<boolean>(true);
  const [singleDayOverride, setSingleDayOverride] = useState<boolean>(false);
  const [sessionLimitStrict, setSessionLimitStrict] = useState<boolean>(true);

  // Security & PIN Code
  const [pinLockActive, setPinLockActive] = useState<boolean>(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState<boolean>(true);
  const [instantLockOnExit, setInstantLockOnExit] = useState<boolean>(true);

  // Notification & Audio Preferences
  const [mascotVoiceCountdown, setMascotVoiceCountdown] = useState<boolean>(true);
  const [volumeLevel, setVolumeLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [alertReminders, setAlertReminders] = useState<boolean>(true);
  const [nightModeDND, setNightModeDND] = useState<boolean>(false);

  // Interactive Sub-Modals
  const [showFaqModal, setShowFaqModal] = useState<boolean>(false);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);
  const [showTroubleshootModal, setShowTroubleshootModal] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [feedbackCategory, setFeedbackCategory] = useState<'Bug' | 'Feature Request' | 'Question'>('Feature Request');
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [showLegalModal, setShowLegalModal] = useState<boolean>(false);
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy'>('terms');

  // FAQ Data
  const FAQ_ITEMS = [
    {
      q: 'How does the gentle bedtime & warning routine prevent tantrums?',
      a: 'Buddy cues the child at 80% of screen time with a friendly wave, followed by a cooperative countdown. Rather than an abrupt shutdown, the device shifts into low-battery or rest mode, removing the parent as the target of resistance.',
    },
    {
      q: 'What if my child tries to close or switch the app?',
      a: 'Parental PIN Code and system lock persistence ensure that unauthorized app exiting triggers the security pattern screen before granting device-wide access.',
    },
    {
      q: 'How do quick widgets work on my phone home screen?',
      a: 'You can configure any desired phone usage duration in hours and minutes in the Schedule tab, and tap "Add Widget" to place a 1-tap start button on your phone home screen.',
    },
    {
      q: 'Can I set different daily rules for school days vs weekends?',
      a: 'Yes! In the Automation & Scheduling section, you can define active recurring days of the week and apply single-day overrides for weekend flexibility.',
    },
  ];

  const handleLoginSubmit = () => {
    if (!loginEmailInput.trim()) return;
    const namePart = loginEmailInput.split('@')[0];
    const capitalized = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    setCurrentUser({
      name: capitalized || 'Parent User',
      email: loginEmailInput,
      avatarInitial: (capitalized.charAt(0) || 'P').toUpperCase(),
      role: 'Primary Parent Admin',
      memberSince: 'September 2026',
    });
    setIsLoggedIn(true);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowLogoutConfirmModal(false);
  };

  const handleDeleteAccount = () => {
    setIsLoggedIn(false);
    setShowDeleteAccountModal(false);
    Alert.alert('Account Purged', 'All localized family schedules and profiles have been securely reset.');
  };

  return (
    <View style={styles.container}>
      {/* 0. Top Drawer Hub Header Bar */}
      <View style={styles.topDrawerBar}>
        <View style={styles.topDrawerLeft}>
          <View style={styles.drawerHandleBar} />
          <Text style={styles.topDrawerTitle}>Settings Hub</Text>
        </View>

        {onClose && (
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={onClose}
            style={styles.drawerCloseButton}
            accessibilityLabel="Close Drawer"
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth={2.4}>
              <Line x1="18" y1="6" x2="6" y2="18" />
              <Line x1="6" y1="6" x2="18" y2="18" />
            </Svg>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================================= */}
        {/* 1. USER PROFILE HEADER & AUTH STATE */}
        {/* ========================================================================= */}
        {isLoggedIn ? (
          /* Logged-In Card View */
          <View style={styles.profileHeaderCard}>
            <View style={styles.profileTopRow}>
              <View style={styles.profileAvatarOuter}>
                <View style={styles.profileAvatarInner}>
                  <Text style={styles.profileAvatarText}>{currentUser.avatarInitial}</Text>
                </View>
                <View style={styles.activeStatusDot} />
              </View>

              <View style={styles.profileMetaInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.profileNameText} numberOfLines={1}>
                    {currentUser.name}
                  </Text>
                  <View style={styles.familyAdminBadge}>
                    <Text style={styles.familyAdminBadgeText}>ADMIN</Text>
                  </View>
                </View>
                <Text style={styles.profileEmailText} numberOfLines={1}>
                  {currentUser.email}
                </Text>
                <Text style={styles.profileMemberText}>
                  Member since {currentUser.memberSince} • Child: {activeChildName}
                </Text>
              </View>
            </View>

            {/* Pastel Accent Ribbon */}
            <View style={styles.pastelPillRow}>
              <View style={[styles.pastelChip, { backgroundColor: '#C4F18D' }]}>
                <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#1A2238" strokeWidth={2.5}>
                  <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </Svg>
                <Text style={[styles.pastelChipText, { color: '#1A2238' }]}>Cloud Sync Protected</Text>
              </View>
              <View style={[styles.pastelChip, { backgroundColor: '#7AE5F5' }]}>
                <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#1A2238" strokeWidth={2.5}>
                  <Circle cx="12" cy="12" r="10" />
                  <Polyline points="12 6 12 12 16 14" />
                </Svg>
                <Text style={[styles.pastelChipText, { color: '#1A2238' }]}>Auto Schedule Linked</Text>
              </View>
            </View>
          </View>
        ) : (
          /* Logged-Out Prominent Card View */
          <View style={styles.loggedOutCard}>
            <View style={styles.loggedOutCardGlow} />
            <View style={styles.loggedOutHeaderRow}>
              <View style={styles.loggedOutIconBox}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#C4F18D" strokeWidth={2.2}>
                  <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <Circle cx="12" cy="7" r="4" />
                </Svg>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.loggedOutTitle}>Connect Family Account</Text>
                <Text style={styles.loggedOutSub}>
                  Sync screen-time schedules & protect settings across all family devices
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => setShowLoginModal(true)}
              style={styles.loginProminentBtn}
            >
              <View style={styles.loginBtnContent}>
                <Text style={styles.loginBtnText}>Log In / Sign Up</Text>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#1A2238" strokeWidth={2.5}>
                  <Path d="M5 12h14M12 5l7 7-7 7" />
                </Svg>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================================================= */}
        {/* 2. CORE CONFIGURATION CATEGORIES (GROUPED LISTS) */}
        {/* ========================================================================= */}

        {/* CATEGORY A: Automation & Scheduling */}
        <View style={styles.categoryCard}>
          <View style={styles.categoryHeader}>
            <View style={[styles.categoryIconBadge, { backgroundColor: 'rgba(196, 241, 141, 0.15)' }]}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#C4F18D" strokeWidth={2.2}>
                <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <Line x1="16" y1="2" x2="16" y2="6" />
                <Line x1="8" y1="2" x2="8" y2="6" />
                <Line x1="3" y1="10" x2="21" y2="10" />
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.categoryTitle}>Automation & Scheduling</Text>
              <Text style={styles.categorySub}>Rules, weekly routines & overrides</Text>
            </View>
          </View>

          {/* Row 1: Recurring Weekly Patterns */}
          <View style={styles.settingRow}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingMainText}>Recurring Weekly Patterns</Text>
              <Text style={styles.settingSubText}>
                Active: Mon, Tue, Wed, Thu, Fri • 8:00 PM routine
              </Text>
            </View>
            <Switch
              value={weeklyPatternEnabled}
              onValueChange={setWeeklyPatternEnabled}
              trackColor={{ false: '#334155', true: '#4F46E5' }}
              thumbColor={weeklyPatternEnabled ? '#C4F18D' : '#94A3B8'}
            />
          </View>

          {/* Row 2: Single-Day Overrides */}
          <View style={styles.settingRow}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingMainText}>Single-Day Overrides</Text>
              <Text style={styles.settingSubText}>
                Allow +30m weekend holiday extension without resetting limits
              </Text>
            </View>
            <Switch
              value={singleDayOverride}
              onValueChange={setSingleDayOverride}
              trackColor={{ false: '#334155', true: '#4F46E5' }}
              thumbColor={singleDayOverride ? '#C4F18D' : '#94A3B8'}
            />
          </View>

          {/* Row 3: Session Limit Rules */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onNavigateSchedule}
            style={styles.settingInteractiveRow}
          >
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingMainText}>Session Limit Rules & Quick Widget</Text>
              <Text style={styles.settingSubText}>
                Configure hours/minutes timer launcher & bedtime warnings
              </Text>
            </View>
            <View style={styles.navChevronBox}>
              <Text style={styles.navChevronText}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* CATEGORY B: Security & PIN Code */}
        <View style={styles.categoryCard}>
          <View style={styles.categoryHeader}>
            <View style={[styles.categoryIconBadge, { backgroundColor: 'rgba(122, 229, 245, 0.15)' }]}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#7AE5F5" strokeWidth={2.2}>
                <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.categoryTitle}>Security & PIN Code</Text>
              <Text style={styles.categorySub}>Protect parent controls from curious hands</Text>
            </View>
          </View>

          {/* Row 1: Parental PIN Lock */}
          <View style={styles.settingRow}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingMainText}>Parental PIN Lock Gate</Text>
              <Text style={styles.settingSubText}>
                {pinLockActive ? 'Active: Required to modify settings or exit timer' : 'Disabled (Not Recommended)'}
              </Text>
            </View>
            <Switch
              value={pinLockActive}
              onValueChange={setPinLockActive}
              trackColor={{ false: '#334155', true: '#4F46E5' }}
              thumbColor={pinLockActive ? '#7AE5F5' : '#94A3B8'}
            />
          </View>

          {/* Row 2: Modify PIN */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onModifyPin}
            style={styles.settingInteractiveRow}
          >
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingMainText}>Set or Modify PIN Code</Text>
              <Text style={styles.settingSubText}>Change 4-digit master parent passcode</Text>
            </View>
            <View style={[styles.miniActionBtn, { backgroundColor: 'rgba(122, 229, 245, 0.15)' }]}>
              <Text style={[styles.miniActionBtnText, { color: '#7AE5F5' }]}>Change</Text>
            </View>
          </TouchableOpacity>

          {/* Row 3: Biometric Authentication */}
          <View style={styles.settingRow}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingMainText}>Biometric Authentication</Text>
              <Text style={styles.settingSubText}>Face ID / Fingerprint parent quick-bypass</Text>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={setBiometricsEnabled}
              trackColor={{ false: '#334155', true: '#4F46E5' }}
              thumbColor={biometricsEnabled ? '#7AE5F5' : '#94A3B8'}
            />
          </View>

          {/* Row 4: Instant Lock on Exit */}
          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingMainText}>Instant Lock After App Exit</Text>
              <Text style={styles.settingSubText}>Re-locks instantly when phone screen turns off</Text>
            </View>
            <Switch
              value={instantLockOnExit}
              onValueChange={setInstantLockOnExit}
              trackColor={{ false: '#334155', true: '#4F46E5' }}
              thumbColor={instantLockOnExit ? '#7AE5F5' : '#94A3B8'}
            />
          </View>
        </View>

        {/* CATEGORY C: Notification & Audio Preferences */}
        <View style={styles.categoryCard}>
          <View style={styles.categoryHeader}>
            <View style={[styles.categoryIconBadge, { backgroundColor: 'rgba(196, 241, 141, 0.15)' }]}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#C4F18D" strokeWidth={2.2}>
                <Path d="M11 5L6 9H2v6h4l5 4V5z" />
                <Path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.categoryTitle}>Notification & Audio</Text>
              <Text style={styles.categorySub}>Voice cues, volume and reminder sounds</Text>
            </View>
          </View>

          {/* Row 1: Mascot Voice Countdown */}
          <View style={styles.settingRow}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingMainText}>Mascot Voice Countdown</Text>
              <Text style={styles.settingSubText}>
                Buddy speaks friendly audio cues during the final countdown
              </Text>
            </View>
            <Switch
              value={mascotVoiceCountdown}
              onValueChange={setMascotVoiceCountdown}
              trackColor={{ false: '#334155', true: '#4F46E5' }}
              thumbColor={mascotVoiceCountdown ? '#C4F18D' : '#94A3B8'}
            />
          </View>

          {/* Row 2: Volume Level Selector */}
          <View style={styles.settingRow}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingMainText}>Audio Volume Level</Text>
              <Text style={styles.settingSubText}>Balanced so child hears without disturbing home</Text>
            </View>
            <View style={styles.volumeSegment}>
              {(['low', 'medium', 'high'] as const).map((lvl) => (
                <TouchableOpacity
                  key={lvl}
                  onPress={() => setVolumeLevel(lvl)}
                  style={[
                    styles.volumeSegmentBtn,
                    volumeLevel === lvl && styles.volumeSegmentBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.volumeSegmentText,
                      volumeLevel === lvl && styles.volumeSegmentTextActive,
                    ]}
                  >
                    {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Row 3: Alert Reminders */}
          <View style={styles.settingRow}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingMainText}>Pre-Warning Reminders</Text>
              <Text style={styles.settingSubText}>Gentle chime 5 minutes before scheduled bedtime</Text>
            </View>
            <Switch
              value={alertReminders}
              onValueChange={setAlertReminders}
              trackColor={{ false: '#334155', true: '#4F46E5' }}
              thumbColor={alertReminders ? '#C4F18D' : '#94A3B8'}
            />
          </View>

          {/* Row 4: Night Routine Silence */}
          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingMainText}>Whisper Mode for Bedtime</Text>
              <Text style={styles.settingSubText}>Soft soothing voice after 7:30 PM</Text>
            </View>
            <Switch
              value={nightModeDND}
              onValueChange={setNightModeDND}
              trackColor={{ false: '#334155', true: '#4F46E5' }}
              thumbColor={nightModeDND ? '#C4F18D' : '#94A3B8'}
            />
          </View>
        </View>

        {/* CATEGORY D: Help & Support */}
        <View style={styles.categoryCard}>
          <View style={styles.categoryHeader}>
            <View style={[styles.categoryIconBadge, { backgroundColor: 'rgba(122, 229, 245, 0.15)' }]}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#7AE5F5" strokeWidth={2.2}>
                <Circle cx="12" cy="12" r="10" />
                <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <Line x1="12" y1="17" x2="12.01" y2="17" />
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.categoryTitle}>Help & Support</Text>
              <Text style={styles.categorySub}>Guides, troubleshooting & parent feedback</Text>
            </View>
          </View>

          {/* Built-in FAQ Guide */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowFaqModal(true)}
            style={styles.settingInteractiveRow}
          >
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingMainText}>Built-in FAQ Guide</Text>
              <Text style={styles.settingSubText}>Answers to common questions about tantrum prevention</Text>
            </View>
            <View style={styles.navChevronBox}>
              <Text style={styles.navChevronText}>›</Text>
            </View>
          </TouchableOpacity>

          {/* Troubleshooting Tips */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowTroubleshootModal(true)}
            style={styles.settingInteractiveRow}
          >
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingMainText}>Troubleshooting & Permissions</Text>
              <Text style={styles.settingSubText}>Battery optimization, screen overlay & lock diagnostics</Text>
            </View>
            <View style={styles.navChevronBox}>
              <Text style={styles.navChevronText}>›</Text>
            </View>
          </TouchableOpacity>

          {/* Direct Feedback / Feature Request Form */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setFeedbackSubmitted(false);
              setShowFeedbackModal(true);
            }}
            style={[styles.settingInteractiveRow, { borderBottomWidth: 0 }]}
          >
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingMainText}>Direct Feedback & Feature Request</Text>
              <Text style={styles.settingSubText}>Tell the engineering team what you'd love next</Text>
            </View>
            <View style={[styles.miniActionBtn, { backgroundColor: 'rgba(196, 241, 141, 0.15)' }]}>
              <Text style={[styles.miniActionBtnText, { color: '#C4F18D' }]}>Share</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* CATEGORY E: Legal & Privacy */}
        <View style={styles.categoryCard}>
          <View style={styles.categoryHeader}>
            <View style={[styles.categoryIconBadge, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth={2.2}>
                <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <Polyline points="14 2 14 8 20 8" />
                <Line x1="16" y1="13" x2="8" y2="13" />
                <Line x1="16" y1="17" x2="8" y2="17" />
                <Polyline points="10 9 9 9 8 9" />
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.categoryTitle}>Legal & Privacy</Text>
              <Text style={styles.categorySub}>COPPA certified family data commitments</Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setLegalModalType('privacy');
              setShowLegalModal(true);
            }}
            style={styles.settingInteractiveRow}
          >
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingMainText}>Privacy Policy (Child Safe)</Text>
              <Text style={styles.settingSubText}>100% localized analytics • Zero ad trackers</Text>
            </View>
            <View style={styles.navChevronBox}>
              <Text style={styles.navChevronText}>›</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setLegalModalType('terms');
              setShowLegalModal(true);
            }}
            style={[styles.settingInteractiveRow, { borderBottomWidth: 0 }]}
          >
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingMainText}>Terms of Service</Text>
              <Text style={styles.settingSubText}>Application usage agreement & family license</Text>
            </View>
            <View style={styles.navChevronBox}>
              <Text style={styles.navChevronText}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ========================================================================= */}
        {/* 3. SESSION ACTION FOOTER */}
        {/* ========================================================================= */}
        <View style={styles.footerSection}>
          {isLoggedIn ? (
            <View style={styles.authActionGroup}>
              {/* Secure Log Out Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setShowLogoutConfirmModal(true)}
                style={styles.logoutButton}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth={2.2}>
                  <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <Polyline points="16 17 21 12 16 7" />
                  <Line x1="21" y1="12" x2="9" y2="12" />
                </Svg>
                <Text style={styles.logoutButtonText}>Log Out of Account</Text>
              </TouchableOpacity>

              {/* Option for Account Deletion */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowDeleteAccountModal(true)}
                style={styles.deleteAccountBtn}
              >
                <Text style={styles.deleteAccountText}>
                  Delete Account & Reset Data
                </Text>
              </TouchableOpacity>

              {/* Developer & Testing Options */}
              {onLoadDemoProfiles && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={onLoadDemoProfiles}
                  style={styles.demoDataBtn}
                >
                  <Text style={styles.demoDataBtnText}>
                    ✨ Load Sample Profiles (Leo & Maya)
                  </Text>
                </TouchableOpacity>
              )}

              {onResetOnboarding && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={onResetOnboarding}
                  style={styles.replayOnboardingBtn}
                >
                  <Text style={styles.replayOnboardingBtnText}>
                    🔄 Replay Onboarding Assessment
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowLoginModal(true)}
              style={styles.footerLoginButton}
            >
              <Text style={styles.footerLoginButtonText}>Sign In to BabyBoo Cloud</Text>
            </TouchableOpacity>
          )}

          {/* Build Info */}
          <Text style={styles.buildInfoText}>
            BabyBoo OS v1.4.2 • Build 2026.09 • Pediatric Screen Safety Engine
          </Text>
        </View>
      </ScrollView>

      {/* ========================================================================= */}
      {/* 4. MODALS (LOG IN, FAQ, TROUBLESHOOTING, FEEDBACK, LEGAL) */}
      {/* ========================================================================= */}

      {/* A. LOG IN / SIGN UP MODAL */}
      <Modal visible={showLoginModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalHeading}>Family Cloud Login</Text>
                <Text style={styles.modalSubheading}>Access shared schedules across devices</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowLoginModal(false)}
                style={styles.modalCloseIconBtn}
              >
                <Text style={{ color: '#94A3B8', fontSize: 16, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Parent Email</Text>
              <TextInput
                style={styles.textInput}
                value={loginEmailInput}
                onChangeText={setLoginEmailInput}
                placeholder="parent@family.com"
                placeholderTextColor="#64748B"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password / PIN</Text>
              <TextInput
                style={styles.textInput}
                value={loginPasswordInput}
                onChangeText={setLoginPasswordInput}
                placeholder="••••••••"
                placeholderTextColor="#64748B"
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleLoginSubmit}
              style={[styles.modalActionSubmitBtn, { backgroundColor: '#C4F18D' }]}
            >
              <Text style={[styles.modalActionSubmitText, { color: '#1A2238' }]}>
                Confirm & Log In (OK)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* B. FAQ GUIDE MODAL */}
      <Modal visible={showFaqModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContentCard, { maxHeight: '80%' }]}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalHeading}>Frequently Asked Questions</Text>
                <Text style={styles.modalSubheading}>Pediatric guidelines & how Buddy helps</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowFaqModal(false)}
                style={styles.modalCloseIconBtn}
              >
                <Text style={{ color: '#94A3B8', fontSize: 16, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 10 }}>
              {FAQ_ITEMS.map((item, idx) => {
                const isExpanded = expandedFaqIndex === idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.8}
                    onPress={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                    style={[
                      styles.faqItemBox,
                      isExpanded && { borderColor: '#7AE5F5', backgroundColor: 'rgba(122, 229, 245, 0.08)' },
                    ]}
                  >
                    <View style={styles.faqHeaderRow}>
                      <Text style={[styles.faqQuestionText, isExpanded && { color: '#7AE5F5' }]}>
                        {item.q}
                      </Text>
                      <Text style={styles.faqToggleSymbol}>{isExpanded ? '−' : '+'}</Text>
                    </View>
                    {isExpanded && (
                      <Text style={styles.faqAnswerText}>{item.a}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowFaqModal(false)}
              style={[styles.modalActionSubmitBtn, { marginTop: 12, backgroundColor: '#334155' }]}
            >
              <Text style={[styles.modalActionSubmitText, { color: '#FFFFFF' }]}>Close Guide</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* C. TROUBLESHOOTING MODAL */}
      <Modal visible={showTroubleshootModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalHeading}>Troubleshooting Diagnostics</Text>
                <Text style={styles.modalSubheading}>Ensure alarms and lock persistence stay active</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowTroubleshootModal(false)}
                style={styles.modalCloseIconBtn}
              >
                <Text style={{ color: '#94A3B8', fontSize: 16, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.diagRow}>
              <View style={[styles.diagDot, { backgroundColor: '#10B981' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.diagTitle}>Background Audio Permissions</Text>
                <Text style={styles.diagSub}>Active • Allows gentle bedtime countdown cues</Text>
              </View>
            </View>

            <View style={styles.diagRow}>
              <View style={[styles.diagDot, { backgroundColor: '#10B981' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.diagTitle}>Battery Saver Exemption</Text>
                <Text style={styles.diagSub}>Active • Timer won't freeze when phone is idle</Text>
              </View>
            </View>

            <View style={styles.diagRow}>
              <View style={[styles.diagDot, { backgroundColor: '#F59E0B' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.diagTitle}>Overlay Window Permission</Text>
                <Text style={styles.diagSub}>Recommended for full-screen low-battery illusion</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setShowTroubleshootModal(false)}
              style={[styles.modalActionSubmitBtn, { marginTop: 14, backgroundColor: '#7AE5F5' }]}
            >
              <Text style={[styles.modalActionSubmitText, { color: '#1A2238' }]}>Got It (OK)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* D. FEEDBACK / FEATURE REQUEST MODAL */}
      <Modal visible={showFeedbackModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalHeading}>Parent Feedback</Text>
                <Text style={styles.modalSubheading}>Help us improve Buddy for your family</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowFeedbackModal(false)}
                style={styles.modalCloseIconBtn}
              >
                <Text style={{ color: '#94A3B8', fontSize: 16, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {feedbackSubmitted ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <View style={styles.successIconCircle}>
                  <Text style={{ color: '#C4F18D', fontSize: 24, fontWeight: '900' }}>✓</Text>
                </View>
                <Text style={styles.successTitle}>Feedback Received!</Text>
                <Text style={styles.successSub}>
                  Thank you for helping us design safer digital habits for children.
                </Text>
                <TouchableOpacity
                  onPress={() => setShowFeedbackModal(false)}
                  style={[styles.modalActionSubmitBtn, { marginTop: 16, backgroundColor: '#C4F18D' }]}
                >
                  <Text style={[styles.modalActionSubmitText, { color: '#1A2238' }]}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.feedbackCatRow}>
                  {(['Feature Request', 'Question', 'Bug'] as const).map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setFeedbackCategory(cat)}
                      style={[
                        styles.feedbackCatBtn,
                        feedbackCategory === cat && styles.feedbackCatBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.feedbackCatText,
                          feedbackCategory === cat && styles.feedbackCatTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={styles.feedbackTextArea}
                  value={feedbackText}
                  onChangeText={setFeedbackText}
                  placeholder="Tell us what you'd like to see, or any routine adjustments you need..."
                  placeholderTextColor="#64748B"
                  multiline
                  numberOfLines={4}
                />

                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={!feedbackText.trim()}
                  onPress={() => setFeedbackSubmitted(true)}
                  style={[
                    styles.modalActionSubmitBtn,
                    {
                      backgroundColor: feedbackText.trim() ? '#C4F18D' : '#334155',
                      marginTop: 12,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.modalActionSubmitText,
                      { color: feedbackText.trim() ? '#1A2238' : '#94A3B8' },
                    ]}
                  >
                    Submit Feedback
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* E. LEGAL & PRIVACY MODAL */}
      <Modal visible={showLegalModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContentCard, { maxHeight: '75%' }]}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalHeading}>
                  {legalModalType === 'privacy' ? 'Child Privacy Policy' : 'Terms of Service'}
                </Text>
                <Text style={styles.modalSubheading}>
                  {legalModalType === 'privacy'
                    ? 'COPPA & GDPR-K Compliance Guarantee'
                    : 'Family Device License'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowLegalModal(false)}
                style={styles.modalCloseIconBtn}
              >
                <Text style={{ color: '#94A3B8', fontSize: 16, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ marginTop: 12 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.legalBodyText}>
                {legalModalType === 'privacy'
                  ? 'BabyBoo is strictly committed to pediatric digital safety. All session timers, routine habits, and behavioral stats are processed exclusively on the parent device. We do not sell child data, embed third-party advertising trackers, or share profile analytics with external networks.\n\nAll data is protected under localized encryption and complies with COPPA (Children’s Online Privacy Protection Act) safety standards.'
                  : 'By utilizing BabyBoo, you agree to implement routines that respect pediatric screen-time recommendations. BabyBoo acts as a habit facilitator and bedtime illusion simulator to help prevent device-withdrawal conflict.\n\nParents maintain full administrative authority over device permissions, limits, and unlock codes.'}
              </Text>
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowLegalModal(false)}
              style={[styles.modalActionSubmitBtn, { marginTop: 14, backgroundColor: '#334155' }]}
            >
              <Text style={[styles.modalActionSubmitText, { color: '#FFFFFF' }]}>Close (OK)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* F. LOGOUT CONFIRMATION MODAL */}
      <Modal visible={showLogoutConfirmModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContentCard, { maxWidth: 320 }]}>
            <Text style={styles.modalHeading}>Log Out?</Text>
            <Text style={[styles.modalSubheading, { marginTop: 4, marginBottom: 16 }]}>
              You will remain able to use local routines, but cloud backup and cross-device sync will pause.
            </Text>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setShowLogoutConfirmModal(false)}
                style={[styles.confirmBtnHalf, { backgroundColor: '#334155' }]}
              >
                <Text style={{ color: '#CBD5E1', fontWeight: '800' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleLogout}
                style={[styles.confirmBtnHalf, { backgroundColor: '#EF4444' }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* G. DELETE ACCOUNT CONFIRMATION MODAL */}
      <Modal visible={showDeleteAccountModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContentCard, { maxWidth: 320 }]}>
            <Text style={[styles.modalHeading, { color: '#F87171' }]}>Delete Account & Data?</Text>
            <Text style={[styles.modalSubheading, { marginTop: 4, marginBottom: 16, color: '#CBD5E1' }]}>
              This will permanently purge all child profiles, streaks, and customized routines from this device.
            </Text>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setShowDeleteAccountModal(false)}
                style={[styles.confirmBtnHalf, { backgroundColor: '#334155' }]}
              >
                <Text style={{ color: '#CBD5E1', fontWeight: '800' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteAccount}
                style={[styles.confirmBtnHalf, { backgroundColor: '#B91C1C' }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>Delete All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  topDrawerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 12 : 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE5DE',
  },
  topDrawerLeft: {
    flexDirection: 'column',
    gap: 4,
  },
  drawerHandleBar: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginBottom: 4,
  },
  topDrawerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1A2436',
    letterSpacing: -0.2,
  },
  drawerCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE5DE',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },

  /* 1. User Profile Header & Auth State */
  profileHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAE5DE',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileAvatarOuter: {
    position: 'relative',
  },
  profileAvatarInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EBF4EF',
    borderWidth: 2,
    borderColor: '#5D997C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5D997C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  profileAvatarText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2D5A43',
  },
  activeStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileMetaInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileNameText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1A2436',
  },
  familyAdminBadge: {
    backgroundColor: '#EBF4EF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(93, 153, 124, 0.4)',
  },
  familyAdminBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#2D5A43',
  },
  profileEmailText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
    marginTop: 2,
  },
  profileMemberText: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 3,
  },
  pastelPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EAE5DE',
  },
  pastelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  pastelChipText: {
    fontSize: 10.5,
    fontWeight: '900',
  },

  /* Logged-Out Card */
  loggedOutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#EAE5DE',
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  loggedOutCardGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(93, 153, 124, 0.1)',
  },
  loggedOutHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  loggedOutIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#EBF4EF',
    borderWidth: 1,
    borderColor: 'rgba(93, 153, 124, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loggedOutTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1A2436',
  },
  loggedOutSub: {
    fontSize: 11,
    color: '#718096',
    marginTop: 2,
    lineHeight: 15,
  },
  loginProminentBtn: {
    backgroundColor: '#5D997C',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#5D997C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  loginBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loginBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  /* 2. Core Configuration Categories */
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EAE5DE',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE5DE',
  },
  categoryIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#1A2436',
  },
  categorySub: {
    fontSize: 10.5,
    color: '#718096',
    marginTop: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE5DE',
  },
  settingInteractiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE5DE',
  },
  settingTextGroup: {
    flex: 1,
    marginRight: 10,
  },
  settingMainText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1A2436',
  },
  settingSubText: {
    fontSize: 10.5,
    color: '#718096',
    marginTop: 2,
    lineHeight: 14,
  },
  navChevronBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#FAF8F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navChevronText: {
    color: '#718096',
    fontSize: 16,
    fontWeight: '900',
    marginTop: -2,
  },
  miniActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  miniActionBtnText: {
    fontSize: 10.5,
    fontWeight: '900',
  },
  volumeSegment: {
    flexDirection: 'row',
    backgroundColor: '#FAF8F5',
    borderRadius: 10,
    padding: 3,
    gap: 3,
    borderWidth: 1,
    borderColor: '#EAE5DE',
  },
  volumeSegmentBtn: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
  },
  volumeSegmentBtnActive: {
    backgroundColor: '#5D997C',
  },
  volumeSegmentText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#718096',
  },
  volumeSegmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  /* 3. Session Action Footer */
  footerSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  authActionGroup: {
    gap: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 18,
    paddingVertical: 13,
  },
  logoutButtonText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#DC2626',
  },
  deleteAccountBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  deleteAccountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
    textDecorationLine: 'underline',
  },
  footerLoginButton: {
    backgroundColor: '#5D997C',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLoginButtonText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  buildInfoText: {
    textAlign: 'center',
    fontSize: 10,
    color: '#718096',
    marginTop: 16,
  },

  /* Modals Shared */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 36, 54, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContentCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAE5DE',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE5DE',
  },
  modalHeading: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1A2436',
  },
  modalSubheading: {
    fontSize: 11,
    color: '#718096',
    marginTop: 2,
  },
  modalCloseIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FAF8F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE5DE',
  },
  inputGroup: {
    marginTop: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#718096',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EAE5DE',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#1A2436',
    fontSize: 13,
  },
  modalActionSubmitBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  modalActionSubmitText: {
    fontSize: 12.5,
    fontWeight: '900',
  },

  /* FAQ Accordion */
  faqItemBox: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EAE5DE',
  },
  faqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A2436',
    flex: 1,
    paddingRight: 8,
  },
  faqToggleSymbol: {
    fontSize: 16,
    fontWeight: '900',
    color: '#718096',
  },
  faqAnswerText: {
    fontSize: 11,
    color: '#718096',
    lineHeight: 16,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EAE5DE',
  },

  /* Diagnostics */
  diagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    padding: 10,
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAE5DE',
  },
  diagDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  diagTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A2436',
  },
  diagSub: {
    fontSize: 10.5,
    color: '#718096',
    marginTop: 1,
  },

  /* Feedback */
  feedbackCatRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
    marginBottom: 10,
  },
  feedbackCatBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EAE5DE',
    alignItems: 'center',
  },
  feedbackCatBtnActive: {
    backgroundColor: '#5D997C',
    borderColor: '#5D997C',
  },
  feedbackCatText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#718096',
  },
  feedbackCatTextActive: {
    color: '#FFFFFF',
  },
  feedbackTextArea: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EAE5DE',
    borderRadius: 14,
    padding: 12,
    color: '#1A2436',
    fontSize: 12,
    textAlignVertical: 'top',
    height: 85,
  },
  successIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF4EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  successTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1A2436',
  },
  successSub: {
    fontSize: 11,
    color: '#718096',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 12,
  },

  /* Legal */
  legalBodyText: {
    fontSize: 11.5,
    color: '#4A5568',
    lineHeight: 18,
  },

  /* Confirm modal button half */
  confirmBtnHalf: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoDataBtn: {
    backgroundColor: '#EBF4EF',
    borderWidth: 1,
    borderColor: '#5D997C',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  demoDataBtnText: {
    color: '#2D5A43',
    fontSize: 12,
    fontWeight: '800',
  },
  replayOnboardingBtn: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EAE5DE',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 4,
  },
  replayOnboardingBtnText: {
    color: '#4A5568',
    fontSize: 12,
    fontWeight: '700',
  },
});
