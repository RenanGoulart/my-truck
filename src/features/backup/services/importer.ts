import { getDb } from '@/db/client';

import type { BackupFile } from '../types';
import type { CategoryRow, TransactionRow, TruckRow } from './rows';

const insertTruck = async (db: Awaited<ReturnType<typeof getDb>>, t: TruckRow) => {
  await db.runAsync(
    `INSERT INTO trucks
     (id, nickname, plate, initial_odometer, created_at, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [t.id, t.nickname, t.plate, t.initial_odometer, t.created_at, t.updated_at, t.deleted_at]
  );
};

const insertCategory = async (
  db: Awaited<ReturnType<typeof getDb>>,
  c: CategoryRow
) => {
  await db.runAsync(
    `INSERT INTO categories
     (id, name, kind, icon, color, is_system, created_at, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [c.id, c.name, c.kind, c.icon, c.color, c.is_system, c.created_at, c.updated_at, c.deleted_at]
  );
};

const insertTransaction = async (
  db: Awaited<ReturnType<typeof getDb>>,
  t: TransactionRow
) => {
  await db.runAsync(
    `INSERT INTO transactions
     (id, truck_id, category_id, kind, amount_cents, occurred_at,
      description, odometer, liters, price_per_liter_cents,
      created_at, updated_at, deleted_at, sync_status, server_id, server_updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      t.id, t.truck_id, t.category_id, t.kind, t.amount_cents, t.occurred_at,
      t.description, t.odometer, t.liters, t.price_per_liter_cents,
      t.created_at, t.updated_at, t.deleted_at, t.sync_status, t.server_id, t.server_updated_at,
    ]
  );
};

export const applyBackup = async (file: BackupFile): Promise<void> => {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM transactions; DELETE FROM categories; DELETE FROM trucks;');
    for (const t of file.data.trucks) await insertTruck(db, t);
    for (const c of file.data.categories) await insertCategory(db, c);
    for (const t of file.data.transactions) await insertTransaction(db, t);
  });
};
