import {
  BackupTooNewError,
  CURRENT_BACKUP_SCHEMA,
  type BackupFile,
} from '../types';

type Step = { from: number; to: number; up: (file: BackupFile) => BackupFile };

const steps: Step[] = [
  { from: 1, to: 2, up: (file) => ({ ...file, schemaVersion: 2 }) },
  { from: 2, to: 3, up: (file) => ({ ...file, schemaVersion: 3 }) },
];

export const migrateBackup = (input: BackupFile): BackupFile => {
  if (input.schemaVersion > CURRENT_BACKUP_SCHEMA) {
    throw new BackupTooNewError(input.schemaVersion, CURRENT_BACKUP_SCHEMA);
  }
  let cur = input;
  while (cur.schemaVersion < CURRENT_BACKUP_SCHEMA) {
    const step = steps.find((s) => s.from === cur.schemaVersion);
    if (!step) {
      throw new Error(`No migration step from v${cur.schemaVersion}`);
    }
    cur = step.up(cur);
  }
  return cur;
};
