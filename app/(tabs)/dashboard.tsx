import { Text, View } from 'react-native';

import { useTruckStore } from '@/features/truck/store/truck.store';
import { Card } from '@/shared/ui/Card';
import { Screen } from '@/shared/ui/Screen';

export default function Dashboard() {
  const truck = useTruckStore((s) => s.truck);

  return (
    <Screen>
      <View className="mt-4">
        <Text className="text-muted text-sm">Caminhão ativo</Text>
        <Text className="text-primary text-2xl font-bold">
          {truck?.nickname ?? '—'}
        </Text>
        {truck?.plate ? (
          <Text className="text-muted text-sm">{truck.plate}</Text>
        ) : null}
      </View>

      <Card className="mt-6">
        <Text className="text-muted text-xs">Saldo do mês</Text>
        <Text className="text-white mt-1 text-3xl font-bold">R$ 0,00</Text>
        <Text className="text-muted mt-2 text-xs">
          Implementado no próximo passo.
        </Text>
      </Card>
    </Screen>
  );
}
