import { type ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  children: ReactNode;
  className?: string;
  padded?: boolean;
};

export function Screen({ children, className, padded = true }: Props) {
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top', 'bottom']}>
      <View className={`flex-1 ${padded ? 'px-5' : ''} ${className ?? ''}`}>
        {children}
      </View>
    </SafeAreaView>
  );
}
