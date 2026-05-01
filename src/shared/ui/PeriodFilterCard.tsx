import { AntDesign } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  PERIOD_FILTER_OPTIONS,
  periodDisplayLabel,
  type PeriodMode,
} from '@/shared/lib/periodFilter';

import { Card } from './Card';

type Props = {
  mode: PeriodMode;
  selectedMonth: Date;
  onModeChange: (mode: PeriodMode) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
};

export function PeriodFilterCard({
  mode,
  selectedMonth,
  onModeChange,
  onPreviousMonth,
  onNextMonth,
}: Props) {
  const label = periodDisplayLabel(mode, selectedMonth);

  return (
    <Card>
      <View className="flex-row bg-surface rounded-lg p-1">
        {PERIOD_FILTER_OPTIONS.map((option) => {
          const isActive = option.value === mode;
          return (
            <Pressable
              key={option.value}
              onPress={() => onModeChange(option.value)}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected: isActive }}
              className={`h-10 flex-1 items-center justify-center rounded-md ${
                isActive ? 'bg-primary' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  isActive ? 'text-primary-fg' : 'text-muted'
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {mode === 'month' ? (
        <View className="flex-row items-center justify-between mt-4">
          <IconButton
            label="Mês anterior"
            icon="left"
            onPress={onPreviousMonth}
          />
          <Text className="text-white text-base font-semibold">{label}</Text>
          <IconButton label="Próximo mês" icon="right" onPress={onNextMonth} />
        </View>
      ) : (
        <Text className="text-muted text-sm text-center mt-4">{label}</Text>
      )}
    </Card>
  );
}

function IconButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: ComponentProps<typeof AntDesign>['name'];
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={12}
      className="w-11 h-11 rounded-lg bg-surface items-center justify-center"
    >
      <AntDesign name={icon} size={18} color="#FFC107" />
    </Pressable>
  );
}
