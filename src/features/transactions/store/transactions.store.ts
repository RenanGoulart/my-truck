import { create } from 'zustand';
import { addMonths, subMonths } from 'date-fns';

import { type Period } from '@/shared/lib/date';
import {
  periodForSelection,
  type PeriodMode,
} from '@/shared/lib/periodFilter';

import { transactionsRepo } from '../repository/transactions.repository';
import type { NewTransaction, Transaction, TransactionPatch } from '../types';

type State = {
  truckId: string | null;
  items: Transaction[];
  period: Period;
  periodMode: PeriodMode;
  selectedMonth: Date;
  isLoading: boolean;
  incomeCents: number;
  expenseCents: number;
  setTruck: (truckId: string) => void;
  setPeriod: (p: Period) => Promise<void>;
  setPeriodMode: (mode: PeriodMode) => Promise<void>;
  setSelectedMonth: (month: Date) => Promise<void>;
  goToPreviousMonth: () => Promise<void>;
  goToNextMonth: () => Promise<void>;
  load: () => Promise<void>;
  add: (input: Omit<NewTransaction, 'truckId'>) => Promise<Transaction>;
  update: (id: string, patch: TransactionPatch) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

const initialSelectedMonth = new Date();
const initialPeriodMode: PeriodMode = 'month';
let loadSequence = 0;

export const useTransactionsStore = create<State>((set, get) => ({
  truckId: null,
  items: [],
  period: periodForSelection(initialPeriodMode, initialSelectedMonth),
  periodMode: initialPeriodMode,
  selectedMonth: initialSelectedMonth,
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

  setPeriodMode: async (periodMode) => {
    const selectedMonth = get().selectedMonth;
    set({ periodMode, period: periodForSelection(periodMode, selectedMonth) });
    await get().load();
  },

  setSelectedMonth: async (selectedMonth) => {
    const periodMode = get().periodMode;
    set({ selectedMonth, period: periodForSelection(periodMode, selectedMonth) });
    await get().load();
  },

  goToPreviousMonth: async () => {
    const selectedMonth = subMonths(get().selectedMonth, 1);
    set({
      selectedMonth,
      period: periodForSelection(get().periodMode, selectedMonth),
    });
    await get().load();
  },

  goToNextMonth: async () => {
    const selectedMonth = addMonths(get().selectedMonth, 1);
    set({
      selectedMonth,
      period: periodForSelection(get().periodMode, selectedMonth),
    });
    await get().load();
  },

  load: async () => {
    const requestId = ++loadSequence;
    const { truckId, period } = get();
    if (!truckId) return;
    set({ isLoading: true });
    const [items, totals] = await Promise.all([
      transactionsRepo.listByPeriod(truckId, period),
      transactionsRepo.sumByKind(truckId, period),
    ]);
    if (requestId !== loadSequence) return;
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
