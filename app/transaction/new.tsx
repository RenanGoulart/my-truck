import { router, Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { CategoryChips } from '@/features/categories/components/CategoryChips';
import { useCategoriesStore } from '@/features/categories/store/categories.store';
import { KindToggle } from '@/features/transactions/components/KindToggle';
import { useTransactionsStore } from '@/features/transactions/store/transactions.store';
import type { TransactionKind } from '@/features/transactions/types';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { MoneyInput } from '@/shared/ui/MoneyInput';
import { Screen } from '@/shared/ui/Screen';

export default function NewTransaction() {
  const categoriesByKind = useCategoriesStore((s) => s.byKind);
  const add = useTransactionsStore((s) => s.add);

  const [kind, setKind] = useState<TransactionKind>('expense');
  const [amountCents, setAmountCents] = useState(0);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [odometer, setOdometer] = useState('');
  const [liters, setLiters] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [saving, setSaving] = useState(false);

  const categories = useMemo(() => categoriesByKind(kind), [categoriesByKind, kind]);

  useEffect(() => {
    setCategoryId(null);
  }, [kind]);

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
      await add({
        categoryId: categoryId!,
        kind,
        amountCents,
        occurredAt: new Date(),
        description: description.trim() || undefined,
        odometer: odo,
        liters: lit,
        pricePerLiterCents: ppl !== undefined ? Math.round(ppl * 100) : undefined,
      });
      router.back();
    } catch (e) {
      Alert.alert('Erro', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Novo lançamento', presentation: 'modal' }} />
      <Screen>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 96, gap: 16 }}
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
            label="Descrição (opcional)"
            placeholder="Ex.: frete SP → BH"
            value={description}
            onChangeText={setDescription}
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
        </ScrollView>

        <View className="absolute bottom-4 left-5 right-5">
          <Button
            label="Salvar"
            onPress={handleSave}
            disabled={!canSave}
            loading={saving}
          />
        </View>
      </Screen>
    </>
  );
}
