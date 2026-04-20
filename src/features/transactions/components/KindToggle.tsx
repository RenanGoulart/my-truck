import { Pressable, Text, View } from 'react-native';

import type { TransactionKind } from '../types';

type Props = {
  value: TransactionKind;
  onChange: (k: TransactionKind) => void;
};

export function KindToggle({ value, onChange }: Props) {
  return (
    <View className="bg-card border border-border rounded-2xl flex-row p-1">
      <Tab active={value === 'expense'} label="Gasto" onPress={() => onChange('expense')} color="expense" />
      <Tab active={value === 'income'} label="Ganho" onPress={() => onChange('income')} color="income" />
    </View>
  );
}

function Tab({
  active,
  label,
  onPress,
  color,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  color: 'income' | 'expense';
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 h-12 items-center justify-center rounded-xl ${
        active ? (color === 'income' ? 'bg-income' : 'bg-expense') : ''
      }`}
    >
      <Text className={`text-base font-semibold ${active ? 'text-white' : 'text-muted'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
