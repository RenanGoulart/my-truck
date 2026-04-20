import { zodResolver } from '@hookform/resolvers/zod';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
import type { Transaction } from '@/features/transactions/types';
import {
  parseDecimal,
  transactionFormSchema,
  type TransactionFormValues,
} from '@/shared/lib/forms/schemas';
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

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      kind: 'expense',
      amountCents: 0,
      categoryId: '',
      description: '',
      odometer: '',
      liters: '',
      pricePerLiter: '',
    },
    mode: 'onTouched',
  });

  const kind = watch('kind');
  const categoryId = watch('categoryId');

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
      reset({
        kind: found.kind,
        amountCents: found.amountCents,
        categoryId: found.categoryId,
        description: found.description ?? '',
        odometer: found.odometer !== undefined ? String(found.odometer) : '',
        liters: found.liters !== undefined ? String(found.liters) : '',
        pricePerLiter:
          found.pricePerLiterCents !== undefined
            ? String(fromCents(found.pricePerLiterCents))
            : '',
      });
    })();
  }, [id, reset]);

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

  const onSubmit = async (values: TransactionFormValues) => {
    try {
      const ppl = parseDecimal(values.pricePerLiter);
      await update(tx.id, {
        kind: values.kind,
        amountCents: values.amountCents,
        categoryId: values.categoryId,
        description: values.description.trim() || undefined,
        odometer: isFuel ? parseDecimal(values.odometer) : undefined,
        liters: isFuel ? parseDecimal(values.liters) : undefined,
        pricePerLiterCents:
          isFuel && ppl !== undefined ? Math.round(ppl * 100) : undefined,
      });
      router.back();
    } catch (e) {
      Alert.alert('Erro', (e as Error).message);
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
            <Controller
              control={control}
              name="kind"
              render={({ field: { value, onChange } }) => (
                <KindToggle value={value} onChange={onChange} />
              )}
            />

            <Controller
              control={control}
              name="amountCents"
              render={({ field: { value, onChange } }) => (
                <View>
                  <MoneyInput
                    valueCents={value}
                    onChange={onChange}
                    label="Valor"
                    tint={kind === 'income' ? '#22C55E' : '#EF4444'}
                  />
                  {errors.amountCents ? (
                    <Text className="text-expense mt-1 text-xs">
                      {errors.amountCents.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />

            <Controller
              control={control}
              name="categoryId"
              render={({ field: { value, onChange } }) => (
                <View>
                  <Text className="text-muted mb-2 text-sm font-medium">Categoria</Text>
                  <CategoryChips
                    categories={categories}
                    selectedId={value || null}
                    onSelect={onChange}
                  />
                  {errors.categoryId ? (
                    <Text className="text-expense mt-1 text-xs">
                      {errors.categoryId.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Descrição"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Opcional"
                />
              )}
            />

            {isFuel ? (
              <View className="gap-4">
                <Controller
                  control={control}
                  name="liters"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <Input
                      label="Litros"
                      placeholder="0,00"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="decimal-pad"
                      error={errors.liters?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="pricePerLiter"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <Input
                      label="Preço por litro (R$)"
                      placeholder="0,00"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="decimal-pad"
                      error={errors.pricePerLiter?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="odometer"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <Input
                      label="Odômetro (km)"
                      placeholder="0"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="decimal-pad"
                      error={errors.odometer?.message}
                    />
                  )}
                />
              </View>
            ) : null}

            <View className="gap-3 mt-4">
              <Button
                label="Salvar alterações"
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                loading={isSubmitting}
              />
              <Button label="Excluir" variant="danger" onPress={handleDelete} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Screen>
    </>
  );
}
