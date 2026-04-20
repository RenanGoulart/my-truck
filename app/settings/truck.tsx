import { zodResolver } from '@hookform/resolvers/zod';
import { router, Stack } from 'expo-router';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
} from 'react-native';

import { useTruckStore } from '@/features/truck/store/truck.store';
import {
  parseDecimal,
  truckFormSchema,
  type TruckFormValues,
} from '@/shared/lib/forms/schemas';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Screen } from '@/shared/ui/Screen';

export default function EditTruck() {
  const truck = useTruckStore((s) => s.truck);
  const update = useTruckStore((s) => s.update);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TruckFormValues>({
    resolver: zodResolver(truckFormSchema),
    defaultValues: { nickname: '', plate: '', odometer: '' },
    mode: 'onTouched',
  });

  useEffect(() => {
    if (truck) {
      reset({
        nickname: truck.nickname,
        plate: truck.plate ?? '',
        odometer: String(truck.initialOdometer),
      });
    }
  }, [truck, reset]);

  const onSubmit = async (values: TruckFormValues) => {
    try {
      const km = parseDecimal(values.odometer);
      await update({
        nickname: values.nickname.trim(),
        plate: values.plate.trim() || undefined,
        initialOdometer: km ?? 0,
      });
      router.back();
    } catch (e) {
      Alert.alert('Erro', (e as Error).message);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Caminhão' }} />
      <Screen>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 32, gap: 16 }}
            showsVerticalScrollIndicator={false}
          >
            <Text className="text-muted text-sm">
              O odômetro inicial é usado como referência para calcular a
              quilometragem rodada quando não houver abastecimentos anteriores.
            </Text>

            <Controller
              control={control}
              name="nickname"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Apelido"
                  placeholder="Ex.: Scania Verde"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="words"
                  error={errors.nickname?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="plate"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Placa (opcional)"
                  placeholder="AAA-0A00"
                  value={value}
                  onChangeText={(t) => onChange(t.toUpperCase())}
                  onBlur={onBlur}
                  autoCapitalize="characters"
                  maxLength={8}
                  error={errors.plate?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="odometer"
              render={({ field: { value, onChange, onBlur } }) => (
                <Input
                  label="Odômetro inicial (km)"
                  placeholder="0"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                  error={errors.odometer?.message}
                />
              )}
            />

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
