import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { useCategoriesStore } from '@/features/categories/store/categories.store';
import { CategoryDonutChart } from '@/features/reports/components/CategoryDonutChart';
import { MonthlyBarsChart } from '@/features/reports/components/MonthlyBarsChart';
import {
  expensesByCategory,
  monthlyByKind,
  monthRange,
} from '@/features/reports/services/aggregations';
import { transactionsRepo } from '@/features/transactions/repository/transactions.repository';
import { useTransactionsStore } from '@/features/transactions/store/transactions.store';
import type { Transaction } from '@/features/transactions/types';
import { Card } from '@/shared/ui/Card';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Screen } from '@/shared/ui/Screen';

export default function Reports() {
  const truckId = useTransactionsStore((s) => s.truckId);
  const items = useTransactionsStore((s) => s.items);
  const categories = useCategoriesStore((s) => s.items);

  const [sixMonths, setSixMonths] = useState<Transaction[]>([]);

  useEffect(() => {
    (async () => {
      if (!truckId) return;
      const range = monthRange(6);
      const rows = await transactionsRepo.listByPeriod(truckId, range);
      setSixMonths(rows);
    })();
  }, [truckId, items]);

  const bars = useMemo(() => monthlyByKind(sixMonths, 6), [sixMonths]);
  const slices = useMemo(
    () => expensesByCategory(items, categories),
    [items, categories]
  );

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 40,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Card>
          <Text className="text-white text-base font-semibold mb-3">
            Últimos 6 meses
          </Text>
          <MonthlyBarsChart data={bars} />
        </Card>

        <Card>
          <Text className="text-white text-base font-semibold mb-3">
            Gastos por categoria (mês)
          </Text>
          {slices.length === 0 ? (
            <EmptyState
              icon="pie-chart"
              title="Sem gastos no mês"
              description="Registre gastos para ver a distribuição por categoria."
            />
          ) : (
            <CategoryDonutChart slices={slices} />
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}
