import { AntDesign } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { formatBRL } from '@/shared/lib/money';
import { Card } from '@/shared/ui/Card';

type Props = {
  balanceCents: number;
  incomeCents: number;
  expenseCents: number;
};

export function BalanceCard({ balanceCents, incomeCents, expenseCents }: Props) {
  const positive = balanceCents >= 0;
  const color = positive ? '#22C55E' : '#EF4444';

  return (
    <Card className="bg-surface">
      <Text className="text-muted text-xs uppercase tracking-wide">
        Saldo do mês
      </Text>
      <Text className="mt-1 text-4xl font-bold" style={{ color }}>
        {formatBRL(balanceCents)}
      </Text>

      <View className="mt-5 flex-row gap-4">
        <View className="flex-1 flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-income/20 items-center justify-center">
            <AntDesign name="arrow-down" size={16} color="#22C55E" />
          </View>
          <View className="ml-2">
            <Text className="text-muted text-xs">Ganhos</Text>
            <Text className="text-white font-semibold">{formatBRL(incomeCents)}</Text>
          </View>
        </View>
        <View className="flex-1 flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-expense/20 items-center justify-center">
            <AntDesign name="arrow-up" size={16} color="#EF4444" />
          </View>
          <View className="ml-2">
            <Text className="text-muted text-xs">Gastos</Text>
            <Text className="text-white font-semibold">{formatBRL(expenseCents)}</Text>
          </View>
        </View>
      </View>
    </Card>
  );
}
