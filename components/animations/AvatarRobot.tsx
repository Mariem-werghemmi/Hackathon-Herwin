import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { colors } from '@/constants/theme';

export function AvatarRobot({ talking, reacting }: { talking: boolean; reacting: boolean }) {
  const bob = useSharedValue(0);
  const mouth = useSharedValue(5);

  useEffect(() => {
    bob.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: reacting ? 520 : 1500 }),
        withTiming(0, { duration: reacting ? 520 : 1500 }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(bob);
  }, [bob, reacting]);

  useEffect(() => {
    cancelAnimation(mouth);
    mouth.value = talking
      ? withRepeat(
        withSequence(
          withTiming(14, { duration: 170 }),
          withTiming(5, { duration: 140 }),
          withTiming(10, { duration: 160 }),
          withTiming(5, { duration: 130 }),
        ),
        -1,
        false,
      )
      : withTiming(5, { duration: 160 });
    return () => cancelAnimation(mouth);
  }, [mouth, talking]);

  const bobStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));
  const mouthStyle = useAnimatedStyle(() => ({ height: mouth.value }));

  return (
    <View style={styles.scene} accessibilityLabel="Robot HERmind animé" accessibilityRole="image">
      <View style={[styles.aura, reacting && styles.auraActive]} />
      <Animated.View style={[styles.robot, bobStyle]}>
        <View style={styles.antenna}><View style={styles.antennaLight} /></View>
        <View style={styles.head}>
          <View style={styles.sidePanel} />
          <View style={styles.face}>
            <View style={styles.eyes}>
              <View style={styles.eye}><View style={styles.eyeShine} /></View>
              <View style={styles.eye}><View style={styles.eyeShine} /></View>
            </View>
            <Animated.View style={[styles.mouth, mouthStyle]} />
          </View>
          <View style={styles.sidePanel} />
        </View>
        <View style={styles.neck} />
        <View style={styles.body}>
          <View style={styles.chestLight} />
          <View style={styles.bodyDot} />
        </View>
        <View style={styles.armLeft} />
        <View style={styles.armRight} />
        <View style={styles.shadow} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  scene: { width: 230, height: 218, alignItems: 'center', justifyContent: 'center' },
  aura: { position: 'absolute', width: 196, height: 196, borderRadius: 98, backgroundColor: 'rgba(255,255,255,0.38)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.66)' },
  auraActive: { backgroundColor: 'rgba(255,255,255,0.54)', borderColor: 'rgba(255,255,255,0.9)' },
  robot: { width: 174, height: 190, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 14 },
  antenna: { position: 'absolute', top: 0, width: 5, height: 23, alignItems: 'center', backgroundColor: '#8F78BB', borderRadius: 4 },
  antennaLight: { position: 'absolute', top: -6, width: 13, height: 13, borderRadius: 7, backgroundColor: '#F5B5C9', borderWidth: 2, borderColor: colors.white },
  head: { zIndex: 1, width: 148, height: 112, marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderWidth: 4, borderColor: colors.white, borderRadius: 36, backgroundColor: '#DCCCF3', shadowColor: '#776398', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 4 },
  sidePanel: { width: 9, height: 27, borderRadius: 5, backgroundColor: '#A995CE' },
  face: { width: 105, height: 76, alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 26, backgroundColor: '#FFFDFE' },
  eyes: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  eye: { width: 12, height: 15, alignItems: 'flex-end', borderRadius: 8, backgroundColor: '#514169' },
  eyeShine: { width: 4, height: 4, margin: 3, borderRadius: 2, backgroundColor: colors.white },
  mouth: { width: 19, minHeight: 5, borderRadius: 9, backgroundColor: '#D988A4' },
  neck: { zIndex: 1, width: 30, height: 9, marginTop: -2, backgroundColor: '#A995CE' },
  body: { width: 100, height: 53, alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 3, borderColor: colors.white, borderRadius: 24, backgroundColor: '#BBA8DF' },
  chestLight: { width: 21, height: 21, borderRadius: 11, borderWidth: 3, borderColor: '#FDFBFF', backgroundColor: '#F5B5C9' },
  bodyDot: { width: 20, height: 3, borderRadius: 2, backgroundColor: '#8F78BB' },
  armLeft: { position: 'absolute', left: 12, bottom: 32, width: 20, height: 42, borderRadius: 12, backgroundColor: '#BBA8DF', transform: [{ rotate: '18deg' }] },
  armRight: { position: 'absolute', right: 12, bottom: 32, width: 20, height: 42, borderRadius: 12, backgroundColor: '#BBA8DF', transform: [{ rotate: '-18deg' }] },
  shadow: { position: 'absolute', bottom: 4, width: 112, height: 12, borderRadius: 10, backgroundColor: 'rgba(86,66,116,0.12)' },
});
