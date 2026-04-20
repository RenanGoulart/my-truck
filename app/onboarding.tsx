import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { useTruckStore } from '@/features/truck/store/truck.store';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Screen } from '@/shared/ui/Screen';

export default function Onboarding() {
  const createTruck = useTruckStore((s) => s.create);
  const [nickname, setNickname] = useState('');
  const [plate, setPlate] = useState('');
  const [odometer, setOdometer] = useState('');
  const [saving, setSaving] = useState(false);

  const canSave = nickname.trim().length > 0 && !saving;

  const handleSave = async () => {
    const km = Number(odometer.replace(',', '.'));
    if (odometer && Number.isNaN(km)) {
      Alert.alert('Odômetro inválido', 'Informe um número válido.');
      return;
    }
    setSaving(true);
    try {
      await createTruck({
        nickname: nickname.trim(),
        plate: plate.trim() || undefined,
        initialOdometer: Number.isFinite(km) ? km : 0,
      });
      router.replace('/(tabs)/dashboard');
    } catch (e) {
      Alert.alert('Erro', (e as Error).message);
    } finally {
      setSaving(false);
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
        <Input
          label="Apelido do caminhão"
          placeholder="Ex.: Scania Verde"
          value={nickname}
          onChangeText={setNickname}
          autoCapitalize="words"
          returnKeyType="next"
        />
        <Input
          label="Placa (opcional)"
          placeholder="AAA-0A00"
          value={plate}
          onChangeText={(t) => setPlate(t.toUpperCase())}
          autoCapitalize="characters"
          maxLength={8}
        />
        <Input
          label="Odômetro inicial (km)"
          placeholder="0"
          value={odometer}
          onChangeText={setOdometer}
          keyboardType="decimal-pad"
        />
      </View>

      <View className="mt-auto mb-4">
        <Button
          label="Salvar caminhão"
          onPress={handleSave}
          disabled={!canSave}
          loading={saving}
        />
      </View>
    </Screen>
  );
}
