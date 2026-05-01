import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { getDb } from '@/db/client';

import { serializeBackup } from './serialize';
import type { CategoryRow, TransactionRow, TruckRow } from './rows';
import type { BackupFile, BackupPlatform } from '../types';

const detectPlatform = (): BackupPlatform => {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
};

export const buildBackup = async (): Promise<BackupFile> => {
  const db = await getDb();
  const trucks = await db.getAllAsync<TruckRow>('SELECT * FROM trucks');
  const categories = await db.getAllAsync<CategoryRow>('SELECT * FROM categories');
  const transactions = await db.getAllAsync<TransactionRow>('SELECT * FROM transactions');
  const appVersion =
    (Constants.expoConfig?.version as string | undefined) ?? '0.0.0';
  return serializeBackup(
    { trucks, categories, transactions },
    { exportedAt: Date.now(), appVersion, platform: detectPlatform() }
  );
};
