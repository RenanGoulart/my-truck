import { getDb } from '@/db/client';
import { uuid } from '@/shared/lib/uuid';

import type { Category, NewCategory } from '../types';

type Row = {
  id: string;
  name: string;
  kind: 'income' | 'expense';
  icon: string | null;
  color: string | null;
  is_system: number;
};

const rowToCategory = (r: Row): Category => ({
  id: r.id,
  name: r.name,
  kind: r.kind,
  icon: r.icon ?? undefined,
  color: r.color ?? undefined,
  isSystem: r.is_system === 1,
});

export const categoriesRepo = {
  async listAll(): Promise<Category[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<Row>(
      `SELECT * FROM categories
       WHERE deleted_at IS NULL
       ORDER BY kind, name`
    );
    return rows.map(rowToCategory);
  },

  async create(input: NewCategory): Promise<Category> {
    const db = await getDb();
    const now = Date.now();
    const id = uuid();
    await db.runAsync(
      `INSERT INTO categories
       (id, name, kind, icon, color, is_system, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
      [id, input.name, input.kind, input.icon ?? null, input.color ?? null, now, now]
    );
    return { id, isSystem: false, ...input };
  },

  async softDelete(id: string): Promise<void> {
    const db = await getDb();
    const now = Date.now();
    await db.runAsync(
      `UPDATE categories
       SET deleted_at = ?, updated_at = ?
       WHERE id = ? AND is_system = 0`,
      [now, now, id]
    );
  },
};
