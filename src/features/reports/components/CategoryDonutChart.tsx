import { Text, View } from 'react-native';
import { Pie, PolarChart } from 'victory-native';

import { formatBRL } from '@/shared/lib/money';

import type { CategorySlice } from '../services/aggregations';

type Props = {
  slices: CategorySlice[];
  size?: number;
};

const STROKE = 28;
const TRACK_COLOR = '#1A2230';

export function CategoryDonutChart({ slices, size = 200 }: Props) {
  const total = slices.reduce((a, s) => a + s.totalCents, 0);
  const innerRadiusPercent = `${((size - STROKE * 2) / size) * 100}%`;

  const pieData = slices.map((s) => ({
    value: s.totalCents,
    color: s.color,
    label: s.name,
  }));

  return (
    <View className="flex-row items-center gap-4">
      <View style={{ width: size, height: size }}>
        <View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: STROKE,
            borderColor: TRACK_COLOR,
          }}
        />
        <PolarChart
          data={pieData}
          labelKey="label"
          valueKey="value"
          colorKey="color"
        >
          <Pie.Chart innerRadius={innerRadiusPercent} />
        </PolarChart>
      </View>
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
