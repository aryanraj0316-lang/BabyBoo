import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { DeviceFrame } from './components/DeviceFrame/DeviceFrame';
import { Home, BarChart3, Settings, UserPlus, Calendar } from 'lucide-react';
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

const MainScreenRouter: React.FC = () => {
  const { currentScreen } = useApp();

  switch (currentScreen) {
    case 'splash':
      return <SplashScreen />;
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
            { id: 'parent_dashboard' as const, label: 'Home', icon: Home },
            { id: 'schedule_automation' as const, label: 'Schedule', icon: Calendar },
            { id: 'add_child' as const, label: 'Add Child', icon: UserPlus },
            { id: 'weekly_stats' as const, label: 'Analytics', icon: BarChart3 },
            { id: 'settings' as const, label: 'Settings', icon: Settings },
          ].map((item) => {
            const isSelected = currentScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className={`flex flex-col items-center gap-1 transition-all py-1 px-2 rounded-xl cursor-pointer ${
                  isSelected
                    ? 'text-[#5D997C] font-extrabold'
                    : 'text-[#94A3B8] hover:text-[#475569] font-medium'
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-[#EBF4EF] text-[#5D997C]'
                      : 'text-[#94A3B8] hover:bg-[#F5F2EB]'
                  }`}
                >
                  <item.icon className="w-5 h-5 stroke-[2.2]" />
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
