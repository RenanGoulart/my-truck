import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  currentYearPeriod,
  lastTwelveMonthsPeriod,
  monthPeriod,
  type Period,
} from './date';

export type PeriodMode = 'month' | 'last12' | 'year';

export const PERIOD_FILTER_OPTIONS: { value: PeriodMode; label: string }[] = [
  { value: 'month', label: 'Mês' },
  { value: 'last12', label: '12 meses' },
  { value: 'year', label: 'Ano atual' },
];

export const periodForSelection = (
  mode: PeriodMode,
  selectedMonth: Date,
  today = new Date()
): Period => {
  if (mode === 'last12') return lastTwelveMonthsPeriod(today);
  if (mode === 'year') return currentYearPeriod(today);
  return monthPeriod(selectedMonth);
};

export const periodDisplayLabel = (
  mode: PeriodMode,
  selectedMonth: Date,
  today = new Date()
): string => {
  if (mode === 'last12') {
    return `${format(subMonths(today, 11), 'MMM yyyy', { locale: ptBR })} - ${format(
      today,
      'MMM yyyy',
      { locale: ptBR }
    )}`;
  }
  if (mode === 'year') return format(today, 'yyyy');
  return format(selectedMonth, 'MMMM yyyy', { locale: ptBR });
};

export const emptyTransactionsTitle = (
  mode: PeriodMode,
  selectedMonth: Date,
  today = new Date()
): string => {
  if (mode === 'last12') return 'Sem lançamentos nos últimos 12 meses';
  if (mode === 'year') return `Sem lançamentos em ${format(today, 'yyyy')}`;
  return `Sem lançamentos em ${format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}`;
};

export const emptyTransactionsDescription = (
  mode: PeriodMode,
  selectedMonth: Date
): string => {
  if (mode === 'month') {
    return `Toque em + para registrar um lançamento em ${format(selectedMonth, 'MMMM yyyy', {
      locale: ptBR,
    })}.`;
  }
  return 'Toque em + para registrar um lançamento neste período.';
};

export const recentTransactionsTitle = (mode: PeriodMode): string => {
  if (mode === 'month') return 'Últimas transações do mês';
  return 'Últimas transações do período';
};
