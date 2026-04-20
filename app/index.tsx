import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useTruckStore } from '@/features/truck/store/truck.store';

export default function Index() {
  const { truck, hydrated, hydrate } = useTruckStore();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  if (!hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color="#FFC107" />
      </View>
    );
  }

  return truck ? <Redirect href="/(tabs)/dashboard" /> : <Redirect href="/onboarding" />;
}
