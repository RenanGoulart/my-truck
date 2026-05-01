import { useState } from 'react';
import { Alert, Pressable, Text } from 'react-native';

import { useCategoriesStore } from '@/features/categories/store/categories.store';
import { useTransactionsStore } from '@/features/transactions/store/transactions.store';
import { useTruckStore } from '@/features/truck/store/truck.store';

import { buildBackup } from '../services/exporter';
import { applyBackup } from '../services/importer';
import { pickJsonFile, shareFile, writePreRestore } from '../services/file-io';
import { migrateBackup } from '../services/migrations';
import { parseBackup } from '../services/schema';
import { BackupInvalidError, BackupTooNewError, type BackupFile } from '../types';

const counts = (file: BackupFile) =>
  `${file.data.trucks.length} caminhão(ões), ${file.data.categories.length} categoria(s), ${file.data.transactions.length} transação(ões)`;

const confirmAsync = (title: string, message: string, confirmLabel: string) =>
  new Promise<boolean>((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });

export const ImportFlow = () => {
  const [busy, setBusy] = useState(false);
  const reloadTruck = useTruckStore((s) => s.hydrate);
  const reloadCategories = useCategoriesStore((s) => s.hydrate);
  const reloadTransactions = useTransactionsStore((s) => s.load);

  const onPress = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const json = await pickJsonFile();
      if (json === null) return;

      let file: BackupFile;
      try {
        const parsed = parseBackup(JSON.parse(json));
        file = migrateBackup(parsed);
      } catch (e) {
        if (e instanceof BackupTooNewError) {
          Alert.alert('Backup mais novo', 'Atualize o app antes de importar.');
          return;
        }
        if (e instanceof BackupInvalidError) {
          Alert.alert('Arquivo inválido', 'O arquivo selecionado não é um backup válido.');
          return;
        }
        throw e;
      }

      const ok1 = await confirmAsync(
        'Confirmar restauração',
        `Vai substituir TODOS os dados por: ${counts(file)}.\nEsta ação NÃO pode ser desfeita.`,
        'Continuar'
      );
      if (!ok1) return;

      const current = await buildBackup();
      const preUri = await writePreRestore(JSON.stringify(current, null, 2));
      await shareFile(preUri);

      const ok2 = await confirmAsync(
        'Aplicar restore',
        'Backup do estado atual salvo. Aplicar restore agora?',
        'Aplicar'
      );
      if (!ok2) return;

      await applyBackup(file);
      await Promise.all([reloadTruck(), reloadCategories(), reloadTransactions()]);
      Alert.alert('Sucesso', 'Dados restaurados.');
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha ao importar');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      className="bg-surface border border-border rounded-2xl py-4 px-4 items-center"
    >
      <Text className="text-white font-semibold">
        {busy ? 'Importando…' : 'Importar backup'}
      </Text>
    </Pressable>
  );
};
