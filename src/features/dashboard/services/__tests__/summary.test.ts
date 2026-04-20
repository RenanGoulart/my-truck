import type { Category } from '@/features/categories/types';
import type { Transaction } from '@/features/transactions/types';

import { buildSummary } from '../summary';

const fuel: Category = { id: 'c1', name: 'Combustível', kind: 'expense', isSystem: true };
const toll: Category = { id: 'c2', name: 'Pedágio', kind: 'expense', isSystem: true };
const freight: Category = { id: 'c3', name: 'Frete', kind: 'income', isSystem: true };

const tx = (over: Partial<Transaction>): Transaction => ({
  id: Math.random().toString(),
  truckId: 't1',
  categoryId: fuel.id,
  kind: 'expense',
  amountCents: 0,
  occurredAt: new Date('2026-04-01T12:00:00Z'),
  ...over,
});

describe('buildSummary', () => {
  test('calcula saldo a partir de income/expense', () => {
    const s = buildSummary({
      txs: [],
      categories: [fuel, toll, freight],
      incomeCents: 100_000,
      expenseCents: 30_000,
      initialOdometer: 0,
      baselineOdometer: null,
    });
    expect(s.balanceCents).toBe(70_000);
    expect(s.fuelCostCents).toBe(0);
    expect(s.kmDriven).toBeNull();
    expect(s.costPerKmCents).toBeNull();
  });

  test('soma apenas combustível como fuelCost', () => {
    const s = buildSummary({
      txs: [
        tx({ categoryId: fuel.id, amountCents: 20_000 }),
        tx({ categoryId: toll.id, amountCents: 5_000 }),
      ],
      categories: [fuel, toll, freight],
      incomeCents: 0,
      expenseCents: 25_000,
      initialOdometer: 0,
      baselineOdometer: null,
    });
    expect(s.fuelCostCents).toBe(20_000);
  });

  test('usa baselineOdometer quando informado', () => {
    const s = buildSummary({
      txs: [
        tx({ categoryId: fuel.id, amountCents: 30_000, odometer: 1500 }),
      ],
      categories: [fuel],
      incomeCents: 0,
      expenseCents: 30_000,
      initialOdometer: 100,
      baselineOdometer: 1000,
    });
    expect(s.kmDriven).toBe(500);
    expect(s.costPerKmCents).toBe(Math.round(30_000 / 500));
  });

  test('cai para initialOdometer quando baseline é null', () => {
    const s = buildSummary({
      txs: [
        tx({ categoryId: fuel.id, amountCents: 10_000, odometer: 200 }),
      ],
      categories: [fuel],
      incomeCents: 0,
      expenseCents: 10_000,
      initialOdometer: 100,
      baselineOdometer: null,
    });
    expect(s.kmDriven).toBe(100);
  });

  test('aceita odômetro 0 quando caminhão é novo', () => {
    const s = buildSummary({
      txs: [tx({ categoryId: fuel.id, amountCents: 5_000, odometer: 10 })],
      categories: [fuel],
      incomeCents: 0,
      expenseCents: 5_000,
      initialOdometer: 0,
      baselineOdometer: 0,
    });
    expect(s.kmDriven).toBe(10);
    expect(s.costPerKmCents).toBe(Math.round(5_000 / 10));
  });

  test('km é null quando odômetro não supera o baseline', () => {
    const s = buildSummary({
      txs: [tx({ categoryId: fuel.id, amountCents: 10_000, odometer: 50 })],
      categories: [fuel],
      incomeCents: 0,
      expenseCents: 10_000,
      initialOdometer: 100,
      baselineOdometer: null,
    });
    expect(s.kmDriven).toBeNull();
    expect(s.costPerKmCents).toBeNull();
  });
});
