import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import type { Category } from '@/features/categories/types';
import type { Transaction } from '@/features/transactions/types';

export type MonthlyBucket = {
  key: string;
  label: string;
  incomeCents: number;
  expenseCents: number;
};

export const monthlyByKind = (
  txs: Transaction[],
  months = 6,
  ref = new Date()
): MonthlyBucket[] => {
  const buckets: MonthlyBucket[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = subMonths(ref, i);
    buckets.push({
      key: format(d, 'yyyy-MM'),
      label: format(d, 'MMM', { locale: ptBR }),
      incomeCents: 0,
      expenseCents: 0,
    });
  }
  const index = new Map(buckets.map((b) => [b.key, b]));

  for (const t of txs) {
    const key = format(t.occurredAt, 'yyyy-MM');
    const b = index.get(key);
    if (!b) continue;
    if (t.kind === 'income') b.incomeCents += t.amountCents;
    else b.expenseCents += t.amountCents;
  }
  return buckets;
};

export const monthRange = (months = 6, ref = new Date()) => ({
  from: startOfMonth(subMonths(ref, months - 1)).getTime(),
  to: endOfMonth(ref).getTime(),
});

export type CategorySlice = {
  categoryId: string;
  name: string;
  color: string;
  totalCents: number;
  percent: number;
};

export const expensesByCategory = (
  txs: Transaction[],
  categories: Category[]
): CategorySlice[] => {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const totals = new Map<string, number>();

  for (const t of txs) {
    if (t.kind !== 'expense') continue;
    totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amountCents);
  }

  const total = [...totals.values()].reduce((a, b) => a + b, 0);
  if (total === 0) return [];

  return [...totals.entries()]
    .map(([categoryId, totalCents]) => {
      const c = byId.get(categoryId);
      return {
        categoryId,
        name: c?.name ?? 'Sem categoria',
        color: c?.color ?? '#94A3B8',
        totalCents,
        percent: totalCents / total,
      };
    })
    .sort((a, b) => b.totalCents - a.totalCents);
};
