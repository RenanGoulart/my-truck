import { AntDesign } from '@expo/vector-icons';
import { addMonths, format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ComponentProps } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

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
import {
  currentYearPeriod,
  lastTwelveMonthsPeriod,
  monthPeriod,
} from '@/shared/lib/date';
import { Card } from '@/shared/ui/Card';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Screen } from '@/shared/ui/Screen';

type ReportViewMode = 'month' | 'last12' | 'year';

const VIEW_OPTIONS: { value: ReportViewMode; label: string }[] = [
  { value: 'month', label: 'Mes' },
  { value: 'last12', label: '12 meses' },
  { value: 'year', label: 'Ano atual' },
];

export default function Reports() {
  const truckId = useTransactionsStore((s) => s.truckId);
  const items = useTransactionsStore((s) => s.items);
  const categories = useCategoriesStore((s) => s.items);

  const [viewMode, setViewMode] = useState<ReportViewMode>('month');
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
  const [reportRows, setReportRows] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const today = useMemo(() => new Date(), []);
  const period = useMemo(() => {
    if (viewMode === 'last12') return lastTwelveMonthsPeriod(today);
    if (viewMode === 'year') return currentYearPeriod(today);
    return monthPeriod(selectedMonth);
  }, [selectedMonth, today, viewMode]);

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
  const periodLabel = reportPeriodLabel(viewMode, selectedMonth, today);

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
          <View className="flex-row bg-surface rounded-lg p-1">
            {VIEW_OPTIONS.map((option) => {
              const isActive = option.value === viewMode;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setViewMode(option.value)}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected: isActive }}
                  className={`h-10 flex-1 items-center justify-center rounded-md ${
                    isActive ? 'bg-primary' : 'bg-transparent'
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      isActive ? 'text-primary-fg' : 'text-muted'
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {viewMode === 'month' ? (
            <View className="flex-row items-center justify-between mt-4">
              <IconButton
                label="Mes anterior"
                icon="left"
                onPress={() => setSelectedMonth((current) => subMonths(current, 1))}
              />
              <Text className="text-white text-base font-semibold">
                {periodLabel}
              </Text>
              <IconButton
                label="Proximo mes"
                icon="right"
                onPress={() => setSelectedMonth((current) => addMonths(current, 1))}
              />
            </View>
          ) : (
            <Text className="text-muted text-sm text-center mt-4">
              {periodLabel}
            </Text>
          )}
        </Card>

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

function reportTitle(viewMode: ReportViewMode) {
  if (viewMode === 'last12') return 'Ultimos 12 meses';
  if (viewMode === 'year') return 'Ano atual';
  return 'Mes selecionado';
}

function reportPeriodLabel(
  viewMode: ReportViewMode,
  selectedMonth: Date,
  today: Date
) {
  if (viewMode === 'last12') {
    return `${format(subMonths(today, 11), 'MMM yyyy', { locale: ptBR })} - ${format(
      today,
      'MMM yyyy',
      { locale: ptBR }
    )}`;
  }
  if (viewMode === 'year') return format(today, 'yyyy');
  return format(selectedMonth, 'MMMM yyyy', { locale: ptBR });
}

function IconButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: ComponentProps<typeof AntDesign>['name'];
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={12}
      className="w-11 h-11 rounded-lg bg-surface items-center justify-center"
    >
      <AntDesign name={icon} size={18} color="#FFC107" />
    </Pressable>
  );
}

function LoadingBlock() {
  return (
    <View className="h-40 items-center justify-center">
      <ActivityIndicator color="#FFC107" />
    </View>
  );
}
