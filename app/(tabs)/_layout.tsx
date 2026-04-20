import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#0B0F14' },
        headerTintColor: '#FFC107',
        tabBarStyle: {
          backgroundColor: '#121821',
          borderTopColor: '#253042',
        },
        tabBarActiveTintColor: '#FFC107',
        tabBarInactiveTintColor: '#94A3B8',
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="transactions" options={{ title: 'Transações' }} />
      <Tabs.Screen name="reports" options={{ title: 'Relatórios' }} />
    </Tabs>
  );
}
