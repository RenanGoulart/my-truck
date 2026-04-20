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

type Input = {
  txs: Transaction[];
  categories: Category[];
  incomeCents: number;
  expenseCents: number;
  initialOdometer: number;
  baselineOdometer: number | null;
};

export const buildSummary = ({
  txs,
  categories,
  incomeCents,
  expenseCents,
  initialOdometer,
  baselineOdometer,
}: Input): DashboardSummary => {
  const byId = new Map(categories.map((c) => [c.id, c]));

  const fuelTxs = txs
    .filter((t) => t.kind === 'expense' && isFuel(byId.get(t.categoryId)))
    .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

  const fuelCostCents = fuelTxs.reduce((sum, t) => sum + t.amountCents, 0);

  const odometersInPeriod = fuelTxs
    .map((t) => t.odometer)
    .filter((o): o is number => typeof o === 'number' && o >= 0);

  const latestInPeriod =
    odometersInPeriod.length > 0
      ? Math.max(...odometersInPeriod)
      : null;

  const baseline = baselineOdometer ?? initialOdometer;

  const kmDriven =
    latestInPeriod !== null && latestInPeriod > baseline
      ? latestInPeriod - baseline
      : null;

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
