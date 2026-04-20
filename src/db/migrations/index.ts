import type { SQLiteDatabase } from 'expo-sqlite';

import { migration001Init } from './001_init';
import { migration002Seed } from './002_seed';

export type Migration = {
  version: number;
  up: (db: SQLiteDatabase) => Promise<void>;
};

const migrations: Migration[] = [migration001Init, migration002Seed];

export const runMigrations = async (db: SQLiteDatabase): Promise<void> => {
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS _schema_migrations (
       version INTEGER PRIMARY KEY,
       applied_at INTEGER NOT NULL
     );`
  );

  const row = await db.getFirstAsync<{ v: number | null }>(
    'SELECT MAX(version) AS v FROM _schema_migrations'
  );
  const current = row?.v ?? 0;

  const pending = migrations
    .filter((m) => m.version > current)
    .sort((a, b) => a.version - b.version);

  for (const m of pending) {
    await db.withTransactionAsync(async () => {
      await m.up(db);
      await db.runAsync(
        'INSERT INTO _schema_migrations (version, applied_at) VALUES (?, ?)',
        [m.version, Date.now()]
      );
    });
  }
};
