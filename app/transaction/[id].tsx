import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { CategoryChips } from '@/features/categories/components/CategoryChips';
import { useCategoriesStore } from '@/features/categories/store/categories.store';
import { KindToggle } from '@/features/transactions/components/KindToggle';
import { transactionsRepo } from '@/features/transactions/repository/transactions.repository';
import { useTransactionsStore } from '@/features/transactions/store/transactions.store';
import type { Transaction, TransactionKind } from '@/features/transactions/types';
import { fromCents } from '@/shared/lib/money';
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
  const [odometer, setOdometer] = useState('');
  const [liters, setLiters] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('');
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
      setOdometer(found.odometer !== undefined ? String(found.odometer) : '');
      setLiters(found.liters !== undefined ? String(found.liters) : '');
      setPricePerLiter(
        found.pricePerLiterCents !== undefined
          ? String(fromCents(found.pricePerLiterCents))
          : ''
      );
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

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const isFuel =
    kind === 'expense' && selectedCategory?.name.toLowerCase() === 'combustível';

  const canSave = amountCents > 0 && !!categoryId && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    const odo = odometer ? Number(odometer.replace(',', '.')) : undefined;
    const lit = liters ? Number(liters.replace(',', '.')) : undefined;
    const ppl = pricePerLiter ? Number(pricePerLiter.replace(',', '.')) : undefined;

    if ([odo, lit, ppl].some((n) => n !== undefined && Number.isNaN(n))) {
      Alert.alert('Número inválido', 'Revise os campos numéricos.');
      return;
    }

    setSaving(true);
    try {
      await update(tx.id, {
        kind,
        amountCents,
        categoryId: categoryId!,
        description: description.trim() || undefined,
        odometer: isFuel ? odo : undefined,
        liters: isFuel ? lit : undefined,
        pricePerLiterCents:
          isFuel && ppl !== undefined ? Math.round(ppl * 100) : undefined,
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
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 32, gap: 16 }}
            showsVerticalScrollIndicator={false}
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

            {isFuel ? (
              <View className="gap-4">
                <Input
                  label="Litros"
                  placeholder="0,00"
                  value={liters}
                  onChangeText={setLiters}
                  keyboardType="decimal-pad"
                />
                <Input
                  label="Preço por litro (R$)"
                  placeholder="0,00"
                  value={pricePerLiter}
                  onChangeText={setPricePerLiter}
                  keyboardType="decimal-pad"
                />
                <Input
                  label="Odômetro (km)"
                  placeholder="0"
                  value={odometer}
                  onChangeText={setOdometer}
                  keyboardType="decimal-pad"
                />
              </View>
            ) : null}

            <View className="gap-3 mt-4">
              <Button
                label="Salvar alterações"
                onPress={handleSave}
                disabled={!canSave}
                loading={saving}
              />
              <Button label="Excluir" variant="danger" onPress={handleDelete} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Screen>
    </>
  );
}
