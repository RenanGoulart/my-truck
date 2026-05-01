import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { getLastExport } from '../services/backup-meta';

const formatAge = (last: number | null): string => {
  if (last === null) return 'Nenhuma exportação feita ainda';
  const days = Math.floor((Date.now() - last) / (24 * 60 * 60 * 1000));
  if (days === 0) return 'Última exportação: hoje';
  if (days === 1) return 'Última exportação: 1 dia atrás';
  return `Última exportação: ${days} dias atrás`;
};

type Props = { reloadKey?: number };

export const BackupCard = ({ reloadKey = 0 }: Props) => {
  const [last, setLast] = useState<number | null>(null);

  useEffect(() => {
    void getLastExport().then(setLast);
  }, [reloadKey]);

  const stale = last !== null && Date.now() - last > 30 * 24 * 60 * 60 * 1000;

  return (
    <View className={`rounded-2xl px-4 py-4 border ${stale ? 'border-amber-400 bg-amber-500/10' : 'border-border bg-surface'}`}>
      <Text className="text-white text-sm">{formatAge(last)}</Text>
      <Text className="text-muted text-xs mt-1">
        Sem backup, perda do dispositivo = perda dos dados.
      </Text>
    </View>
  );
};
