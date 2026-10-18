import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowRight, BookOpen, CalendarDays, Clock3, CloudLightning, CloudRain, CloudSun, Headphones, Heart, Leaf, MessageCircleHeart, Sparkles, Sun } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Entrance } from '@/components/animations/Entrance';
import { AppText, Button, Eyebrow, Panel, Screen, SectionHeader, Tag, TopBar } from '@/components/ui/Primitives';
import { demoEvents, demoMoods, moodOptions, recommendations } from '@/constants/mockData';
import { colors, radius } from '@/constants/theme';
import { useAppData } from '@/hooks/useAppData';
import type { Mood } from '@/types';

const moodIcons = { bright: Sun, steady: Leaf, mixed: CloudSun, tense: CloudLightning, heavy: CloudRain };

export default function HomeScreen() {
  const { preferences, moods, events, recordMood } = useAppData();
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const upcoming = [...events, ...demoEvents].sort((a, b) => a.date.localeCompare(b.date))[0];
  const firstName = preferences.pseudonym || 'belle âme';
  const recommendation = recommendations[0];

  useEffect(() => {
    if (moods.length) setSelectedMood(moods[0].mood);
  }, [moods]);

  return (
    <Screen contentStyle={styles.content}>
      <TopBar right={<Pressable accessibilityRole="button" accessibilityLabel="Ton parcours" onPress={() => router.push('/journey')} style={styles.avatar}><AppText style={styles.avatarText}>{firstName.slice(0, 1).toUpperCase()}</AppText></Pressable>} />
      <Entrance delay={20}><View style={styles.greeting}><AppText style={styles.hello}>Bonjour, belle âme ✨</AppText><AppText style={styles.subtitle}>Comment te sens-tu aujourd’hui, {firstName} ?</AppText></View></Entrance>

      <Entrance delay={80}><LinearGradient colors={['#EDE5F8', '#F7E9EF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.moodCard}>
        <View style={styles.cardDecor} />
        <Eyebrow>TON PETIT CHECK-IN</Eyebrow>
        <AppText style={styles.question}>Comment va{ '\n' }ton cœur aujourd’hui ?</AppText>
        <View style={styles.moodRow}>{moodOptions.map((mood) => {
          const Icon = moodIcons[mood.id];
          const active = selectedMood === mood.id;
          return <Pressable key={mood.id} accessibilityRole="button" accessibilityLabel={`Je me sens ${mood.label}`} accessibilityState={{ selected: active }} onPress={() => { Haptics.selectionAsync().catch(() => undefined); setSelectedMood(mood.id); recordMood(mood.id); }} style={[styles.moodOption, active && styles.moodActive]}>
            <View style={[styles.moodIcon, { backgroundColor: mood.tint }]}><Icon size={18} color={colors.ink} /></View>
            <AppText style={styles.moodLabel}>{mood.label}</AppText>
          </Pressable>;
        })}</View>
        {selectedMood ? <AppText style={styles.confirmed}>Merci de t’être écoutée. Ce moment t’appartient.</AppText> : null}
      </LinearGradient></Entrance>

      <Entrance delay={140}><Pressable onPress={() => router.push('/(tabs)/companion')} style={styles.companionCard}>
        <LinearGradient colors={[colors.violet, colors.plum]} style={styles.companionGradient}>
          <View style={styles.orb}><View style={styles.orbCore} /><Sparkles size={16} color={colors.white} style={styles.orbSparkle} /></View>
          <View style={styles.companionCopy}><Eyebrow>TON ESPACE SANS JUGEMENT</Eyebrow><AppText style={styles.companionTitle}>Tu peux tout déposer ici.</AppText><AppText style={styles.companionSub}>À ton rythme, sans avoir à tout expliquer.</AppText></View>
          <View style={styles.companionArrow}><ArrowRight size={18} color={colors.violet} /></View>
        </LinearGradient>
      </Pressable></Entrance>

      <Entrance delay={190}><Pressable accessibilityRole="button" onPress={() => router.push('/a7kili')} style={styles.a7kiliCard}>
        <View style={styles.a7kiliIcon}><Headphones size={19} color={colors.plum} /></View>
        <View style={styles.a7kiliCopy}><AppText style={styles.a7kiliEyebrow}>A7KILI · JE T’ÉCOUTE</AppText><AppText style={styles.a7kiliTitle}>Raconte-moi ce qui te pèse.</AppText><AppText style={styles.a7kiliSub}>Et trouve une musique ou un podcast pour ta pause.</AppText></View>
        <ArrowRight size={18} color={colors.plum} />
      </Pressable></Entrance>

      <Entrance delay={220}><Pressable accessibilityRole="button" onPress={() => router.push('/success')} style={styles.successCard}>
        <View style={styles.successIcon}><BookOpen size={19} color={colors.plum} /></View>
        <View style={styles.a7kiliCopy}><AppText style={styles.a7kiliEyebrow}>RÉUSSITE · AVEC GROQ</AppText><AppText style={styles.a7kiliTitle}>Avance dans tes études, à ton rythme.</AppText><AppText style={styles.a7kiliSub}>Plan d’étude, tuteur, quiz et motivation.</AppText></View>
        <ArrowRight size={18} color={colors.plum} />
      </Pressable></Entrance>

      <SectionHeader title="Une idée pour aujourd’hui" action="Tout voir" onPress={() => router.push('/action')} />
      <Panel style={styles.recommendCard}>
        <View style={styles.recommendIcon}><Sparkles size={19} color={colors.plum} /></View>
        <View style={styles.recommendBody}><AppText style={styles.recommendTitle}>{recommendation.title}</AppText><AppText style={styles.recommendCopy}>Avant de reprendre tes révisions, offre-toi une vraie pause.</AppText><View style={styles.duration}><Clock3 size={13} color={colors.muted} /><AppText style={styles.durationText}>{recommendation.duration}</AppText></View></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Découvrir l’exercice" onPress={() => router.push('/action')} style={styles.smallArrow}><ArrowRight size={17} color={colors.plum} /></Pressable>
      </Panel>

      <SectionHeader title="Un rendez-vous approche" action="Mon planning" onPress={() => router.push('/(tabs)/planning')} />
      <Pressable onPress={() => router.push('/(tabs)/planning')}>
        <Panel style={styles.eventCard}>
          <View style={styles.eventIcon}><CalendarDays size={19} color={colors.plum} /></View>
          <View style={{ flex: 1, gap: 3 }}><View style={styles.eventTitleRow}><AppText style={styles.eventTitle}>{upcoming?.title ?? 'Ajoute un rendez-vous'}</AppText><Tag tint={upcoming?.demo ? '#FFF0E7' : colors.paleLavender}>{upcoming?.demo ? 'Exemple' : 'À toi'}</Tag></View><AppText style={styles.eventDate}>{upcoming ? formatEvent(upcoming.date) : 'Ton planning est prêt.'}</AppText></View>
          <ArrowRight size={17} color={colors.muted} />
        </Panel>
      </Pressable>

      <SectionHeader title="Ton humeur, cette semaine" action="Mon parcours" onPress={() => router.push('/journey')} />
      <Panel style={styles.chartCard}>
        <View style={styles.chartHeading}><AppText style={styles.chartTitle}>Une semaine en douceur</AppText><Tag tint="#F6F2F9">Données démo</Tag></View>
        <View style={styles.chartBars}>{demoMoods.map((entry, index) => <View key={entry.id} style={styles.barColumn}><View style={[styles.bar, { height: [30, 42, 28, 54, 46, 35, 49][index], backgroundColor: moodOptions.find((item) => item.id === entry.mood)?.tint }]} /><AppText style={styles.dayLabel}>{['L', 'M', 'M', 'J', 'V', 'S', 'D'][index]}</AppText></View>)}</View>
        <AppText style={styles.demoNote}>Illustration uniquement. Tes ressentis ne sont pas comparés ni notés.</AppText>
      </Panel>

      <Pressable onPress={() => router.push('/circle')} style={styles.circlePreview}>
        <View style={styles.circleIcon}><Heart size={20} color={colors.plum} /></View>
        <View style={{ flex: 1 }}><AppText style={styles.circleTitle}>Tu n’es pas seule.</AppText><AppText style={styles.circleText}>Découvre des espaces entre étudiantes.</AppText></View>
        <MessageCircleHeart size={20} color={colors.plum} />
      </Pressable>
      <Button title="Explorer HerCircle" variant="text" icon={ArrowRight} onPress={() => router.push('/circle')} style={{ alignSelf: 'flex-end', minHeight: 35 }} />
      <View style={styles.bottomNote}><Heart size={13} color={colors.rose} /><AppText style={styles.bottomNoteText}>Un espace de soutien, pas un outil de diagnostic.</AppText></View>
    </Screen>
  );
}

function formatEvent(date: string) {
  const days = Math.max(0, Math.ceil((new Date(`${date}T12:00:00`).getTime() - new Date().setHours(12, 0, 0, 0)) / 86400000));
  return days === 0 ? 'Aujourd’hui' : `Dans ${days} jours · ${new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`;
}

const styles = StyleSheet.create({
  content: { paddingTop: 6, gap: 15 },
  greeting: { gap: 4, marginTop: 4 },
  hello: { fontFamily: 'Georgia', fontSize: 27, fontWeight: '600', color: colors.ink },
  subtitle: { color: colors.muted, fontSize: 14 },
  avatar: { width: 39, height: 39, borderRadius: 20, backgroundColor: colors.paleLavender, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '800', color: colors.plum },
  moodCard: { borderRadius: radius.lg, padding: 18, overflow: 'hidden', gap: 10 },
  cardDecor: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.24)', top: -60, right: -30 },
  question: { fontFamily: 'Georgia', fontSize: 24, lineHeight: 29, fontWeight: '600', color: colors.ink },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 3, marginTop: 2 },
  moodOption: { width: 55, alignItems: 'center', gap: 5, paddingVertical: 5, borderRadius: 15 },
  moodActive: { backgroundColor: 'rgba(255,255,255,0.72)' },
  moodIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  moodLabel: { fontSize: 9, color: colors.ink, fontWeight: '600' },
  confirmed: { fontSize: 11, color: colors.violet, marginTop: 1 },
  companionCard: { borderRadius: radius.lg, overflow: 'hidden' },
  companionGradient: { minHeight: 130, paddingHorizontal: 17, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 13 },
  orb: { width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  orbCore: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#D7C6F1', opacity: 0.95 },
  orbSparkle: { position: 'absolute', top: 6, right: 4 },
  companionCopy: { flex: 1, gap: 4 },
  companionCopyEyebrow: { color: '#E5D8F3' },
  companionTitle: { color: colors.white, fontFamily: 'Georgia', fontSize: 18, fontWeight: '600' },
  companionSub: { color: '#E8DFF0', fontSize: 11, lineHeight: 16 },
  companionArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  a7kiliCard: { minHeight: 78, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: radius.lg, borderWidth: 1, borderColor: '#F0DDE8', backgroundColor: '#FFFAFC' },
  a7kiliIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: '#F8E9F0' },
  a7kiliCopy: { flex: 1, gap: 2 },
  a7kiliEyebrow: { color: colors.plum, fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  a7kiliTitle: { fontSize: 13, fontWeight: '700' },
  a7kiliSub: { color: colors.muted, fontSize: 10, lineHeight: 14 },
  successCard: { minHeight: 78, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  successIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: colors.paleLavender },
  recommendCard: { flexDirection: 'row', alignItems: 'flex-start', padding: 15, gap: 12 },
  recommendIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.paleLavender, alignItems: 'center', justifyContent: 'center' },
  recommendBody: { flex: 1, gap: 4 },
  recommendTitle: { fontWeight: '700', fontSize: 14 },
  recommendCopy: { fontSize: 12, lineHeight: 17, color: colors.muted },
  duration: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  durationText: { color: colors.muted, fontSize: 10, fontWeight: '600' },
  smallArrow: { width: 31, height: 31, borderRadius: 16, backgroundColor: colors.paleLavender, alignItems: 'center', justifyContent: 'center' },
  eventCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 15 },
  eventIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#F8EAF0', alignItems: 'center', justifyContent: 'center' },
  eventTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  eventTitle: { fontSize: 13, fontWeight: '700' },
  eventDate: { color: colors.muted, fontSize: 11 },
  chartCard: { padding: 16, gap: 14 },
  chartHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  chartTitle: { fontSize: 14, fontWeight: '700' },
  chartBars: { height: 77, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' },
  barColumn: { alignItems: 'center', justifyContent: 'flex-end', gap: 6, flex: 1, height: '100%' },
  bar: { width: 18, borderRadius: 10 },
  dayLabel: { fontSize: 9, color: colors.muted },
  demoNote: { color: colors.muted, fontSize: 10, lineHeight: 15 },
  circlePreview: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: '#F8EAF0', borderRadius: radius.lg },
  circleIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  circleTitle: { fontWeight: '700', fontSize: 14 },
  circleText: { color: colors.muted, fontSize: 11, marginTop: 3 },
  bottomNote: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingTop: 3 },
  bottomNoteText: { fontSize: 10, color: colors.muted },
});
