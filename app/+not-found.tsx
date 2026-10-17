import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function NotFoundScreen() {
  const router = useRouter();

  useEffect(() => {
    // Gracefully redirect to root route instead of showing "Root Unmatched"
    router.replace('/');
  }, [router]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF8F5', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#5D997C" />
    </View>
  );
}
