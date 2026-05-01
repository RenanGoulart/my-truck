import type { CategoryRow, TransactionRow, TruckRow } from './services/rows';

export const CURRENT_BACKUP_SCHEMA = 3;

export type BackupPlatform = 'ios' | 'android' | 'web';

export type BackupFile = {
  app: 'my-truck';
  schemaVersion: number;
  exportedAt: number;
  exportedBy: { appVersion: string; platform: BackupPlatform };
  data: {
    trucks: TruckRow[];
    categories: CategoryRow[];
    transactions: TransactionRow[];
  };
};

export class BackupTooNewError extends Error {
  constructor(public got: number, public max: number) {
    super(`Backup schema v${got} is newer than app's v${max}. Update the app.`);
    this.name = 'BackupTooNewError';
  }
}

export class BackupInvalidError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackupInvalidError';
  }
}
