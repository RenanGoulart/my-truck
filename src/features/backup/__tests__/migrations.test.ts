import { migrateBackup } from '../services/migrations';
import { BackupTooNewError, CURRENT_BACKUP_SCHEMA, type BackupFile } from '../types';

const baseFile = (over: Partial<BackupFile>): BackupFile => ({
  app: 'my-truck',
  schemaVersion: CURRENT_BACKUP_SCHEMA,
  exportedAt: 0,
  exportedBy: { appVersion: '1.0', platform: 'android' },
  data: { trucks: [], categories: [], transactions: [] },
  ...over,
});

describe('migrateBackup', () => {
  test('passa intocado quando já está em CURRENT_BACKUP_SCHEMA', () => {
    const f = baseFile({});
    const out = migrateBackup(f);
    expect(out).toEqual({ ...f, schemaVersion: CURRENT_BACKUP_SCHEMA });
  });

  test('migra v1 → CURRENT', () => {
    const v1 = baseFile({ schemaVersion: 1 });
    const out = migrateBackup(v1);
    expect(out.schemaVersion).toBe(CURRENT_BACKUP_SCHEMA);
  });

  test('migra v2 → CURRENT', () => {
    const v2 = baseFile({ schemaVersion: 2 });
    const out = migrateBackup(v2);
    expect(out.schemaVersion).toBe(CURRENT_BACKUP_SCHEMA);
  });

  test('lança BackupTooNewError para versão > CURRENT', () => {
    const future = baseFile({ schemaVersion: CURRENT_BACKUP_SCHEMA + 1 });
    expect(() => migrateBackup(future)).toThrow(BackupTooNewError);
  });
});
