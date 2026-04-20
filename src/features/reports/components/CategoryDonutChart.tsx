import { Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { formatBRL } from '@/shared/lib/money';

import type { CategorySlice } from '../services/aggregations';

type Props = {
  slices: CategorySlice[];
  size?: number;
};

export function CategoryDonutChart({ slices, size = 200 }: Props) {
  const stroke = 28;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = slices.reduce((a, s) => a + s.totalCents, 0);

  let offset = 0;

  return (
    <View className="flex-row items-center gap-4">
      <Svg width={size} height={size}>
        <G rotation={-90} originX={size / 2} originY={size / 2}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1A2230"
            strokeWidth={stroke}
            fill="transparent"
          />
          {slices.map((s) => {
            const length = s.percent * circumference;
            const el = (
              <Circle
                key={s.categoryId}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={s.color}
                strokeWidth={stroke}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                fill="transparent"
                strokeLinecap="butt"
              />
            );
            offset += length;
            return el;
          })}
        </G>
      </Svg>
      <View className="flex-1 gap-2">
        <Text className="text-muted text-xs">Total</Text>
        <Text className="text-white text-xl font-bold">{formatBRL(total)}</Text>
        <View className="gap-1 mt-2">
          {slices.slice(0, 5).map((s) => (
            <View key={s.categoryId} className="flex-row items-center">
              <View
                className="w-2.5 h-2.5 rounded-full mr-2"
                style={{ backgroundColor: s.color }}
              />
              <Text className="text-white text-xs flex-1" numberOfLines={1}>
                {s.name}
              </Text>
              <Text className="text-muted text-xs">
                {(s.percent * 100).toFixed(0)}%
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
