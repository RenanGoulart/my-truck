import 'react-native-get-random-values';
import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DbProvider } from '@/app-providers/DbProvider';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <DbProvider>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: '#0B0F14' },
              headerTintColor: '#FFC107',
              contentStyle: { backgroundColor: '#0B0F14' },
            }}
          />
        </DbProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
