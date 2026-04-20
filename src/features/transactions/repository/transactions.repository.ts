import { getDb } from '@/db/client';
import type { Period } from '@/shared/lib/date';
import { uuid } from '@/shared/lib/uuid';

import type { NewTransaction, Transaction, TransactionPatch } from '../types';

type Row = {
  id: string;
  truck_id: string;
  category_id: string;
  kind: 'income' | 'expense';
  amount_cents: number;
  occurred_at: number;
  description: string | null;
  odometer: number | null;
  liters: number | null;
  price_per_liter_cents: number | null;
};

const rowToTx = (r: Row): Transaction => ({
  id: r.id,
  truckId: r.truck_id,
  categoryId: r.category_id,
  kind: r.kind,
  amountCents: r.amount_cents,
  occurredAt: new Date(r.occurred_at),
  description: r.description ?? undefined,
  odometer: r.odometer ?? undefined,
  liters: r.liters ?? undefined,
  pricePerLiterCents: r.price_per_liter_cents ?? undefined,
});

export const transactionsRepo = {
  async insert(input: NewTransaction): Promise<Transaction> {
    const db = await getDb();
    const now = Date.now();
    const id = uuid();
    await db.runAsync(
      `INSERT INTO transactions
       (id, truck_id, category_id, kind, amount_cents, occurred_at,
        description, odometer, liters, price_per_liter_cents,
        created_at, updated_at, sync_status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?, 'pending')`,
      [
        id,
        input.truckId,
        input.categoryId,
        input.kind,
        input.amountCents,
        input.occurredAt.getTime(),
        input.description ?? null,
        input.odometer ?? null,
        input.liters ?? null,
        input.pricePerLiterCents ?? null,
        now,
        now,
      ]
    );
    return { id, ...input };
  },

  async update(id: string, patch: TransactionPatch): Promise<void> {
    const db = await getDb();
    const now = Date.now();
    const fields: string[] = [];
    const values: (string | number | null)[] = [];
    const set = (col: string, val: string | number | null | undefined) => {
      if (val === undefined) return;
      fields.push(`${col} = ?`);
      values.push(val);
    };
    set('category_id', patch.categoryId);
    set('kind', patch.kind);
    set('amount_cents', patch.amountCents);
    set('occurred_at', patch.occurredAt ? patch.occurredAt.getTime() : undefined);
    set('description', patch.description ?? null);
    set('odometer', patch.odometer ?? null);
    set('liters', patch.liters ?? null);
    set('price_per_liter_cents', patch.pricePerLiterCents ?? null);
    if (fields.length === 0) return;
    fields.push(`updated_at = ?`, `sync_status = 'pending'`);
    values.push(now, id);
    await db.runAsync(
      `UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  async softDelete(id: string): Promise<void> {
    const db = await getDb();
    const now = Date.now();
    await db.runAsync(
      `UPDATE transactions
       SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
       WHERE id = ?`,
      [now, now, id]
    );
  },

  async findById(id: string): Promise<Transaction | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<Row>(
      `SELECT * FROM transactions WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return row ? rowToTx(row) : null;
  },

  async listByPeriod(truckId: string, { from, to }: Period): Promise<Transaction[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<Row>(
      `SELECT * FROM transactions
       WHERE truck_id = ? AND deleted_at IS NULL
         AND occurred_at BETWEEN ? AND ?
       ORDER BY occurred_at DESC, created_at DESC`,
      [truckId, from, to]
    );
    return rows.map(rowToTx);
  },

  async lastOdometerBefore(truckId: string, beforeEpoch: number): Promise<number | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ odometer: number | null }>(
      `SELECT odometer FROM transactions
       WHERE truck_id = ? AND deleted_at IS NULL
         AND occurred_at < ? AND odometer IS NOT NULL
       ORDER BY occurred_at DESC, created_at DESC
       LIMIT 1`,
      [truckId, beforeEpoch]
    );
    return row?.odometer ?? null;
  },

  async sumByKind(
    truckId: string,
    { from, to }: Period
  ): Promise<{ incomeCents: number; expenseCents: number }> {
    const db = await getDb();
    const rows = await db.getAllAsync<{ kind: 'income' | 'expense'; total: number }>(
      `SELECT kind, SUM(amount_cents) AS total
       FROM transactions
       WHERE truck_id = ? AND deleted_at IS NULL
         AND occurred_at BETWEEN ? AND ?
       GROUP BY kind`,
      [truckId, from, to]
    );
    const income = rows.find((r) => r.kind === 'income')?.total ?? 0;
    const expense = rows.find((r) => r.kind === 'expense')?.total ?? 0;
    return { incomeCents: income, expenseCents: expense };
  },
};
