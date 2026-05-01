import { CURRENT_BACKUP_SCHEMA, type BackupFile, type BackupPlatform } from '../types';
import type { CategoryRow, TransactionRow, TruckRow } from './rows';

export type SerializeData = {
  trucks: TruckRow[];
  categories: CategoryRow[];
  transactions: TransactionRow[];
};

export type SerializeMeta = {
  exportedAt: number;
  appVersion: string;
  platform: BackupPlatform;
};

export const serializeBackup = (
  data: SerializeData,
  meta: SerializeMeta
): BackupFile => ({
  app: 'my-truck',
  schemaVersion: CURRENT_BACKUP_SCHEMA,
  exportedAt: meta.exportedAt,
  exportedBy: { appVersion: meta.appVersion, platform: meta.platform },
  data,
});
