import type { Migration } from './index';

export const migration003BackupMeta: Migration = {
  version: 3,
  up: async (db) => {
    await db.execAsync(`
      CREATE TABLE _backup_meta (
        key TEXT PRIMARY KEY,
        value_int INTEGER,
        value_text TEXT,
        updated_at INTEGER NOT NULL
      );
    `);
  },
};
