import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { useCategoriesStore } from '@/features/categories/store/categories.store';
import { BalanceCard } from '@/features/dashboard/components/BalanceCard';
import { FuelCard } from '@/features/dashboard/components/FuelCard';
import { buildSummary } from '@/features/dashboard/services/summary';
import { TransactionListItem } from '@/features/transactions/components/TransactionListItem';
import { useTransactionsStore } from '@/features/transactions/store/transactions.store';
import { useTruckStore } from '@/features/truck/store/truck.store';
import { Fab } from '@/shared/ui/Fab';
import { Screen } from '@/shared/ui/Screen';

export default function Dashboard() {
  const truck = useTruckStore((s) => s.truck);
  const items = useTransactionsStore((s) => s.items);
  const incomeCents = useTransactionsStore((s) => s.incomeCents);
  const expenseCents = useTransactionsStore((s) => s.expenseCents);
  const truckId = useTransactionsStore((s) => s.truckId);
  const load = useTransactionsStore((s) => s.load);
  const categories = useCategoriesStore((s) => s.items);

  useEffect(() => {
    if (truckId) void load();
  }, [truckId, load]);

  const summary = useMemo(
    () => buildSummary(items, categories, incomeCents, expenseCents),
    [items, categories, incomeCents, expenseCents]
  );

  const recent = items.slice(0, 5);

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 120,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text className="text-muted text-xs">Caminhão ativo</Text>
          <Text className="text-primary text-xl font-bold">
            {truck?.nickname ?? '—'}
          </Text>
          {truck?.plate ? (
            <Text className="text-muted text-xs">{truck.plate}</Text>
          ) : null}
        </View>

        <BalanceCard
          balanceCents={summary.balanceCents}
          incomeCents={summary.incomeCents}
          expenseCents={summary.expenseCents}
        />

        <FuelCard
          fuelCostCents={summary.fuelCostCents}
          kmDriven={summary.kmDriven}
          costPerKmCents={summary.costPerKmCents}
        />

        <View>
          <Text className="text-white text-base font-semibold mb-2">
            Últimas transações
          </Text>
          {recent.length === 0 ? (
            <Text className="text-muted text-sm">
              Nenhuma transação neste mês. Toque em + para criar.
            </Text>
          ) : (
            <View className="gap-2">
              {recent.map((tx) => (
                <TransactionListItem key={tx.id} tx={tx} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <Fab onPress={() => router.push('/transaction/new')} />
    </Screen>
  );
}
