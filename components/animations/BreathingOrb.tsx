import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { colors } from '@/constants/theme';

export function BreathingOrb({ active }: { active: boolean }) {
  const scale = useSharedValue(0.88);
  useEffect(() => {
    cancelAnimation(scale);
    if (active) {
      scale.value = withRepeat(withSequence(withTiming(1.08, { duration: 4000 }), withTiming(0.88, { duration: 6000 })), -1, false);
    } else {
      scale.value = withTiming(0.88, { duration: 240 });
    }
    return () => cancelAnimation(scale);
  }, [active, scale]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <View style={styles.halo}><Animated.View style={[styles.orb, animatedStyle]}><View style={styles.center} /></Animated.View></View>;
}

const styles = StyleSheet.create({ halo: { width: 92, height: 92, borderRadius: 46, backgroundColor: '#EAE1F5', alignItems: 'center', justifyContent: 'center' }, orb: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.lavender, alignItems: 'center', justifyContent: 'center' }, center: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.white, opacity: 0.85 } });
