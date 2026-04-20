import { Pressable, ScrollView, Text } from 'react-native';

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
        return (
          <Pressable
            key={c.id}
            onPress={() => onSelect(c.id)}
            className={`px-4 h-11 items-center justify-center rounded-full border ${
              selected ? 'bg-primary border-primary' : 'bg-card border-border'
            }`}
          >
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
