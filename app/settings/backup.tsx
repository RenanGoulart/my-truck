import { Stack } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { BackupCard } from '@/features/backup/components/BackupCard';
import { ExportButton } from '@/features/backup/components/ExportButton';
import { ImportFlow } from '@/features/backup/components/ImportFlow';
import { Screen } from '@/shared/ui/Screen';

export default function BackupSettings() {
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <>
      <Stack.Screen options={{ title: 'Backup' }} />
      <Screen>
        <View className="mt-4 gap-4">
          <BackupCard reloadKey={reloadKey} />
          <ExportButton onExported={() => setReloadKey((k) => k + 1)} />
          <ImportFlow />
          <Text className="text-muted text-xs px-2">
            O arquivo gerado não é criptografado. Guarde em local seguro.
          </Text>
        </View>
      </Screen>
    </>
  );
}
