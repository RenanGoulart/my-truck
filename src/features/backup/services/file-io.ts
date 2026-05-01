import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const PRE_RESTORE_DIR = new Directory(Paths.document, 'pre-restore/');
const MAX_PRE_RESTORE = 3;

export const writeJsonToCache = async (
  filename: string,
  json: string
): Promise<string> => {
  const file = new File(Paths.cache, filename);
  file.write(json);
  return file.uri;
};

export const shareFile = async (uri: string): Promise<void> => {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Compartilhamento indisponível neste dispositivo');
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: 'Salvar backup',
  });
};

export const pickJsonFile = async (): Promise<string | null> => {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const asset = result.assets?.[0];
  if (!asset) return null;
  const file = new File(asset.uri);
  return file.text();
};

const ensurePreRestoreDir = (): void => {
  if (!PRE_RESTORE_DIR.exists) {
    PRE_RESTORE_DIR.create({ intermediates: true, idempotent: true });
  }
};

export const writePreRestore = async (json: string): Promise<string> => {
  ensurePreRestoreDir();
  const filename = `pre-restore-${Date.now()}.json`;
  const file = new File(PRE_RESTORE_DIR, filename);
  file.write(json);
  rotatePreRestore();
  return file.uri;
};

const rotatePreRestore = (): void => {
  const entries = PRE_RESTORE_DIR.list();
  if (entries.length <= MAX_PRE_RESTORE) return;
  const files = entries
    .filter((e): e is File => e instanceof File)
    .sort((a, b) => a.uri.localeCompare(b.uri));
  const toDelete = files.slice(0, files.length - MAX_PRE_RESTORE);
  for (const f of toDelete) {
    if (f.exists) f.delete();
  }
};
