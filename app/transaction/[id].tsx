import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';

import { CategoryChips } from '@/features/categories/components/CategoryChips';
import { useCategoriesStore } from '@/features/categories/store/categories.store';
import { KindToggle } from '@/features/transactions/components/KindToggle';
import { transactionsRepo } from '@/features/transactions/repository/transactions.repository';
import { useTransactionsStore } from '@/features/transactions/store/transactions.store';
import type { Transaction, TransactionKind } from '@/features/transactions/types';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { MoneyInput } from '@/shared/ui/MoneyInput';
import { Screen } from '@/shared/ui/Screen';

export default function EditTransaction() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const update = useTransactionsStore((s) => s.update);
  const remove = useTransactionsStore((s) => s.remove);
  const categoriesByKind = useCategoriesStore((s) => s.byKind);

  const [tx, setTx] = useState<Transaction | null>(null);
  const [kind, setKind] = useState<TransactionKind>('expense');
  const [amountCents, setAmountCents] = useState(0);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const found = await transactionsRepo.findById(id);
      if (!found) {
        Alert.alert('Não encontrado', 'Esta transação não existe mais.');
        router.back();
        return;
      }
      setTx(found);
      setKind(found.kind);
      setAmountCents(found.amountCents);
      setCategoryId(found.categoryId);
      setDescription(found.description ?? '');
    })();
  }, [id]);

  const categories = useMemo(() => categoriesByKind(kind), [categoriesByKind, kind]);

  if (!tx) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FFC107" />
        </View>
      </Screen>
    );
  }

  const canSave = amountCents > 0 && !!categoryId && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await update(tx.id, {
        kind,
        amountCents,
        categoryId: categoryId!,
        description: description.trim() || undefined,
      });
      router.back();
    } catch (e) {
      Alert.alert('Erro', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Excluir', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await remove(tx.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Editar lançamento' }} />
      <Screen>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 160, gap: 16 }}
        >
          <KindToggle value={kind} onChange={setKind} />
          <MoneyInput
            valueCents={amountCents}
            onChange={setAmountCents}
            label="Valor"
            tint={kind === 'income' ? '#22C55E' : '#EF4444'}
          />
          <View>
            <Text className="text-muted mb-2 text-sm font-medium">Categoria</Text>
            <CategoryChips
              categories={categories}
              selectedId={categoryId}
              onSelect={setCategoryId}
            />
          </View>
          <Input
            label="Descrição"
            value={description}
            onChangeText={setDescription}
            placeholder="Opcional"
          />
        </ScrollView>
        <View className="absolute bottom-4 left-5 right-5 gap-3">
          <Button label="Salvar alterações" onPress={handleSave} disabled={!canSave} loading={saving} />
          <Button label="Excluir" variant="danger" onPress={handleDelete} />
        </View>
      </Screen>
    </>
  );
}
