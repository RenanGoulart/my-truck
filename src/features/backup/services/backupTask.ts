import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { runBackup } from './backupService';

export const BACKUP_TASK = 'mytruck.dailyBackup';

if (!TaskManager.isTaskDefined(BACKUP_TASK)) {
  TaskManager.defineTask(BACKUP_TASK, async () => {
    try {
      const result = await runBackup();
      return result.uploaded
        ? BackgroundTask.BackgroundTaskResult.Success
        : BackgroundTask.BackgroundTaskResult.Success;
    } catch (e) {
      console.warn('[backup-task] failed', e);
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

export const registerBackupTask = async (): Promise<void> => {
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) return;
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKUP_TASK);
    if (isRegistered) return;
    await BackgroundTask.registerTaskAsync(BACKUP_TASK, { minimumInterval: 60 * 24 });
  } catch (e) {
    console.warn('[backup-task] register failed', e);
  }
};
