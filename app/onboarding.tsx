import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Text, View } from 'react-native';

import { useTruckStore } from '@/features/truck/store/truck.store';
import {
  parseDecimal,
  truckFormSchema,
  type TruckFormValues,
} from '@/shared/lib/forms/schemas';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Screen } from '@/shared/ui/Screen';

export default function Onboarding() {
  const createTruck = useTruckStore((s) => s.create);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TruckFormValues>({
    resolver: zodResolver(truckFormSchema),
    defaultValues: { nickname: '', plate: '', odometer: '' },
    mode: 'onTouched',
  });

  const onSubmit = async (values: TruckFormValues) => {
    try {
      const km = parseDecimal(values.odometer);
      await createTruck({
        nickname: values.nickname.trim(),
        plate: values.plate.trim() || undefined,
        initialOdometer: km ?? 0,
      });
      router.replace('/(tabs)/dashboard');
    } catch (e) {
      Alert.alert('Erro', (e as Error).message);
    }
  };

  return (
    <Screen>
      <View className="mt-10">
        <Text className="text-primary text-3xl font-bold">Bem-vindo</Text>
        <Text className="text-muted mt-2 text-base">
          Vamos cadastrar seu caminhão para começar a controlar suas finanças.
        </Text>
      </View>

      <View className="mt-8 gap-4">
        <Controller
          control={control}
          name="nickname"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              label="Apelido do caminhão"
              placeholder="Ex.: Scania Verde"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="words"
              returnKeyType="next"
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
      </View>

      <View className="mt-auto mb-4">
        <Button
          label="Salvar caminhão"
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          loading={isSubmitting}
        />
      </View>
    </Screen>
  );
}
