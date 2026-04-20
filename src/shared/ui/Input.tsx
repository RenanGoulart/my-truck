import { forwardRef } from 'react';
import { Text, TextInput, type TextInputProps, View } from 'react-native';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  containerClassName?: string;
};

export const Input = forwardRef<TextInput, Props>(function Input(
  { label, error, containerClassName, className, ...rest },
  ref
) {
  return (
    <View className={containerClassName}>
      {label ? (
        <Text className="text-muted mb-2 text-sm font-medium">{label}</Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor="#64748B"
        className={`bg-card text-white rounded-xl px-4 h-14 text-base border ${
          error ? 'border-expense' : 'border-border'
        } ${className ?? ''}`}
        {...rest}
      />
      {error ? (
        <Text className="text-expense mt-1 text-xs">{error}</Text>
      ) : null}
    </View>
  );
});
