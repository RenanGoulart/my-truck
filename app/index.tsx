import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getDb } from '@/db/client';

export default function Home() {
  const [categoriesCount, setCategoriesCount] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const db = await getDb();
      const row = await db.getFirstAsync<{ c: number }>(
        'SELECT COUNT(*) AS c FROM categories WHERE deleted_at IS NULL'
      );
      setCategoriesCount(row?.c ?? 0);
    })();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-primary text-3xl font-bold">My Truck</Text>
        <Text className="text-muted mt-2 text-center">
          Banco pronto. Categorias semeadas:{' '}
          <Text className="text-primary font-semibold">{categoriesCount ?? '…'}</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}
