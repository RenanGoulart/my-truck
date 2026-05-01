import { z } from 'zod';

import { BackupInvalidError, type BackupFile } from '../types';

const truckRowV1 = z.object({
  id: z.string(),
  nickname: z.string(),
  plate: z.string().nullable(),
  initial_odometer: z.number(),
  created_at: z.number(),
  updated_at: z.number(),
  deleted_at: z.number().nullable(),
});

const categoryRowV1 = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(['income', 'expense']),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  is_system: z.number(),
  created_at: z.number(),
  updated_at: z.number(),
  deleted_at: z.number().nullable(),
});

const transactionRowV1 = z.object({
  id: z.string(),
  truck_id: z.string(),
  category_id: z.string(),
  kind: z.enum(['income', 'expense']),
  amount_cents: z.number(),
  occurred_at: z.number(),
  description: z.string().nullable(),
  odometer: z.number().nullable(),
  liters: z.number().nullable(),
  price_per_liter_cents: z.number().nullable(),
  created_at: z.number(),
  updated_at: z.number(),
  deleted_at: z.number().nullable(),
  sync_status: z.enum(['pending', 'synced', 'conflict']),
  server_id: z.string().nullable(),
  server_updated_at: z.number().nullable(),
});

const baseEnvelope = z.object({
  app: z.literal('my-truck'),
  schemaVersion: z.number().int().positive(),
  exportedAt: z.number(),
  exportedBy: z.object({
    appVersion: z.string(),
    platform: z.enum(['ios', 'android', 'web']),
  }),
  data: z.object({
    trucks: z.array(truckRowV1),
    categories: z.array(categoryRowV1),
    transactions: z.array(transactionRowV1),
  }),
});

export const parseBackup = (input: unknown): BackupFile => {
  const result = baseEnvelope.safeParse(input);
  if (!result.success) {
    throw new BackupInvalidError(`Backup inválido: ${result.error.message}`);
  }
  return result.data as BackupFile;
};
