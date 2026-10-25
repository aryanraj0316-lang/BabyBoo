import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { DeviceFrame } from './components/DeviceFrame/DeviceFrame';
import { Home, BarChart3, Settings, UserPlus, LayoutGrid } from 'lucide-react';
import { SplashScreen } from './components/Screens/SplashScreen';
import { AuthScreen } from './components/Screens/AuthScreen';
import { AddChildProfileScreen } from './components/Screens/AddChildProfileScreen';
import { SetPatternLockScreen } from './components/Screens/SetPatternLockScreen';
import { ParentDashboardScreen } from './components/Screens/ParentDashboardScreen';
import { ScheduleAutomationScreen } from './components/Screens/ScheduleAutomationScreen';
import { SessionSetupScreen } from './components/Screens/SessionSetupScreen';
import { ActiveSessionScreen } from './components/Screens/ActiveSessionScreen';
import { TimeUpWarningScreen } from './components/Screens/TimeUpWarningScreen';
import { ShutdownIllusionScreen } from './components/Screens/ShutdownIllusionScreen';
import { PostSessionSummaryScreen } from './components/Screens/PostSessionSummaryScreen';
import { WeeklyStatsScreen } from './components/Screens/WeeklyStatsScreen';
import { SettingsScreen } from './components/Screens/SettingsScreen';

import { OnboardingAssessment } from './components/Onboarding/OnboardingAssessment';
import { OnboardingSecondScreen } from './components/Onboarding/OnboardingSecondScreen';
import { OnboardingThirdScreen, type OnboardingScreen3Data } from './components/Onboarding/OnboardingThirdScreen';
import { OnboardingFourthScreen, type OnboardingScreen4Data } from './components/Onboarding/OnboardingFourthScreen';
import { OnboardingFifthScreen, type OnboardingScreen5Data } from './components/Onboarding/OnboardingFifthScreen';
import { OnboardingSixthScreen, type OnboardingScreen6Data } from './components/Onboarding/OnboardingSixthScreen';
import { OnboardingSeventhScreen } from './components/Onboarding/OnboardingSeventhScreen';

const MainScreenRouter: React.FC = () => {
  const { currentScreen, navigateTo, completeOnboarding } = useApp();
  const [onboardingChild, setOnboardingChild] = React.useState<{
    name: string;
    ageCategory: string;
    dailyMinutes?: number;
    timeChipId?: string;
    handoverType?: string;
    dailyFrequency?: number;
    frequencyChipId?: string;
    hasWorryingContent?: boolean;
  }>({
    name: 'Leo',
    ageCategory: '2_4',
    dailyMinutes: 20,
  });

  switch (currentScreen) {
    case 'splash':
      return (
        <SplashScreen
          onSkip={() => navigateTo('onboarding_second')}
        />
      );
    case 'onboarding_second':
      return (
        <OnboardingSecondScreen
          onBack={() => navigateTo('splash')}
          onContinue={(childData) => {
            setOnboardingChild({ name: childData.name, ageCategory: childData.ageCategory });
            navigateTo('onboarding_third');
          }}
          onSkip={() => {
            setOnboardingChild((prev) => ({
              name: prev.name || 'Leo',
              ageCategory: prev.ageCategory || '2_4',
            }));
            navigateTo('onboarding_third');
          }}
        />
      );
    case 'onboarding_third':
      return (
        <OnboardingThirdScreen
          childName={onboardingChild.name}
          ageCategory={onboardingChild.ageCategory}
          onBack={() => navigateTo('onboarding_second')}
          onSkip={() => {
            navigateTo('onboarding_fourth');
          }}
          onContinue={(data: OnboardingScreen3Data) => {
            const minutesMap: Record<string, number> = {
              under_1: 10,
              age_1: 15,
              '2_4': 20,
              '5_7': 30,
              '8_10': 45,
            };
            setOnboardingChild((prev) => ({
              ...prev,
              name: data.childName,
              ageCategory: data.ageCategory,
              dailyMinutes: minutesMap[data.ageCategory] || 20,
              timeChipId: data.timeChipId,
            }));
            navigateTo('onboarding_fourth');
          }}
        />
      );
    case 'onboarding_fourth':
      return (
        <OnboardingFourthScreen
          childName={onboardingChild.name}
          ageCategory={onboardingChild.ageCategory}
          onBack={() => navigateTo('onboarding_third')}
          onSkip={() => {
            navigateTo('onboarding_fifth');
          }}
          onContinue={(data: OnboardingScreen4Data) => {
            setOnboardingChild((prev) => ({
              ...prev,
              handoverType: data.handoverType,
            }));
            navigateTo('onboarding_fifth');
          }}
        />
      );
    case 'onboarding_fifth':
      return (
        <OnboardingFifthScreen
          childName={onboardingChild.name}
          ageCategory={onboardingChild.ageCategory}
          onBack={() => navigateTo('onboarding_fourth')}
          onSkip={() => {
            navigateTo('onboarding_sixth');
          }}
          onContinue={(data: OnboardingScreen5Data) => {
            setOnboardingChild((prev) => ({
              ...prev,
              dailyFrequency: data.dailyFrequency,
              frequencyChipId: data.frequencyChipId,
            }));
            navigateTo('onboarding_sixth');
          }}
        />
      );
    case 'onboarding_sixth':
      return (
        <OnboardingSixthScreen
          childName={onboardingChild.name}
          ageCategory={onboardingChild.ageCategory}
          onBack={() => navigateTo('onboarding_fifth')}
          onSkip={() => {
            navigateTo('onboarding_seventh');
          }}
          onContinue={(data: OnboardingScreen6Data) => {
            setOnboardingChild((prev) => ({
              ...prev,
              hasWorryingContent: data.hasWorryingContent,
            }));
            navigateTo('onboarding_seventh');
          }}
        />
      );
    case 'onboarding_seventh':
      return (
        <OnboardingSeventhScreen
          childName={onboardingChild.name}
          ageCategory={onboardingChild.ageCategory}
          dailyMinutes={onboardingChild.dailyMinutes}
          timeChipId={onboardingChild.timeChipId}
          dailyFrequency={onboardingChild.dailyFrequency}
          frequencyChipId={onboardingChild.frequencyChipId}
          handoverType={onboardingChild.handoverType}
          hasWorryingContent={onboardingChild.hasWorryingContent}
          onBack={() => navigateTo('onboarding_sixth')}
          onSkip={() => {
            completeOnboarding({
              name: onboardingChild.name || 'Leo',
              ageGroup: onboardingChild.ageCategory || '2_4',
              dailyMinutes: onboardingChild.dailyMinutes || 20,
              preferredStyle: 'low_battery',
            });
            navigateTo('parent_dashboard');
          }}
          onContinue={() => {
            completeOnboarding({
              name: onboardingChild.name,
              ageGroup: onboardingChild.ageCategory,
              dailyMinutes: onboardingChild.dailyMinutes || 20,
              preferredStyle: onboardingChild.handoverType === 'meltdown' ? 'needs_rest' : 'low_battery',
            });
            navigateTo('parent_dashboard');
          }}
        />
      );
    case 'onboarding_assessment':
      return <OnboardingAssessment />;
    case 'auth':
      return <AuthScreen />;
    case 'add_child':
      return <AddChildProfileScreen />;
    case 'set_pattern':
      return <SetPatternLockScreen />;
    case 'parent_dashboard':
      return <ParentDashboardScreen />;
    case 'schedule_automation':
      return <ScheduleAutomationScreen />;
    case 'session_setup':
      return <SessionSetupScreen />;
    case 'active_session':
      return <ActiveSessionScreen />;
    case 'time_up_warning':
      return <TimeUpWarningScreen />;
    case 'shutdown_illusion':
      return <ShutdownIllusionScreen />;
    case 'post_session_summary':
      return <PostSessionSummaryScreen />;
    case 'weekly_stats':
      return <WeeklyStatsScreen />;
    case 'settings':
      return <SettingsScreen />;
    default:
      return <SplashScreen />;
  }
};

const MAIN_PARENT_SCREENS = ['parent_dashboard', 'schedule_automation', 'weekly_stats', 'settings', 'add_child'];

const AppContent: React.FC = () => {
  const { currentScreen, navigateTo } = useApp();
  const showBottomNav = MAIN_PARENT_SCREENS.includes(currentScreen);

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-[#FAF8F5] text-[#1A2436]">
      <div className="flex-1 overflow-hidden relative">
        <MainScreenRouter />
      </div>

      {/* Clean Bottom Navigation Bar with Babyboo Pastel Palette */}
      {showBottomNav && (
        <nav className="w-full bg-[#FAF8F5]/95 backdrop-blur-md border-t border-[#EAE5DE] py-2 px-3 flex items-center justify-between z-40 shadow-[0_-4px_18px_rgba(26,36,54,0.03)] shrink-0">
          {[
            { id: 'add_child' as const, label: 'Add Child', icon: UserPlus },
            { id: 'schedule_automation' as const, label: 'Widget', icon: LayoutGrid },
            { id: 'parent_dashboard' as const, label: 'Home', icon: Home, isCenter: true },
            { id: 'weekly_stats' as const, label: 'Analytics', icon: BarChart3 },
            { id: 'settings' as const, label: 'Settings', icon: Settings },
          ].map((item) => {
            const isSelected = currentScreen === item.id;
            if (item.isCenter) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  className="flex flex-col items-center justify-center -top-3 relative cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#5D997C] border-2 border-white flex items-center justify-center shadow-[0_3px_10px_rgba(93,153,124,0.35)] transition-transform group-hover:scale-105">
                    <item.icon className="w-5 h-5 text-white stroke-[2.4]" />
                  </div>
                  <span className={`text-[10px] font-extrabold mt-1 tracking-tight ${isSelected ? 'text-[#5D997C]' : 'text-[#94A3B8]'}`}>
                    {item.label}
                  </span>
                </button>
              );
            }
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className={`flex flex-col items-center gap-1 transition-all py-1 px-2 rounded-xl cursor-pointer ${isSelected
                    ? 'text-[#5D997C] font-extrabold'
                    : 'text-[#94A3B8] hover:text-[#475569] font-medium'
                  }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all ${isSelected
                      ? 'bg-[#EBF4EF] text-[#5D997C]'
                      : 'text-[#94A3B8] hover:bg-[#F5F2EB]'
                    }`}
                >
                                        <item.icon className="w-5 h-5 stroke-2" />
                </div>
                <span className="text-[10.5px] tracking-tight">{item.label}</span>
                {isSelected && (
                  <div className="w-3.5 h-1 rounded-full bg-[#5D997C] transition-all" />
                )}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <DeviceFrame>
        <AppContent />
      </DeviceFrame>
    </AppProvider>
  );
};

export default App;
