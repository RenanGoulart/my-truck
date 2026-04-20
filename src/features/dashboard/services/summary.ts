import type { Category } from '@/features/categories/types';
import type { Transaction } from '@/features/transactions/types';

export type DashboardSummary = {
  balanceCents: number;
  incomeCents: number;
  expenseCents: number;
  fuelCostCents: number;
  kmDriven: number | null;
  costPerKmCents: number | null;
};

const isFuel = (category: Category | undefined): boolean =>
  category?.name.toLowerCase().trim() === 'combustível';

export const buildSummary = (
  txs: Transaction[],
  categories: Category[],
  incomeCents: number,
  expenseCents: number
): DashboardSummary => {
  const byId = new Map(categories.map((c) => [c.id, c]));

  const fuelTxs = txs
    .filter((t) => t.kind === 'expense' && isFuel(byId.get(t.categoryId)))
    .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

  const fuelCostCents = fuelTxs.reduce((sum, t) => sum + t.amountCents, 0);

  const odometers = fuelTxs
    .map((t) => t.odometer)
    .filter((o): o is number => typeof o === 'number' && o > 0);

  const kmDriven =
    odometers.length >= 2 ? odometers[odometers.length - 1] - odometers[0] : null;

  const costPerKmCents =
    kmDriven && kmDriven > 0 ? Math.round(fuelCostCents / kmDriven) : null;

  return {
    balanceCents: incomeCents - expenseCents,
    incomeCents,
    expenseCents,
    fuelCostCents,
    kmDriven,
    costPerKmCents,
  };
};
