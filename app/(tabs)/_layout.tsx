import { AntDesign } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

type IconName = React.ComponentProps<typeof AntDesign>['name'];

const icon =
  (name: IconName) =>
  ({ color, size }: { color: string; size: number }) => (
    <AntDesign name={name} size={size} color={color} />
  );

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
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Dashboard', tabBarIcon: icon('home') }}
      />
      <Tabs.Screen
        name="transactions"
        options={{ title: 'Transações', tabBarIcon: icon('swap') }}
      />
      <Tabs.Screen
        name="reports"
        options={{ title: 'Relatórios', tabBarIcon: icon('line-chart') }}
      />
    </Tabs>
  );
}
