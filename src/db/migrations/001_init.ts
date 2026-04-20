import type { Migration } from './index';

export const migration001Init: Migration = {
  version: 1,
  up: async (db) => {
    await db.execAsync(`
      CREATE TABLE trucks (
        id TEXT PRIMARY KEY,
        nickname TEXT NOT NULL,
        plate TEXT,
        initial_odometer REAL NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER
      );

      CREATE TABLE categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        kind TEXT NOT NULL CHECK (kind IN ('income','expense')),
        icon TEXT,
        color TEXT,
        is_system INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER
      );

      CREATE TABLE transactions (
        id TEXT PRIMARY KEY,
        truck_id TEXT NOT NULL REFERENCES trucks(id),
        category_id TEXT NOT NULL REFERENCES categories(id),
        kind TEXT NOT NULL CHECK (kind IN ('income','expense')),
        amount_cents INTEGER NOT NULL,
        occurred_at INTEGER NOT NULL,
        description TEXT,
        odometer REAL,
        liters REAL,
        price_per_liter_cents INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER,
        sync_status TEXT NOT NULL DEFAULT 'pending'
          CHECK (sync_status IN ('pending','synced','conflict')),
        server_id TEXT,
        server_updated_at INTEGER
      );

      CREATE INDEX idx_tx_occurred_at ON transactions(occurred_at);
      CREATE INDEX idx_tx_truck_kind  ON transactions(truck_id, kind, occurred_at);
      CREATE INDEX idx_tx_category    ON transactions(category_id);
      CREATE INDEX idx_tx_sync        ON transactions(sync_status)
        WHERE sync_status != 'synced';
    `);
  },
};
