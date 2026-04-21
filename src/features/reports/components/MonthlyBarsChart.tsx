import { Text, View } from 'react-native';
import { BarGroup, CartesianChart } from 'victory-native';

import type { MonthlyBucket } from '../services/aggregations';

type Props = {
  data: MonthlyBucket[];
  height?: number;
};

const INCOME = '#22C55E';
const EXPENSE = '#EF4444';

export function MonthlyBarsChart({ data, height = 200 }: Props) {
  const max = Math.max(
    1,
    ...data.map((d) => Math.max(d.incomeCents, d.expenseCents))
  );

  const chartData = data.map((d) => ({
    label: d.label,
    income: d.incomeCents,
    expense: d.expenseCents,
  }));

  return (
    <View>
      <View style={{ height }}>
        <CartesianChart
          data={chartData}
          xKey="label"
          yKeys={['income', 'expense']}
          domain={{ y: [0, max] }}
          domainPadding={{ left: 24, right: 24, top: 8 }}
        >
          {({ points, chartBounds }) => (
            <BarGroup
              chartBounds={chartBounds}
              betweenGroupPadding={0.35}
              withinGroupPadding={0.05}
              roundedCorners={{ topLeft: 3, topRight: 3 }}
            >
              <BarGroup.Bar points={points.income} color={INCOME} />
              <BarGroup.Bar points={points.expense} color={EXPENSE} />
            </BarGroup>
          )}
        </CartesianChart>
      </View>
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
