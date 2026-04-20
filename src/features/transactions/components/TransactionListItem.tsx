import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useCategoriesStore } from '@/features/categories/store/categories.store';
import { formatBRL } from '@/shared/lib/money';

import type { Transaction } from '../types';

type Props = { tx: Transaction };

export function TransactionListItem({ tx }: Props) {
  const category = useCategoriesStore((s) => s.findById(tx.categoryId));
  const isIncome = tx.kind === 'income';
  const sign = isIncome ? '+' : '−';
  const color = isIncome ? '#22C55E' : '#EF4444';

  return (
    <Pressable
      onPress={() => router.push(`/transaction/${tx.id}`)}
      className="flex-row items-center bg-surface border border-border rounded-2xl px-4 py-3"
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{ backgroundColor: (category?.color ?? '#334155') + '33' }}
      >
        <Text className="text-base font-bold" style={{ color: category?.color ?? '#94A3B8' }}>
          {(category?.name ?? '?').slice(0, 1)}
        </Text>
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-white text-base font-semibold">
          {category?.name ?? 'Sem categoria'}
        </Text>
        {tx.description ? (
          <Text className="text-muted text-xs mt-0.5" numberOfLines={1}>
            {tx.description}
          </Text>
        ) : null}
        <Text className="text-muted text-xs mt-0.5">
          {tx.occurredAt.toLocaleDateString('pt-BR')}
        </Text>
      </View>
      <Text className="text-base font-bold" style={{ color }}>
        {sign} {formatBRL(tx.amountCents)}
      </Text>
    </Pressable>
  );
}
