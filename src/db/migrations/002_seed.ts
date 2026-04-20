import { uuid } from '@/shared/lib/uuid';

import type { Migration } from './index';

type SeedCategory = {
  name: string;
  kind: 'income' | 'expense';
  icon: string;
  color: string;
};

const SEED: SeedCategory[] = [
  { name: 'Frete', kind: 'income', icon: 'truck', color: '#22C55E' },
  { name: 'Outros ganhos', kind: 'income', icon: 'plus-circle', color: '#16A34A' },

  { name: 'Combustível', kind: 'expense', icon: 'fuel', color: '#EF4444' },
  { name: 'Pedágio', kind: 'expense', icon: 'road', color: '#F97316' },
  { name: 'Manutenção', kind: 'expense', icon: 'wrench', color: '#EAB308' },
  { name: 'Pneus', kind: 'expense', icon: 'circle', color: '#A855F7' },
  { name: 'Alimentação', kind: 'expense', icon: 'utensils', color: '#EC4899' },
  { name: 'Hospedagem', kind: 'expense', icon: 'bed', color: '#06B6D4' },
  { name: 'Documentação', kind: 'expense', icon: 'file-text', color: '#64748B' },
  { name: 'Outros gastos', kind: 'expense', icon: 'more-horizontal', color: '#94A3B8' },
];

export const migration002Seed: Migration = {
  version: 2,
  up: async (db) => {
    const now = Date.now();
    for (const c of SEED) {
      await db.runAsync(
        `INSERT INTO categories
         (id, name, kind, icon, color, is_system, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
        [uuid(), c.name, c.kind, c.icon, c.color, now, now]
      );
    }
  },
};
