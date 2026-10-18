import { LinearGradient } from 'expo-linear-gradient';
import { router, useRouter } from 'expo-router';
import { ArrowRight, Flower2, ShieldCheck, Sparkles } from 'lucide-react-native';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { AppText, BloomMark, Button, Screen, TopBar } from '@/components/ui/Primitives';
import { colors, radius, spacing } from '@/constants/theme';
import { useAppData } from '@/hooks/useAppData';

export default function WelcomeScreen() {
  const { preferences, hydrated } = useAppData();
  const move = useSharedValue(0);
  const scale = useSharedValue(0.94);
  const localRouter = useRouter();

  useEffect(() => {
    move.value = withRepeat(withTiming(1, { duration: 3400 }), -1, true);
    scale.value = withTiming(1, { duration: 700 });
  }, [move, scale]);
  useEffect(() => {
    if (hydrated && preferences.onboardingComplete) localRouter.replace('/(tabs)/home');
  }, [hydrated, preferences.onboardingComplete, localRouter]);

  const floatOne = useAnimatedStyle(() => ({ transform: [{ translateY: move.value * -10 }, { rotate: `${move.value * 8 - 4}deg` }] }));
  const floatTwo = useAnimatedStyle(() => ({ transform: [{ translateY: move.value * 12 }, { rotate: `${move.value * -7 + 3}deg` }] }));
  const bloomStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Screen contentStyle={styles.content}>
      <TopBar />
      <View style={styles.artArea}>
        <Animated.View style={[styles.orbit, styles.orbitLeft, floatOne]} />
        <Animated.View style={[styles.orbit, styles.orbitRight, floatTwo]} />
        <LinearGradient colors={['#F0EAFB', '#F8E7EF', '#FFF9F3']} style={styles.artCircle}>
          <View style={styles.innerGlow} />
          <Animated.View style={bloomStyle}><BloomMark size={144} /></Animated.View>
          <View style={styles.sparkleOne}><Sparkles size={19} color={colors.plum} /></View>
          <View style={styles.sparkleTwo}><Flower2 size={17} color="#B37DA2" /></View>
        </LinearGradient>
        <View style={styles.floatBadge}><ShieldCheck size={14} color={colors.plum} /><AppText style={styles.badgeText}>Ton espace, à toi</AppText></View>
      </View>
      <View style={styles.copy}>
        <AppText style={styles.title}>Feel understood.{ '\n' }<AppText style={styles.titleAccent}>Find your circle.</AppText>{ '\n' }Grow together.</AppText>
        <AppText style={styles.body}>Un compagnon bienveillant pour les hauts, les bas et tout ce qu’il y a entre les deux.</AppText>
      </View>
      <View style={styles.actions}>
        <Button title="Commencer" icon={ArrowRight} onPress={() => router.push('/onboarding')} />
        <Pressable accessibilityRole="button" onPress={() => router.replace('/(tabs)/home')} style={styles.secondary}>
          <AppText style={styles.secondaryText}>J’ai déjà un compte</AppText>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingTop: 8, paddingBottom: 24, gap: 0 },
  artArea: { height: 302, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  artCircle: { width: 258, height: 258, borderRadius: 129, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  innerGlow: { position: 'absolute', width: 194, height: 194, borderRadius: 97, backgroundColor: 'rgba(255,255,255,0.52)' },
  orbit: { position: 'absolute', borderRadius: radius.pill },
  orbitLeft: { left: 18, top: 52, width: 64, height: 64, backgroundColor: colors.blush, opacity: 0.8 },
  orbitRight: { right: 12, bottom: 48, width: 82, height: 82, backgroundColor: '#DED1F1', opacity: 0.84 },
  sparkleOne: { position: 'absolute', top: 45, right: 57 },
  sparkleTwo: { position: 'absolute', bottom: 54, left: 45 },
  floatBadge: { position: 'absolute', bottom: 11, backgroundColor: colors.white, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 7, shadowColor: colors.violet, shadowOpacity: 0.12, shadowRadius: 12, elevation: 2 },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.violet },
  copy: { alignItems: 'center', marginTop: 16, gap: 12 },
  title: { textAlign: 'center', fontFamily: 'Georgia', color: colors.ink, fontSize: 32, lineHeight: 39, fontWeight: '600' },
  titleAccent: { color: colors.plum, fontStyle: 'italic' },
  body: { color: colors.muted, textAlign: 'center', fontSize: 14, lineHeight: 21, maxWidth: 290 },
  actions: { marginTop: 'auto', paddingTop: spacing.xl, gap: 9 },
  secondary: { minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  secondaryText: { color: colors.plum, fontWeight: '700', fontSize: 13 },
});
