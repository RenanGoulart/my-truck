import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { useCategoriesStore } from '@/features/categories/store/categories.store';
import { CategoryDonutChart } from '@/features/reports/components/CategoryDonutChart';
import { MonthlyBarsChart } from '@/features/reports/components/MonthlyBarsChart';
import {
  expensesByCategory,
  monthlyByKind,
} from '@/features/reports/services/aggregations';
import { transactionsRepo } from '@/features/transactions/repository/transactions.repository';
import { useTransactionsStore } from '@/features/transactions/store/transactions.store';
import type { Transaction } from '@/features/transactions/types';
import type { PeriodMode } from '@/shared/lib/periodFilter';
import { Card } from '@/shared/ui/Card';
import { EmptyState } from '@/shared/ui/EmptyState';
import { PeriodFilterCard } from '@/shared/ui/PeriodFilterCard';
import { Screen } from '@/shared/ui/Screen';

export default function Reports() {
  const truckId = useTransactionsStore((s) => s.truckId);
  const items = useTransactionsStore((s) => s.items);
  const viewMode = useTransactionsStore((s) => s.periodMode);
  const selectedMonth = useTransactionsStore((s) => s.selectedMonth);
  const period = useTransactionsStore((s) => s.period);
  const setPeriodMode = useTransactionsStore((s) => s.setPeriodMode);
  const goToPreviousMonth = useTransactionsStore((s) => s.goToPreviousMonth);
  const goToNextMonth = useTransactionsStore((s) => s.goToNextMonth);
  const categories = useCategoriesStore((s) => s.items);

  const [reportRows, setReportRows] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    let ignore = false;

    (async () => {
      if (!truckId) {
        setReportRows([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setReportRows([]);
      const rows = await transactionsRepo.listByPeriod(truckId, period);
      if (ignore) return;
      setReportRows(rows);
      setIsLoading(false);
    })();

    return () => {
      ignore = true;
    };
  }, [truckId, items, period]);

  const bars = useMemo(() => {
    if (viewMode === 'last12') {
      return monthlyByKind(reportRows, { mode: 'rolling', months: 12, ref: today });
    }
    if (viewMode === 'year') {
      return monthlyByKind(reportRows, { mode: 'calendar-year', ref: today });
    }
    return monthlyByKind(reportRows, { mode: 'rolling', months: 1, ref: selectedMonth });
  }, [reportRows, selectedMonth, today, viewMode]);

  const slices = useMemo(
    () => expensesByCategory(reportRows, categories),
    [reportRows, categories]
  );
  const title = reportTitle(viewMode);

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
        <PeriodFilterCard
          mode={viewMode}
          selectedMonth={selectedMonth}
          onModeChange={(mode) => {
            void setPeriodMode(mode);
          }}
          onPreviousMonth={() => {
            void goToPreviousMonth();
          }}
          onNextMonth={() => {
            void goToNextMonth();
          }}
        />

        <Card>
          <Text className="text-white text-base font-semibold mb-3">
            {title}
          </Text>
          {isLoading ? (
            <LoadingBlock />
          ) : (
            <MonthlyBarsChart data={bars} height={viewMode === 'month' ? 160 : 200} />
          )}
        </Card>

        <Card>
          <Text className="text-white text-base font-semibold mb-3">
            Gastos por categoria
          </Text>
          {isLoading ? (
            <LoadingBlock />
          ) : slices.length === 0 ? (
            <EmptyState
              icon="pie-chart"
              title="Sem gastos no periodo"
              description="Registre gastos para ver a distribuicao por categoria."
            />
          ) : (
            <CategoryDonutChart slices={slices} />
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}

function reportTitle(viewMode: PeriodMode) {
  if (viewMode === 'last12') return 'Últimos 12 meses';
  if (viewMode === 'year') return 'Ano atual';
  return 'Mês selecionado';
}

function LoadingBlock() {
  return (
    <View className="h-40 items-center justify-center">
      <ActivityIndicator color="#FFC107" />
    </View>
  );
}
