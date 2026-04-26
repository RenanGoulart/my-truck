import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'mytruck.backup.lastAt';

export const getLastBackupAt = async (): Promise<string | null> => {
  return AsyncStorage.getItem(KEY);
};

export const setLastBackupAt = async (iso: string): Promise<void> => {
  await AsyncStorage.setItem(KEY, iso);
};
