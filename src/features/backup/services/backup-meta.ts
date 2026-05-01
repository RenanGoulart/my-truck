import { getDb } from '@/db/client';

const KEY_LAST_EXPORT = 'last_export_at';

export const setLastExport = async (timestamp: number): Promise<void> => {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO _backup_meta (key, value_int, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value_int = excluded.value_int, updated_at = excluded.updated_at`,
    [KEY_LAST_EXPORT, timestamp, Date.now()]
  );
};

export const getLastExport = async (): Promise<number | null> => {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value_int: number | null }>(
    'SELECT value_int FROM _backup_meta WHERE key = ?',
    [KEY_LAST_EXPORT]
  );
  return row?.value_int ?? null;
};
