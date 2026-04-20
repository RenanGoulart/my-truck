import { type ReactNode } from 'react';
import { View } from 'react-native';

type Props = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: Props) {
  return (
    <View
      className={`bg-surface rounded-2xl p-4 border border-border ${className ?? ''}`}
    >
      {children}
    </View>
  );
}
