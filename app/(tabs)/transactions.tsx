import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { TransactionListItem } from '@/features/transactions/components/TransactionListItem';
import { useTransactionsStore } from '@/features/transactions/store/transactions.store';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Fab } from '@/shared/ui/Fab';
import { Screen } from '@/shared/ui/Screen';
import { Skeleton } from '@/shared/ui/Skeleton';

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
        {isLoading && items.length === 0 ? (
          <View className="gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} height={64} rounded="lg" />
            ))}
          </View>
        ) : items.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <EmptyState
              icon="swap"
              title="Nenhuma transação neste mês"
              description="Toque em + para registrar o primeiro lançamento."
            />
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
