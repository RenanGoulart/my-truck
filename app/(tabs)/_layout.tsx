import { AntDesign } from '@expo/vector-icons';
import { router, Tabs } from 'expo-router';
import { Pressable } from 'react-native';

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
        options={{
          title: 'Dashboard',
          tabBarIcon: icon('home'),
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/settings/categories')}
              className="pr-4"
              hitSlop={12}
            >
              <AntDesign name="setting" size={22} color="#FFC107" />
            </Pressable>
          ),
        }}
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
