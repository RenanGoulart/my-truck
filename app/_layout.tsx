import 'react-native-get-random-values';
import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DbProvider } from '@/app-providers/DbProvider';
import { StoresHydrator } from '@/app-providers/StoresHydrator';
import useUpdate from '@/shared/hooks/useUpdate';

export default function RootLayout() {
  const isLoading = useUpdate();

  if (isLoading) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <DbProvider>
          <StoresHydrator>
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: '#0B0F14' },
                headerTintColor: '#FFC107',
                contentStyle: { backgroundColor: '#0B0F14' },
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="onboarding" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="transaction/new"
                options={{ presentation: 'modal', title: 'Novo lançamento' }}
              />
              <Stack.Screen name="transaction/[id]" options={{ title: 'Editar' }} />
              <Stack.Screen name="settings/index" options={{ title: 'Configurações' }} />
              <Stack.Screen name="settings/truck" options={{ title: 'Caminhão' }} />
              <Stack.Screen name="settings/categories" options={{ title: 'Categorias' }} />
            </Stack>
          </StoresHydrator>
        </DbProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
