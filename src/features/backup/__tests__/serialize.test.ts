import { CURRENT_BACKUP_SCHEMA } from '../types';
import { serializeBackup } from '../services/serialize';
import type { TruckRow, CategoryRow, TransactionRow } from '../services/rows';

const truck: TruckRow = {
  id: 't1', nickname: 'C', plate: null, initial_odometer: 0,
  created_at: 1, updated_at: 1, deleted_at: null,
};

describe('serializeBackup', () => {
  test('monta envelope com schemaVersion atual', () => {
    const file = serializeBackup(
      { trucks: [truck], categories: [], transactions: [] },
      { exportedAt: 999, appVersion: '1.0.0', platform: 'android' }
    );
    expect(file.app).toBe('my-truck');
    expect(file.schemaVersion).toBe(CURRENT_BACKUP_SCHEMA);
    expect(file.exportedAt).toBe(999);
    expect(file.exportedBy.platform).toBe('android');
    expect(file.data.trucks).toHaveLength(1);
    expect(file.data.trucks[0]).toEqual(truck);
  });

  test('preserva ordem dos rows', () => {
    const cats: CategoryRow[] = [
      { id: 'a', name: 'A', kind: 'income', icon: null, color: null, is_system: 0, created_at: 1, updated_at: 1, deleted_at: null },
      { id: 'b', name: 'B', kind: 'expense', icon: null, color: null, is_system: 0, created_at: 2, updated_at: 2, deleted_at: null },
    ];
    const file = serializeBackup(
      { trucks: [], categories: cats, transactions: [] },
      { exportedAt: 1, appVersion: '1', platform: 'ios' }
    );
    expect(file.data.categories.map((c) => c.id)).toEqual(['a', 'b']);
  });

  test('inclui rows soft-deleted', () => {
    const tx: TransactionRow = {
      id: 'x', truck_id: 't1', category_id: 'c1', kind: 'expense',
      amount_cents: 100, occurred_at: 1, description: null, odometer: null,
      liters: null, price_per_liter_cents: null, created_at: 1, updated_at: 1,
      deleted_at: 999, sync_status: 'pending', server_id: null, server_updated_at: null,
    };
    const file = serializeBackup(
      { trucks: [], categories: [], transactions: [tx] },
      { exportedAt: 1, appVersion: '1', platform: 'web' }
    );
    expect(file.data.transactions[0].deleted_at).toBe(999);
  });
});
