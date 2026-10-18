import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { colors } from '@/constants/theme';

export function TypingIndicator() {
  return <View accessibilityLabel="HERmind écrit" accessibilityRole="text" style={styles.row}>{[0, 1, 2].map((index) => <TypingDot key={index} delay={index * 150} />)}</View>;
}

function TypingDot({ delay }: { delay: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      progress.value = withRepeat(withSequence(withTiming(1, { duration: 260 }), withTiming(0, { duration: 260 })), -1, false);
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay, progress]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: 0.35 + progress.value * 0.65, transform: [{ translateY: progress.value * -3 }] }));
  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 20 }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.plum } });
