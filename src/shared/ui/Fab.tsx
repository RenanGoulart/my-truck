import { Pressable, Text } from 'react-native';

type Props = { onPress: () => void; label?: string; accessibilityLabel?: string };

export function Fab({ onPress, label = '+', accessibilityLabel = 'Novo lançamento' }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      className="absolute right-5 bottom-6 w-16 h-16 rounded-full bg-primary items-center justify-center shadow-lg active:opacity-80"
    >
      <Text className="text-primary-fg text-3xl font-bold">{label}</Text>
    </Pressable>
  );
}
