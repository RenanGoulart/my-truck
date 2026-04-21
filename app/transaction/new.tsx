import { zodResolver } from '@hookform/resolvers/zod';
import { router, Stack } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryChips } from '@/features/categories/components/CategoryChips';
import { useCategoriesStore } from '@/features/categories/store/categories.store';
import { KindToggle } from '@/features/transactions/components/KindToggle';
import { useTransactionsStore } from '@/features/transactions/store/transactions.store';
import {
  parseDecimal,
  transactionFormSchema,
  type TransactionFormValues,
} from '@/shared/lib/forms/schemas';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { MoneyInput } from '@/shared/ui/MoneyInput';
import { Screen } from '@/shared/ui/Screen';

export default function NewTransaction() {
  const categoriesByKind = useCategoriesStore((s) => s.byKind);
  const add = useTransactionsStore((s) => s.add);
  const insets = useSafeAreaInsets();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
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

  const categories = useMemo(() => categoriesByKind(kind), [categoriesByKind, kind]);

  useEffect(() => {
    setValue('categoryId', '');
  }, [kind, setValue]);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const isFuel =
    kind === 'expense' && selectedCategory?.name.toLowerCase() === 'combustível';

  const onSubmit = async (values: TransactionFormValues) => {
    try {
      const ppl = parseDecimal(values.pricePerLiter);
      await add({
        categoryId: values.categoryId,
        kind: values.kind,
        amountCents: values.amountCents,
        occurredAt: new Date(),
        description: values.description.trim() || undefined,
        odometer: parseDecimal(values.odometer),
        liters: parseDecimal(values.liters),
        pricePerLiterCents: ppl !== undefined ? Math.round(ppl * 100) : undefined,
      });
      router.back();
    } catch (e) {
      Alert.alert('Erro', (e as Error).message);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Novo lançamento', presentation: 'modal' }} />
      <Screen>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            contentContainerStyle={{
              paddingTop: 16,
              paddingBottom: 32 + insets.bottom,
              gap: 16,
            }}
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
                  label="Descrição (opcional)"
                  placeholder="Ex.: frete SP → BH"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
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

            <Button
              label="Salvar"
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              loading={isSubmitting}
              className="mt-4"
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Screen>
    </>
  );
}
