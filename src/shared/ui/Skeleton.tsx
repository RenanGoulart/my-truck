import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

type Props = {
  height?: number;
  width?: number | `${number}%`;
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
};

const radius: Record<NonNullable<Props['rounded']>, string> = {
  sm: 'rounded-md',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  full: 'rounded-full',
};

export function Skeleton({ height = 16, width = '100%', className, rounded = 'md' }: Props) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{ height, width, opacity }}
      className={`bg-surface ${radius[rounded]} ${className ?? ''}`}
    />
  );
}
