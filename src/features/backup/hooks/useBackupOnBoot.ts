import { useEffect } from 'react';

import { runBackup } from '../services/backupService';
import { registerBackupTask } from '../services/backupTask';

export const useBackupOnBoot = () => {
  useEffect(() => {
    registerBackupTask().catch(() => {});
    runBackup().catch((e) => {
      console.warn('[backup] boot run failed', e);
    });
  }, []);
};
