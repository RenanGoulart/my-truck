import { create } from 'zustand';

import { categoriesRepo } from '../repository/categories.repository';
import type { Category, CategoryKind, NewCategory } from '../types';

type State = {
  items: Category[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  create: (input: NewCategory) => Promise<Category>;
  remove: (id: string) => Promise<void>;
  byKind: (kind: CategoryKind) => Category[];
  findById: (id: string) => Category | undefined;
};

export const useCategoriesStore = create<State>((set, get) => ({
  items: [],
  hydrated: false,
  hydrate: async () => {
    const items = await categoriesRepo.listAll();
    set({ items, hydrated: true });
  },
  create: async (input) => {
    const c = await categoriesRepo.create(input);
    set({ items: [...get().items, c].sort(cmp) });
    return c;
  },
  remove: async (id) => {
    await categoriesRepo.softDelete(id);
    set({ items: get().items.filter((c) => c.id !== id) });
  },
  byKind: (kind) => get().items.filter((c) => c.kind === kind),
  findById: (id) => get().items.find((c) => c.id === id),
}));

const cmp = (a: Category, b: Category) =>
  a.kind === b.kind ? a.name.localeCompare(b.name, 'pt-BR') : a.kind.localeCompare(b.kind);
