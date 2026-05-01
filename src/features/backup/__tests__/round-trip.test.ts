import { migrateBackup } from '../services/migrations';
import { parseBackup } from '../services/schema';
import { serializeBackup } from '../services/serialize';
import { CURRENT_BACKUP_SCHEMA } from '../types';
import type { TruckRow } from '../services/rows';

const truck: TruckRow = {
  id: 't1', nickname: 'X', plate: 'ABC1D23', initial_odometer: 50000,
  created_at: 1, updated_at: 1, deleted_at: null,
};

describe('round-trip', () => {
  test('serialize → JSON → parse → migrate retorna dados equivalentes', () => {
    const original = serializeBackup(
      { trucks: [truck], categories: [], transactions: [] },
      { exportedAt: 1234, appVersion: '1.0.0', platform: 'android' }
    );
    const json = JSON.stringify(original);
    const parsed = parseBackup(JSON.parse(json));
    const migrated = migrateBackup(parsed);
    expect(migrated.schemaVersion).toBe(CURRENT_BACKUP_SCHEMA);
    expect(migrated.data.trucks).toEqual([truck]);
    expect(migrated.exportedAt).toBe(1234);
  });

  test('JSON é estável (idempotente quando re-serializado)', () => {
    const file = serializeBackup(
      { trucks: [truck], categories: [], transactions: [] },
      { exportedAt: 1, appVersion: '1', platform: 'ios' }
    );
    const a = JSON.stringify(file);
    const b = JSON.stringify(parseBackup(JSON.parse(a)));
    expect(a).toBe(b);
  });
});
