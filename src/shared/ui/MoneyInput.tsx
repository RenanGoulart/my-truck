import { useRef } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { formatBRL } from '@/shared/lib/money';

type Props = {
  valueCents: number;
  onChange: (cents: number) => void;
  label?: string;
  tint?: string;
};

export function MoneyInput({ valueCents, onChange, label, tint }: Props) {
  const inputRef = useRef<TextInput>(null);

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 12);
    onChange(digits === '' ? 0 : parseInt(digits, 10));
  };

  const focus = () => inputRef.current?.focus();

  return (
    <View>
      {label ? <Text className="text-muted mb-2 text-sm font-medium">{label}</Text> : null}
      <Pressable onPress={focus}>
        <View className="bg-card border border-border rounded-2xl px-4 py-3">
          <TextInput
            ref={inputRef}
            keyboardType="number-pad"
            value={valueCents === 0 ? '' : String(valueCents)}
            onChangeText={handleChange}
            caretHidden
            style={{ position: 'absolute', opacity: 0, height: 0, width: 0 }}
          />
          <Text
            className="text-4xl font-bold"
            style={{ color: tint ?? '#FFFFFF' }}
          >
            {formatBRL(valueCents)}
          </Text>
        </View>
      </Pressable>
      <Text className="text-muted mt-2 text-xs">Toque para digitar</Text>
    </View>
  );
}
