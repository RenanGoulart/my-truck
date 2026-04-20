import { Fragment } from 'react';
import { Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import type { MonthlyBucket } from '../services/aggregations';

type Props = {
  data: MonthlyBucket[];
  height?: number;
};

const PADDING = 24;
const BAR_GAP = 4;
const GROUP_GAP_RATIO = 0.35;
const INCOME = '#22C55E';
const EXPENSE = '#EF4444';

export function MonthlyBarsChart({ data, height = 200 }: Props) {
  const width = 320;
  const max = Math.max(
    1,
    ...data.map((d) => Math.max(d.incomeCents, d.expenseCents))
  );

  const plotH = height - PADDING * 2;
  const plotW = width - PADDING * 2;
  const groupCount = data.length;
  const groupW = plotW / groupCount;
  const innerW = groupW * (1 - GROUP_GAP_RATIO);
  const barW = (innerW - BAR_GAP) / 2;

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {data.map((d, i) => {
          const xGroup = PADDING + groupW * i + (groupW - innerW) / 2;
          const incH = (d.incomeCents / max) * plotH;
          const expH = (d.expenseCents / max) * plotH;
          return (
            <Fragment key={d.key}>
              <Rect
                x={xGroup}
                y={PADDING + plotH - incH}
                width={barW}
                height={incH}
                rx={3}
                fill={INCOME}
              />
              <Rect
                x={xGroup + barW + BAR_GAP}
                y={PADDING + plotH - expH}
                width={barW}
                height={expH}
                rx={3}
                fill={EXPENSE}
              />
            </Fragment>
          );
        })}
      </Svg>
      <View className="flex-row justify-between px-2 mt-1">
        {data.map((d) => (
          <Text key={d.key} className="text-muted text-xs flex-1 text-center">
            {d.label}
          </Text>
        ))}
      </View>
      <View className="flex-row justify-center gap-6 mt-3">
        <Legend color={INCOME} label="Ganhos" />
        <Legend color={EXPENSE} label="Gastos" />
      </View>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center">
      <View className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: color }} />
      <Text className="text-muted text-xs">{label}</Text>
    </View>
  );
}

