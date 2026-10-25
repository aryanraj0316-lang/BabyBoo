import React from 'react';
import { useApp } from '../../context/AppContext';
import { OnboardingFirstScreen } from '../Onboarding/OnboardingFirstScreen';

interface SplashScreenProps {
  onSkip?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onSkip }) => {
  const { navigateTo } = useApp();

  return (
    <OnboardingFirstScreen
      onGetStarted={() => navigateTo('onboarding_second')}
      onSkip={onSkip || (() => navigateTo('onboarding_second'))}
    />
  );
};

