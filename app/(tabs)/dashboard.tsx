import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { useCategoriesStore } from '@/features/categories/store/categories.store';
import { BalanceCard } from '@/features/dashboard/components/BalanceCard';
import { FuelCard } from '@/features/dashboard/components/FuelCard';
import { buildSummary } from '@/features/dashboard/services/summary';
import { TransactionListItem } from '@/features/transactions/components/TransactionListItem';
import { transactionsRepo } from '@/features/transactions/repository/transactions.repository';
import { useTransactionsStore } from '@/features/transactions/store/transactions.store';
import { useTruckStore } from '@/features/truck/store/truck.store';
import {
  emptyTransactionsDescription,
  emptyTransactionsTitle,
  periodDisplayLabel,
  recentTransactionsTitle,
} from '@/shared/lib/periodFilter';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Fab } from '@/shared/ui/Fab';
import { PeriodFilterCard } from '@/shared/ui/PeriodFilterCard';
import { Screen } from '@/shared/ui/Screen';

export default function Dashboard() {
  const truck = useTruckStore((s) => s.truck);
  const items = useTransactionsStore((s) => s.items);
  const incomeCents = useTransactionsStore((s) => s.incomeCents);
  const expenseCents = useTransactionsStore((s) => s.expenseCents);
  const truckId = useTransactionsStore((s) => s.truckId);
  const period = useTransactionsStore((s) => s.period);
  const periodMode = useTransactionsStore((s) => s.periodMode);
  const selectedMonth = useTransactionsStore((s) => s.selectedMonth);
  const load = useTransactionsStore((s) => s.load);
  const setPeriodMode = useTransactionsStore((s) => s.setPeriodMode);
  const goToPreviousMonth = useTransactionsStore((s) => s.goToPreviousMonth);
  const goToNextMonth = useTransactionsStore((s) => s.goToNextMonth);
  const categories = useCategoriesStore((s) => s.items);

  const [baselineOdometer, setBaselineOdometer] = useState<number | null>(null);

  useEffect(() => {
    if (truckId) void load();
  }, [truckId, load]);

  useEffect(() => {
    let ignore = false;

    (async () => {
      if (!truckId) {
        setBaselineOdometer(null);
        return;
      }
      setBaselineOdometer(null);
      const baseline = await transactionsRepo.lastOdometerBefore(truckId, period.from);
      if (ignore) return;
      setBaselineOdometer(baseline);
    })();

    return () => {
      ignore = true;
    };
  }, [truckId, period.from]);

  const summary = useMemo(
    () =>
      buildSummary({
        txs: items,
        categories,
        incomeCents,
        expenseCents,
        initialOdometer: truck?.initialOdometer ?? 0,
        baselineOdometer,
      }),
    [items, categories, incomeCents, expenseCents, truck?.initialOdometer, baselineOdometer]
  );

  const periodLabel = periodDisplayLabel(periodMode, selectedMonth);

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

        <PeriodFilterCard
          mode={periodMode}
          selectedMonth={selectedMonth}
          onModeChange={(mode) => void setPeriodMode(mode)}
          onPreviousMonth={() => void goToPreviousMonth()}
          onNextMonth={() => void goToNextMonth()}
        />

        <BalanceCard
          balanceCents={summary.balanceCents}
          incomeCents={summary.incomeCents}
          expenseCents={summary.expenseCents}
          periodLabel={periodLabel}
        />

        <FuelCard
          fuelCostCents={summary.fuelCostCents}
          kmDriven={summary.kmDriven}
          costPerKmCents={summary.costPerKmCents}
          periodLabel={periodLabel}
        />

        <View>
          <Text className="text-white text-base font-semibold mb-2">
            {recentTransactionsTitle(periodMode)}
          </Text>
          {recent.length === 0 ? (
            <EmptyState
              icon="swap"
              title={emptyTransactionsTitle(periodMode, selectedMonth)}
              description={emptyTransactionsDescription(periodMode, selectedMonth)}
            />
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
