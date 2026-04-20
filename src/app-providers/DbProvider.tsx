import { type ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { getDb } from '@/db/client';

type Props = { children: ReactNode };

export function DbProvider({ children }: Props) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getDb()
      .then(() => setReady(true))
      .catch((e) => setError(e as Error));
  }, []);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-bg px-6">
        <Text className="text-expense text-lg font-semibold">Erro ao abrir o banco</Text>
        <Text className="text-muted mt-2 text-center">{error.message}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color="#FFC107" />
      </View>
    );
  }

  return <>{children}</>;
}
