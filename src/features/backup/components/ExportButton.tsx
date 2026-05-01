import { useState } from 'react';
import { Alert, Pressable, Text } from 'react-native';

import { setLastExport } from '../services/backup-meta';
import { buildBackup } from '../services/exporter';
import { shareFile, writeJsonToCache } from '../services/file-io';

const dateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;

type Props = {
  onExported?: () => void;
};

export const ExportButton = ({ onExported }: Props) => {
  const [busy, setBusy] = useState(false);

  const onPress = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const file = await buildBackup();
      const filename = `my-truck-backup-${dateStr(new Date(file.exportedAt))}.json`;
      const uri = await writeJsonToCache(filename, JSON.stringify(file, null, 2));
      await shareFile(uri);
      await setLastExport(file.exportedAt);
      onExported?.();
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha ao exportar');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      className="bg-primary rounded-2xl py-4 px-4 items-center"
    >
      <Text className="text-black font-semibold">
        {busy ? 'Exportando…' : 'Exportar dados'}
      </Text>
    </Pressable>
  );
};
