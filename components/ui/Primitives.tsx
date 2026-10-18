import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, type LucideIcon } from 'lucide-react-native';
import React, { type PropsWithChildren } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewProps, type TextProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, shadow, spacing } from '@/constants/theme';

export function AppText({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.text, style]} />;
}

export function Screen({ children, scroll = true, contentStyle, ...scrollProps }: PropsWithChildren<{ scroll?: boolean; contentStyle?: ViewStyle } & ScrollViewProps>) {
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      {scroll ? (
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, contentStyle]} {...scrollProps}>
          {children}
        </ScrollView>
      ) : <View style={[styles.content, { flex: 1 }, contentStyle]}>{children}</View>}
    </SafeAreaView>
  );
}

export function TopBar({ title, back = false, right }: { title?: string; back?: boolean; right?: React.ReactNode }) {
  const router = useRouter();
  return (
    <View style={styles.topbar}>
      <View style={styles.topbarSide}>
        {back ? <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => router.back()} style={styles.iconButton}><ArrowLeft size={20} color={colors.ink} /></Pressable> : null}
      </View>
      {title ? <AppText style={styles.topbarTitle}>{title}</AppText> : <AppText style={styles.wordmark}>HERmind <AppText style={{ color: colors.plum }}>AI</AppText></AppText>}
      <View style={[styles.topbarSide, { alignItems: 'flex-end' }]}>{right}</View>
    </View>
  );
}

export function Eyebrow({ children }: PropsWithChildren) {
  return <AppText style={styles.eyebrow}>{children}</AppText>;
}

export function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  return <View style={{ gap: 5 }}><AppText style={styles.heading}>{title}</AppText>{subtitle ? <AppText style={styles.subtitle}>{subtitle}</AppText> : null}</View>;
}

export function Panel({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function Button({ title, onPress, icon: Icon, variant = 'primary', disabled = false, style }: { title: string; onPress: () => void; icon?: LucideIcon; variant?: 'primary' | 'light' | 'text' | 'outline'; disabled?: boolean; style?: ViewStyle }) {
  const content = (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        Haptics.selectionAsync().catch(() => undefined);
        onPress();
      }}
      style={({ pressed }) => [styles.button, variant === 'light' && styles.buttonLight, variant === 'outline' && styles.buttonOutline, variant === 'text' && styles.buttonText, disabled && { opacity: 0.48 }, pressed && !disabled && { transform: [{ scale: 0.985 }] }, style]}
    >
      {Icon ? <Icon size={17} color={variant === 'primary' ? colors.white : colors.plum} /> : null}
      <AppText style={[styles.buttonLabel, variant !== 'primary' && { color: colors.plum }]}>{title}</AppText>
    </Pressable>
  );
  if (variant === 'primary') {
    return <LinearGradient colors={[colors.plum, colors.violet]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.gradientButton, style]}>{content}</LinearGradient>;
  }
  return content;
}

export function RoundIcon({ icon: Icon, onPress, label, tint = colors.paleLavender }: { icon: LucideIcon; onPress: () => void; label: string; tint?: string }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.iconButton, { backgroundColor: tint }]}><Icon size={18} color={colors.plum} /></Pressable>;
}

export function SectionHeader({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return <View style={styles.sectionHeader}><AppText style={styles.sectionTitle}>{title}</AppText>{action && onPress ? <Pressable accessibilityRole="button" onPress={onPress} style={styles.inlineAction}><AppText style={styles.inlineText}>{action}</AppText><ChevronRight size={15} color={colors.plum} /></Pressable> : null}</View>;
}

export function Tag({ children, tint = colors.paleLavender, textColor = colors.plum }: PropsWithChildren<{ tint?: string; textColor?: string }>) {
  return <View style={[styles.tag, { backgroundColor: tint }]}><AppText style={[styles.tagText, { color: textColor }]}>{children}</AppText></View>;
}

export function BloomMark({ size = 60 }: { size?: number }) {
  const petal = size * 0.38;
  return (
    <View accessibilityLabel="Symbole fleur HERmind" style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {[0, 60, 120, 180, 240, 300].map((rotation) => <View key={rotation} style={{ position: 'absolute', width: petal, height: petal * 0.7, borderRadius: petal, backgroundColor: rotation % 120 === 0 ? colors.rose : colors.lavender, transform: [{ rotate: `${rotation}deg` }, { translateY: -size * 0.18 }] }} />)}
      <View style={{ width: size * 0.2, height: size * 0.2, borderRadius: radius.pill, backgroundColor: colors.cream }} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: 34, gap: spacing.lg },
  text: { color: colors.ink, fontSize: 15, lineHeight: 22 },
  topbar: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topbarSide: { width: 54, minHeight: 40, justifyContent: 'center' },
  topbarTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  wordmark: { fontSize: 18, fontWeight: '800', color: colors.violet, letterSpacing: 0 },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: colors.plum, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  heading: { fontFamily: 'Georgia', fontSize: 29, lineHeight: 35, color: colors.ink, fontWeight: '600' },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  panel: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: spacing.lg, ...shadow.card },
  gradientButton: { borderRadius: radius.pill, overflow: 'hidden' },
  button: { minHeight: 50, paddingHorizontal: 22, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  buttonLight: { backgroundColor: colors.white },
  buttonOutline: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  buttonText: { backgroundColor: 'transparent', paddingHorizontal: 8 },
  buttonLabel: { color: colors.white, fontSize: 14, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.ink },
  inlineAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  inlineText: { color: colors.plum, fontSize: 12, fontWeight: '700' },
  tag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  tagText: { fontSize: 11, lineHeight: 15, fontWeight: '700' },
});
