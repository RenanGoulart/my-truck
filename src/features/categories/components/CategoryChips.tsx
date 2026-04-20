import { AntDesign } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { iconForCategory } from '@/shared/lib/categoryIcon';

import type { Category } from '../types';

type Props = {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function CategoryChips({ categories, selectedId, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: 4, gap: 8 }}
    >
      {categories.map((c) => {
        const selected = c.id === selectedId;
        const iconName = iconForCategory(c.name, c.kind);
        const iconColor = selected ? '#0B0F14' : (c.color ?? '#FFFFFF');
        return (
          <Pressable
            key={c.id}
            onPress={() => onSelect(c.id)}
            className={`flex-row items-center px-4 h-11 rounded-full border ${
              selected ? 'bg-primary border-primary' : 'bg-card border-border'
            }`}
          >
            <View className="mr-2">
              <AntDesign name={iconName} size={16} color={iconColor} />
            </View>
            <Text
              className={`text-sm font-semibold ${
                selected ? 'text-primary-fg' : 'text-white'
              }`}
            >
              {c.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
