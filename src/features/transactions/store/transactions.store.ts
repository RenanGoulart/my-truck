import { create } from 'zustand';

import { currentMonthRange, type Period } from '@/shared/lib/date';

import { transactionsRepo } from '../repository/transactions.repository';
import type { NewTransaction, Transaction, TransactionPatch } from '../types';

type State = {
  truckId: string | null;
  items: Transaction[];
  period: Period;
  isLoading: boolean;
  incomeCents: number;
  expenseCents: number;
  setTruck: (truckId: string) => void;
  setPeriod: (p: Period) => Promise<void>;
  load: () => Promise<void>;
  add: (input: Omit<NewTransaction, 'truckId'>) => Promise<Transaction>;
  update: (id: string, patch: TransactionPatch) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export const useTransactionsStore = create<State>((set, get) => ({
  truckId: null,
  items: [],
  period: currentMonthRange(),
  isLoading: false,
  incomeCents: 0,
  expenseCents: 0,

  setTruck: (truckId) => {
    if (get().truckId === truckId) return;
    set({ truckId });
    void get().load();
  },

  setPeriod: async (period) => {
    set({ period });
    await get().load();
  },

  load: async () => {
    const { truckId, period } = get();
    if (!truckId) return;
    set({ isLoading: true });
    const [items, totals] = await Promise.all([
      transactionsRepo.listByPeriod(truckId, period),
      transactionsRepo.sumByKind(truckId, period),
    ]);
    set({
      items,
      incomeCents: totals.incomeCents,
      expenseCents: totals.expenseCents,
      isLoading: false,
    });
  },

  add: async (input) => {
    const { truckId } = get();
    if (!truckId) throw new Error('Nenhum caminhão ativo');
    const created = await transactionsRepo.insert({ ...input, truckId });
    await get().load();
    return created;
  },

  update: async (id, patch) => {
    await transactionsRepo.update(id, patch);
    await get().load();
  },

  remove: async (id) => {
    await transactionsRepo.softDelete(id);
    await get().load();
  },
}));
