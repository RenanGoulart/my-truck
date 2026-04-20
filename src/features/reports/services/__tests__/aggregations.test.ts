import type { Category } from '@/features/categories/types';
import type { Transaction } from '@/features/transactions/types';

import { expensesByCategory, monthlyByKind, monthRange } from '../aggregations';

const cat = (id: string, name: string, color = '#fff'): Category => ({
  id,
  name,
  kind: 'expense',
  color,
  isSystem: true,
});

const tx = (over: Partial<Transaction>): Transaction => ({
  id: Math.random().toString(),
  truckId: 't1',
  categoryId: 'c1',
  kind: 'expense',
  amountCents: 0,
  occurredAt: new Date(),
  ...over,
});

describe('monthlyByKind', () => {
  test('retorna N buckets em ordem cronológica', () => {
    const ref = new Date('2026-04-15T12:00:00Z');
    const buckets = monthlyByKind([], 6, ref);
    expect(buckets).toHaveLength(6);
    expect(buckets[5].key).toBe('2026-04');
    expect(buckets[0].key).toBe('2025-11');
  });

  test('agrega por mês e por kind', () => {
    const ref = new Date('2026-04-15T12:00:00Z');
    const buckets = monthlyByKind(
      [
        tx({ kind: 'income', amountCents: 10_000, occurredAt: new Date('2026-04-03T12:00:00Z') }),
        tx({ kind: 'expense', amountCents: 2_000, occurredAt: new Date('2026-04-10T12:00:00Z') }),
        tx({ kind: 'expense', amountCents: 500, occurredAt: new Date('2026-03-20T12:00:00Z') }),
      ],
      6,
      ref
    );
    const apr = buckets.find((b) => b.key === '2026-04')!;
    const mar = buckets.find((b) => b.key === '2026-03')!;
    expect(apr.incomeCents).toBe(10_000);
    expect(apr.expenseCents).toBe(2_000);
    expect(mar.expenseCents).toBe(500);
  });

  test('ignora transações fora da janela', () => {
    const ref = new Date('2026-04-15T12:00:00Z');
    const buckets = monthlyByKind(
      [tx({ kind: 'expense', amountCents: 9999, occurredAt: new Date('2020-01-01') })],
      6,
      ref
    );
    expect(buckets.every((b) => b.incomeCents === 0 && b.expenseCents === 0)).toBe(true);
  });
});

describe('monthRange', () => {
  test('cobre N meses até o fim do mês de referência', () => {
    const ref = new Date('2026-04-15T12:00:00Z');
    const { from, to } = monthRange(6, ref);
    expect(new Date(from).getDate()).toBe(1);
    expect(to).toBeGreaterThan(from);
  });
});

describe('expensesByCategory', () => {
  const a = cat('a', 'Combustível', '#f00');
  const b = cat('b', 'Pedágio', '#0f0');

  test('retorna vazio quando não há gastos', () => {
    expect(expensesByCategory([], [a, b])).toEqual([]);
  });

  test('calcula percentuais corretos e ordena desc', () => {
    const slices = expensesByCategory(
      [
        tx({ categoryId: 'a', kind: 'expense', amountCents: 300 }),
        tx({ categoryId: 'b', kind: 'expense', amountCents: 700 }),
        tx({ categoryId: 'a', kind: 'income', amountCents: 999 }),
      ],
      [a, b]
    );
    expect(slices[0].categoryId).toBe('b');
    expect(slices[0].totalCents).toBe(700);
    expect(slices[0].percent).toBeCloseTo(0.7);
    expect(slices[1].percent).toBeCloseTo(0.3);
  });
});
