import { ActivityIndicator, Pressable, Text } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
};

const base =
  'rounded-2xl h-14 items-center justify-center flex-row active:opacity-80';

const byVariant: Record<Variant, { bg: string; text: string }> = {
  primary: { bg: 'bg-primary', text: 'text-primary-fg' },
  secondary: { bg: 'bg-card', text: 'text-white' },
  ghost: { bg: 'bg-transparent border border-border', text: 'text-white' },
  danger: { bg: 'bg-expense', text: 'text-white' },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  className,
}: Props) {
  const v = byVariant[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      className={`${base} ${v.bg} ${disabled ? 'opacity-40' : ''} ${className ?? ''}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#0B0F14' : '#fff'} />
      ) : (
        <Text className={`${v.text} text-base font-semibold`}>{label}</Text>
      )}
    </Pressable>
  );
}
