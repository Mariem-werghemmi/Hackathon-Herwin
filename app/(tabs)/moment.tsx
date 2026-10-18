import { LinearGradient } from 'expo-linear-gradient';
import { Check, Mic, RotateCcw, Send, ShieldCheck, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, Eyebrow, Panel, Screen, Tag, TopBar } from '@/components/ui/Primitives';
import { colors, radius, spacing } from '@/constants/theme';
import { useAppData } from '@/hooks/useAppData';
import type { Mood } from '@/types';

const prompts = ['Je me sens dépassée par mes études.', 'J’ai peur de ma soutenance.', 'J’ai besoin de parler à quelqu’un.', 'Je ne sais pas exactement ce que je ressens.'];
const emotions: { label: string; mood: Mood }[] = [
  { label: 'Stress', mood: 'tense' }, { label: 'Peur', mood: 'tense' }, { label: 'Tristesse', mood: 'heavy' },
  { label: 'Fatigue', mood: 'heavy' }, { label: 'Soulagement', mood: 'steady' }, { label: 'Autre', mood: 'mixed' },
];

export default function MomentScreen() {
  const { preferences, addJournal, recordMood } = useAppData();
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState<{ emotion: string; mood: Mood; topic: string; summary: string } | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [showEmotionChoices, setShowEmotionChoices] = useState(false);
  const [intensity, setIntensity] = useState(3);
  const [voice, setVoice] = useState(false);

  const submit = () => {
    if (!text.trim()) return;
    const lower = text.toLowerCase();
    const emotion = lower.includes('peur') || lower.includes('soutenance') ? 'peur' : lower.includes('fatigu') ? 'fatigue' : lower.includes('stress') || lower.includes('dépass') ? 'stress' : 'émotion mélangée';
    const topic = lower.includes('pfe') || lower.includes('soutenance') ? 'PFE et soutenance' : lower.includes('examen') || lower.includes('étude') || lower.includes('révision') ? 'Études' : 'Ce que tu traverses';
    setAnalysis({ emotion, mood: emotion === 'fatigue' ? 'heavy' : emotion === 'émotion mélangée' ? 'mixed' : 'tense', topic, summary: `Tu évoques surtout ${topic.toLowerCase()} et ce que cela te fait vivre.` });
    setConfirmed(false);
    setShowEmotionChoices(false);
    setIntensity(3);
  };
  const confirm = (mood: Mood) => {
    addJournal(text.trim(), mood, intensity);
    recordMood(mood);
    setConfirmed(true);
    setShowEmotionChoices(false);
  };

  return (
    <Screen contentStyle={styles.content}>
      <TopBar title="Ton moment à toi" />
      <View style={styles.heading}><AppText style={styles.title}>Qu’est-ce qui prend{ '\n' }de la place dans ta tête ?</AppText><AppText style={styles.subtitle}>Tu peux écrire beaucoup, ou juste quelques mots.</AppText></View>
      <View style={styles.composer}>
        <TextInput value={text} onChangeText={(value) => { setText(value); setAnalysis(null); setConfirmed(false); setShowEmotionChoices(false); }} multiline maxLength={1200} textAlignVertical="top" placeholder="Je me sens…" placeholderTextColor="#A49AAA" style={[styles.input, preferences.language === 'العربية' && { textAlign: 'right', writingDirection: 'rtl' }]} accessibilityLabel="Écris ce que tu ressens" />
        <View style={styles.composerFooter}><AppText style={styles.charCount}>{text.length}/1200</AppText><Pressable accessibilityRole="button" accessibilityLabel={voice ? 'Arrêter la saisie vocale simulée' : 'Saisie vocale'} onPress={() => setVoice((value) => !value)} style={[styles.mic, voice && styles.micActive]}><Mic size={17} color={voice ? colors.white : colors.plum} /></Pressable></View>
      </View>
      {voice ? <AppText style={styles.voiceNotice}>La saisie vocale n’est pas activée dans cette démo.</AppText> : null}
      <View style={styles.languageLine}><ShieldCheck size={14} color={colors.green} /><AppText style={styles.languageText}>Espace personnel · {preferences.language}</AppText></View>
      <View style={{ gap: 10 }}><AppText style={styles.smallHeading}>Tu peux commencer par…</AppText><View style={styles.prompts}>{prompts.map((prompt) => <Pressable key={prompt} onPress={() => { setText(prompt); setAnalysis(null); setConfirmed(false); setShowEmotionChoices(false); }} style={styles.prompt}><AppText style={styles.promptText}>{prompt}</AppText></Pressable>)}</View></View>
      {!analysis ? <Button title="Prendre ce moment" icon={Send} onPress={submit} disabled={!text.trim()} /> : null}
      {analysis ? <Panel style={styles.analysisCard}>
        <LinearGradient colors={['#F0EAFB', '#FAEDF3']} style={styles.analysisBanner}><View style={styles.analysisIcon}><Sparkles size={17} color={colors.plum} /></View><View style={{ flex: 1, gap: 3 }}><Eyebrow>REFLET SIMULÉ</Eyebrow><AppText style={styles.analysisTitle}>Une piste, pas une certitude</AppText></View><Tag tint={colors.white}>Démo</Tag></LinearGradient>
        {!confirmed ? <>
          <AppText style={styles.reflection}>« J’ai l’impression que tu ressens de la {analysis.emotion} autour de {analysis.topic.toLowerCase()}. Est-ce que cela te correspond ? »</AppText>
          <AppText style={styles.analysisMeta}>Sujet possible : {analysis.topic}</AppText>
          <AppText style={styles.summary}>{analysis.summary}</AppText>
          <View style={styles.intensityBlock}><AppText style={styles.analysisMeta}>À combien évalues-tu l’intensité ?</AppText><View style={styles.intensityRow}>{[1, 2, 3, 4, 5].map((value) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: intensity === value }} accessibilityLabel={`Intensité ${value} sur 5`} onPress={() => setIntensity(value)} style={[styles.intensityChoice, intensity === value && styles.intensitySelected]}><AppText style={[styles.intensityText, intensity === value && styles.intensityTextSelected]}>{value}</AppText></Pressable>)}</View><View style={styles.confidence}><Sparkles size={12} color={colors.plum} /><AppText style={styles.confidenceText}>Fiabilité non mesurée · repère de démonstration</AppText></View></View>
          <View style={styles.choiceRow}><Button title="Oui, c’est ça" icon={Check} onPress={() => confirm(analysis.mood)} style={{ flex: 1 }} /><Button title="Pas tout à fait" variant="outline" icon={RotateCcw} onPress={() => setShowEmotionChoices(true)} style={{ flex: 1 }} /></View>
          {showEmotionChoices ? <View style={styles.emotions}>{emotions.map((item) => <Pressable key={item.label} onPress={() => { setAnalysis({ ...analysis, emotion: item.label.toLowerCase(), mood: item.mood }); confirm(item.mood); }} style={styles.emotionChoice}><AppText style={styles.emotionText}>{item.label}</AppText></Pressable>)}</View> : null}
        </> : <View style={styles.savedState}><View style={styles.successIcon}><Check size={19} color={colors.white} /></View><AppText style={styles.savedTitle}>Merci de m’avoir corrigée.</AppText><AppText style={styles.savedCopy}>Ton moment est enregistré sur cet appareil. Tu peux le retrouver dans ton parcours.</AppText></View>}
      </Panel> : null}
      <View style={styles.footerNote}><AppText style={styles.footerText}>Ce reflet est généré localement à partir de mots-clés. Il ne s’agit ni d’un diagnostic ni d’une analyse clinique.</AppText></View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 15, paddingTop: 6 },
  heading: { gap: 6 },
  title: { fontFamily: 'Georgia', fontWeight: '600', fontSize: 26, lineHeight: 33, color: colors.ink },
  subtitle: { fontSize: 13, color: colors.muted },
  composer: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 16, minHeight: 182 },
  input: { flex: 1, minHeight: 128, color: colors.ink, fontSize: 15, lineHeight: 23, padding: 0 },
  composerFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  charCount: { color: colors.muted, fontSize: 10 },
  mic: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.paleLavender, alignItems: 'center', justifyContent: 'center' },
  micActive: { backgroundColor: colors.plum },
  voiceNotice: { color: colors.plum, fontSize: 11, marginTop: -8 },
  languageLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  languageText: { fontSize: 11, color: colors.muted },
  smallHeading: { fontSize: 12, color: colors.ink, fontWeight: '700' },
  prompts: { gap: 7 },
  prompt: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 9, backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1, borderRadius: 17, maxWidth: '100%' },
  promptText: { fontSize: 11, color: colors.violet },
  analysisCard: { padding: 15, gap: 13 },
  analysisBanner: { padding: 11, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', gap: 10 },
  analysisIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  analysisTitle: { fontWeight: '700', fontSize: 13 },
  reflection: { fontFamily: 'Georgia', fontSize: 17, lineHeight: 25, color: colors.ink },
  analysisMeta: { color: colors.muted, fontSize: 11 },
  summary: { color: colors.ink, fontSize: 12, lineHeight: 18 },
  intensityBlock: { gap: 7 },
  intensityRow: { flexDirection: 'row', gap: 7 },
  intensityChoice: { width: 33, height: 33, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F5FA', borderWidth: 1, borderColor: colors.line },
  intensitySelected: { backgroundColor: colors.plum, borderColor: colors.plum },
  intensityText: { color: colors.violet, fontWeight: '700', fontSize: 12 },
  intensityTextSelected: { color: colors.white },
  confidence: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  confidenceText: { color: colors.muted, fontSize: 10 },
  choiceRow: { flexDirection: 'row', gap: 8 },
  emotions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  emotionChoice: { backgroundColor: '#F8F5FA', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 14 },
  emotionText: { fontSize: 11, color: colors.violet, fontWeight: '600' },
  savedState: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  successIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  savedTitle: { fontFamily: 'Georgia', fontSize: 18, color: colors.ink },
  savedCopy: { color: colors.muted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  footerNote: { paddingHorizontal: spacing.xs, paddingBottom: 4 },
  footerText: { color: colors.muted, fontSize: 10, lineHeight: 15 },
});
