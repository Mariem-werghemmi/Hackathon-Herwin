import { useEffect, useState, type PropsWithChildren } from 'react';
import { AccessibilityInfo, type ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

export function Entrance({ children, delay = 0, style }: PropsWithChildren<{ delay?: number; style?: ViewStyle }>) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion).catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => subscription.remove();
  }, []);

  return <Animated.View entering={reducedMotion ? FadeIn.duration(0) : FadeInDown.duration(420).delay(delay)} style={style}>{children}</Animated.View>;
}
