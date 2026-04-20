import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { useTruckStore } from '@/features/truck/store/truck.store';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Screen } from '@/shared/ui/Screen';

export default function EditTruck() {
  const truck = useTruckStore((s) => s.truck);
  const update = useTruckStore((s) => s.update);

  const [nickname, setNickname] = useState('');
  const [plate, setPlate] = useState('');
  const [odometer, setOdometer] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (truck) {
      setNickname(truck.nickname);
      setPlate(truck.plate ?? '');
      setOdometer(String(truck.initialOdometer));
    }
  }, [truck]);

  const canSave = nickname.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    const km = Number(odometer.replace(',', '.'));
    if (odometer && Number.isNaN(km)) {
      Alert.alert('Odômetro inválido', 'Informe um número válido.');
      return;
    }
    setSaving(true);
    try {
      await update({
        nickname: nickname.trim(),
        plate: plate.trim() || undefined,
        initialOdometer: Number.isFinite(km) ? km : 0,
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

            <Input
              label="Apelido"
              placeholder="Ex.: Scania Verde"
              value={nickname}
              onChangeText={setNickname}
              autoCapitalize="words"
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

            <Button
              label="Salvar"
              onPress={handleSave}
              disabled={!canSave}
              loading={saving}
              className="mt-4"
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Screen>
    </>
  );
}
