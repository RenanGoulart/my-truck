import * as SQLite from 'expo-sqlite';

import { runMigrations } from './migrations';

const DB_NAME = 'my-truck.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const getDb = (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync('PRAGMA foreign_keys = ON;');
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await runMigrations(db);
      return db;
    })();
  }
  return dbPromise;
};

export const resetDbForTests = async () => {
  dbPromise = null;
};
