import { AntDesign } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { formatBRL } from '@/shared/lib/money';
import { Card } from '@/shared/ui/Card';

type Props = {
  fuelCostCents: number;
  kmDriven: number | null;
  costPerKmCents: number | null;
};

export function FuelCard({ fuelCostCents, kmDriven, costPerKmCents }: Props) {
  return (
    <Card>
      <View className="flex-row items-center">
        <View className="w-9 h-9 rounded-full bg-primary/20 items-center justify-center">
          <AntDesign name="dashboard" size={18} color="#FFC107" />
        </View>
        <Text className="ml-3 text-white font-semibold text-base">
          Combustível no mês
        </Text>
      </View>
      <View className="mt-4 flex-row">
        <View className="flex-1">
          <Text className="text-muted text-xs">Gasto</Text>
          <Text className="text-white text-lg font-bold">
            {formatBRL(fuelCostCents)}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-muted text-xs">Rodado</Text>
          <Text className="text-white text-lg font-bold">
            {kmDriven !== null ? `${kmDriven.toLocaleString('pt-BR')} km` : '—'}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-muted text-xs">R$/km</Text>
          <Text className="text-white text-lg font-bold">
            {costPerKmCents !== null ? formatBRL(costPerKmCents) : '—'}
          </Text>
        </View>
      </View>
      {kmDriven === null ? (
        <Text className="text-muted text-xs mt-3">
          Informe o odômetro em abastecimentos para calcular R$/km.
        </Text>
      ) : null}
    </Card>
  );
}
