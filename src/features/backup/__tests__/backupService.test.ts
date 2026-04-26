const mockArrayBuffer = jest.fn();
jest.mock('expo-file-system', () => ({
  Paths: { document: { uri: 'file:///doc/' } },
  File: jest.fn().mockImplementation((...parts: unknown[]) => ({
    parts,
    arrayBuffer: mockArrayBuffer,
  })),
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn((_s, path: string) => ({ path })),
  uploadBytes: jest.fn(async () => ({})),
}));

jest.mock('@/db/client', () => ({
  getDb: jest.fn(),
}));

jest.mock('../services/firebase', () => ({
  ensureSignedIn: jest.fn(async () => 'uid-test'),
  getFirebaseStorage: jest.fn(() => ({})),
}));

jest.mock('../services/encryption', () => ({
  encryptDb: jest.fn(async (b: Uint8Array) => new Uint8Array([0x4d, 0x54, 0x42, 0x31, ...b])),
}));

jest.mock('../services/lastBackup', () => ({
  getLastBackupAt: jest.fn(),
  setLastBackupAt: jest.fn(async () => {}),
}));

import { File } from 'expo-file-system';
import { ref, uploadBytes } from 'firebase/storage';

import { getDb } from '@/db/client';

import { isDueForBackup, runBackup } from '../services/backupService';
import { encryptDb } from '../services/encryption';
import { ensureSignedIn } from '../services/firebase';
import { getLastBackupAt, setLastBackupAt } from '../services/lastBackup';

describe('isDueForBackup', () => {
  const NOW = Date.parse('2026-04-25T12:00:00Z');

  it('is due when no previous backup', () => {
    expect(isDueForBackup(null, NOW)).toBe(true);
  });

  it('is due when last backup was >= 24h ago', () => {
    const last = new Date(NOW - 25 * 60 * 60 * 1000).toISOString();
    expect(isDueForBackup(last, NOW)).toBe(true);
  });

  it('is not due when last backup was < 24h ago', () => {
    const last = new Date(NOW - 60 * 60 * 1000).toISOString();
    expect(isDueForBackup(last, NOW)).toBe(false);
  });

  it('is due when last backup string is invalid', () => {
    expect(isDueForBackup('not-a-date', NOW)).toBe(true);
  });
});

describe('runBackup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getDb as jest.Mock).mockResolvedValue({ execAsync: jest.fn() });
    mockArrayBuffer.mockResolvedValue(new Uint8Array(Buffer.from('sqlite-bytes')).buffer);
  });

  it('skips when not due and not forced', async () => {
    (getLastBackupAt as jest.Mock).mockResolvedValue(new Date().toISOString());
    const result = await runBackup();
    expect(result).toEqual({ uploaded: false, reason: 'not-due' });
    expect(uploadBytes).not.toHaveBeenCalled();
  });

  it('checkpoints, encrypts, uploads to per-uid path, and persists timestamp', async () => {
    (getLastBackupAt as jest.Mock).mockResolvedValue(null);
    const db = { execAsync: jest.fn() };
    (getDb as jest.Mock).mockResolvedValue(db);

    const result = await runBackup();

    expect(db.execAsync).toHaveBeenCalledWith('PRAGMA wal_checkpoint(TRUNCATE);');
    expect(File).toHaveBeenCalledWith(
      expect.objectContaining({ uri: 'file:///doc/' }),
      'SQLite',
      'my-truck.db',
    );
    expect(mockArrayBuffer).toHaveBeenCalled();
    expect(encryptDb).toHaveBeenCalled();
    expect(ensureSignedIn).toHaveBeenCalled();
    expect(ref).toHaveBeenCalledWith(expect.anything(), 'backups/uid-test/my-truck.db.enc');
    expect(uploadBytes).toHaveBeenCalled();
    expect(setLastBackupAt).toHaveBeenCalled();
    expect(result.uploaded).toBe(true);
  });

  it('forces upload when force=true even if not due', async () => {
    (getLastBackupAt as jest.Mock).mockResolvedValue(new Date().toISOString());
    const result = await runBackup({ force: true });
    expect(result.uploaded).toBe(true);
    expect(uploadBytes).toHaveBeenCalled();
  });
});
