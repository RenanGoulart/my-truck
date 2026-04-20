import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { TransactionListItem } from '@/features/transactions/components/TransactionListItem';
import { useTransactionsStore } from '@/features/transactions/store/transactions.store';
import { Fab } from '@/shared/ui/Fab';
import { Screen } from '@/shared/ui/Screen';

export default function Transactions() {
  const items = useTransactionsStore((s) => s.items);
  const isLoading = useTransactionsStore((s) => s.isLoading);
  const load = useTransactionsStore((s) => s.load);
  const truckId = useTransactionsStore((s) => s.truckId);

  useEffect(() => {
    if (truckId) void load();
  }, [truckId, load]);

  return (
    <Screen padded={false}>
      <View className="flex-1 px-5 pt-4">
        {items.length === 0 && !isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted text-center">
              Nenhuma transação neste mês.{'\n'}Toque em + para criar.
            </Text>
          </View>
        ) : (
          <FlashList
            data={items}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => <TransactionListItem tx={item} />}
            ItemSeparatorComponent={() => <View className="h-2" />}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}
      </View>
      <Fab onPress={() => router.push('/transaction/new')} />
    </Screen>
  );
}
