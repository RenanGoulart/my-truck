import { AntDesign } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/shared/ui/Screen';

type Entry = {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof AntDesign>['name'];
  href: string;
};

const ENTRIES: Entry[] = [
  {
    title: 'Caminhão',
    subtitle: 'Apelido, placa e odômetro inicial',
    icon: 'car',
    href: '/settings/truck',
  },
  {
    title: 'Categorias',
    subtitle: 'Criar e gerenciar categorias',
    icon: 'appstore',
    href: '/settings/categories',
  },
];

export default function SettingsHub() {
  return (
    <>
      <Stack.Screen options={{ title: 'Configurações' }} />
      <Screen>
        <View className="mt-4 gap-2">
          {ENTRIES.map((e) => (
            <Pressable
              key={e.href}
              onPress={() => router.push(e.href as never)}
              className="flex-row items-center bg-surface border border-border rounded-2xl px-4 py-4"
            >
              <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center">
                <AntDesign name={e.icon} size={18} color="#FFC107" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-white font-semibold text-base">{e.title}</Text>
                <Text className="text-muted text-xs mt-0.5">{e.subtitle}</Text>
              </View>
              <AntDesign name="right" size={16} color="#94A3B8" />
            </Pressable>
          ))}
        </View>
      </Screen>
    </>
  );
}
