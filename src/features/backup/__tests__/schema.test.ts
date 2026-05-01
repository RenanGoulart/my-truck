import { parseBackup } from '../services/schema';
import type { BackupFile } from '../types';

const validV3: BackupFile = {
  app: 'my-truck',
  schemaVersion: 3,
  exportedAt: 1730000000000,
  exportedBy: { appVersion: '1.0.0', platform: 'android' },
  data: { trucks: [], categories: [], transactions: [] },
};

describe('parseBackup', () => {
  test('aceita backup v3 vazio válido', () => {
    const out = parseBackup(validV3);
    expect(out.schemaVersion).toBe(3);
    expect(out.app).toBe('my-truck');
  });

  test('rejeita app diferente', () => {
    expect(() => parseBackup({ ...validV3, app: 'other' })).toThrow();
  });

  test('rejeita schemaVersion não numérico', () => {
    expect(() => parseBackup({ ...validV3, schemaVersion: 'x' })).toThrow();
  });

  test('rejeita campo data ausente', () => {
    const { data, ...rest } = validV3;
    expect(() => parseBackup(rest)).toThrow();
  });

  test('aceita backup v1 (categorias sem deleted_at)', () => {
    const v1 = {
      app: 'my-truck',
      schemaVersion: 1,
      exportedAt: 1,
      exportedBy: { appVersion: '0.1', platform: 'android' },
      data: {
        trucks: [
          {
            id: 't1',
            nickname: 'Caminhão',
            plate: null,
            initial_odometer: 0,
            created_at: 1,
            updated_at: 1,
            deleted_at: null,
          },
        ],
        categories: [],
        transactions: [],
      },
    };
    const out = parseBackup(v1);
    expect(out.schemaVersion).toBe(1);
  });
});
