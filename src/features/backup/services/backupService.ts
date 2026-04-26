import { File, Paths } from 'expo-file-system';
import { ref, uploadBytes } from 'firebase/storage';

import { getDb } from '@/db/client';

import { encryptDb } from './encryption';
import { ensureSignedIn, getFirebaseStorage } from './firebase';
import { getLastBackupAt, setLastBackupAt } from './lastBackup';

const DAY_MS = 24 * 60 * 60 * 1000;

export const isDueForBackup = (lastIso: string | null, now = Date.now()): boolean => {
  if (!lastIso) return true;
  const last = Date.parse(lastIso);
  if (Number.isNaN(last)) return true;
  return now - last >= DAY_MS;
};

const readDbFile = async (): Promise<Uint8Array> => {
  const file = new File(Paths.document, 'SQLite', 'my-truck.db');
  const buf = await file.arrayBuffer();
  return new Uint8Array(buf);
};

const checkpoint = async (): Promise<void> => {
  const db = await getDb();
  await db.execAsync('PRAGMA wal_checkpoint(TRUNCATE);');
};

export type BackupResult = { uploaded: boolean; reason?: string };

export const runBackup = async ({ force = false }: { force?: boolean } = {}): Promise<BackupResult> => {
  const last = await getLastBackupAt();
  if (!force && !isDueForBackup(last)) {
    return { uploaded: false, reason: 'not-due' };
  }

  await checkpoint();
  const plain = await readDbFile();
  const envelope = await encryptDb(plain);

  const uid = await ensureSignedIn();
  const storage = getFirebaseStorage();
  const path = `backups/${uid}/my-truck.db.enc`;
  await uploadBytes(ref(storage, path), envelope, {
    contentType: 'application/octet-stream',
    customMetadata: { encryption: 'AES-GCM', envelope: 'MTB1' },
  });

  await setLastBackupAt(new Date().toISOString());
  return { uploaded: true };
};
