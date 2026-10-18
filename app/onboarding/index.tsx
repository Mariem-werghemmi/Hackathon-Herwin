import { router } from 'expo-router';
import { ArrowLeft, ArrowRight, BookOpen, BriefcaseBusiness, Check, GraduationCap, Heart, MessageCircleHeart, Moon, Presentation, Sparkles, UserRound, UsersRound } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button, Heading, Screen, TopBar } from '@/components/ui/Primitives';
import { colors, radius } from '@/constants/theme';
import { useAppData } from '@/hooks/useAppData';
import type { Language } from '@/types';

const languages: Language[] = ['Français', 'Darija tunisienne', 'العربية'];
const goals = [
  { title: 'Stress des examens', icon: BookOpen },
  { title: 'PFE et soutenance', icon: Presentation },
  { title: 'Stage ou emploi', icon: BriefcaseBusiness },
  { title: 'Confiance en soi', icon: Sparkles },
  { title: 'Sommeil et habitudes', icon: Moon },
  { title: 'Relations et famille', icon: UsersRound },
  { title: 'Besoin de parler', icon: MessageCircleHeart },
];
const stylesSupport = [
  { title: 'Écoute et compréhension', icon: Heart },
  { title: 'Conseils pratiques', icon: GraduationCap },
  { title: 'Exercices de relaxation', icon: Sparkles },
  { title: 'Un mélange des trois', icon: MessageCircleHeart },
];

export default function OnboardingScreen() {
  const { preferences, updatePreferences } = useAppData();
  const [step, setStep] = useState(0);
  const [language, setLanguage] = useState<Language>(preferences.language);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(preferences.goals);
  const [supportStyle, setSupportStyle] = useState(preferences.supportStyle);
  const [pseudonym, setPseudonym] = useState(preferences.pseudonym);

  const toggleGoal = (goal: string) => setSelectedGoals((current) => current.includes(goal) ? current.filter((item) => item !== goal) : [...current, goal]);
  const next = () => {
    if (step === 2 && selectedGoals.length === 0) return Alert.alert('Choisis un sujet', 'Tu pourras toujours modifier tes préférences plus tard.');
    if (step === 4) {
      if (!pseudonym.trim()) return Alert.alert('Un petit nom ?', 'Choisis un pseudonyme pour personnaliser ton espace.');
      updatePreferences({ onboardingComplete: true, language, goals: selectedGoals, supportStyle, pseudonym: pseudonym.trim() });
      router.replace('/(tabs)/home');
      return;
    }
    setStep((value) => value + 1);
  };

  return (
    <Screen contentStyle={styles.content}>
      <TopBar title="Ton espace HERmind" back />
      <View style={styles.progressHeader}><AppText style={styles.stepLabel}>ÉTAPE {step + 1} SUR 5</AppText><AppText style={styles.stepIntro}>Quelques repères, à ton rythme.</AppText></View>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${((step + 1) / 5) * 100}%` }]} /></View>
      {step === 0 ? <>
        <Heading title="Bienvenue dans ton espace." subtitle="HERmind t’accompagne dans les périodes d’études, les grands changements et les petits moments du quotidien." />
        <View style={styles.welcomeCard}><View style={styles.welcomeMark}><Heart size={23} color={colors.plum} /></View><AppText style={styles.welcomeTitle}>Feel understood. Find your circle. Grow together.</AppText><AppText style={styles.noteText}>Tu gardes le contrôle de ce que tu notes et partages. Cette démo fonctionne sans compte.</AppText></View>
      </> : null}
      {step === 1 ? <>
        <Heading title="On se parle comment ?" subtitle="Tu pourras changer de langue quand tu veux." />
        <View style={{ gap: 11 }}>{languages.map((item) => <SelectRow key={item} title={item} selected={language === item} onPress={() => setLanguage(item)} />)}</View>
      </> : null}
      {step === 2 ? <>
        <Heading title="Qu’est-ce qui t’amène ?" subtitle="Tu peux choisir plusieurs sujets, sans pression." />
        <View style={styles.goalGrid}>{goals.map(({ title, icon: Icon }) => {
          const selected = selectedGoals.includes(title);
          return <Pressable key={title} onPress={() => toggleGoal(title)} style={[styles.goalCard, selected && styles.selectedCard]}>
            <View style={[styles.goalIcon, selected && { backgroundColor: colors.white }]}><Icon size={18} color={selected ? colors.plum : colors.muted} /></View>
            <AppText style={styles.goalText}>{title}</AppText>
            {selected ? <Check size={15} color={colors.plum} style={styles.check} /> : null}
          </Pressable>;
        })}</View>
      </> : null}
      {step === 3 ? <>
        <Heading title="De quoi as-tu besoin ?" subtitle="On adapte le ton de l’accompagnement à tes envies." />
        <View style={{ gap: 11 }}>{stylesSupport.map(({ title, icon: Icon }) => <SelectRow key={title} title={title} icon={Icon} selected={supportStyle === title} onPress={() => setSupportStyle(title)} />)}</View>
      </> : null}
      {step === 4 ? <>
        <Heading title="Comment t’appeler ?" subtitle="Un pseudonyme suffit. Pas besoin de créer un compte." />
        <View style={styles.nameCard}><View style={styles.nameIcon}><UserRound size={21} color={colors.plum} /></View><TextInput value={pseudonym} onChangeText={setPseudonym} placeholder="Ton prénom ou pseudo" placeholderTextColor={colors.muted} maxLength={30} autoCapitalize="words" style={styles.nameInput} accessibilityLabel="Pseudonyme" /></View>
        <View style={styles.privacyNote}><Heart size={16} color={colors.plum} /><AppText style={styles.noteText}>Tes choix restent sur cet appareil dans cette démo.</AppText></View>
      </> : null}
      <View style={styles.footer}>
        {step > 0 ? <Button title="Retour" icon={ArrowLeft} variant="outline" onPress={() => setStep((value) => value - 1)} style={{ flex: 1 }} /> : null}
        <Button title={step === 4 ? 'Créer mon espace' : 'Continuer'} icon={step === 4 ? Check : ArrowRight} onPress={next} style={{ flex: 2 }} />
      </View>
    </Screen>
  );
}

function SelectRow({ title, selected, onPress, icon: Icon = Sparkles }: { title: string; selected: boolean; onPress: () => void; icon?: typeof Sparkles }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={[styles.selectRow, selected && styles.selectedCard]}>
    <View style={[styles.goalIcon, selected && { backgroundColor: colors.white }]}><Icon size={18} color={selected ? colors.plum : colors.muted} /></View>
    <AppText style={styles.rowTitle}>{title}</AppText>
    <View style={[styles.radio, selected && styles.radioActive]}>{selected ? <View style={styles.radioDot} /> : null}</View>
  </Pressable>;
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 24 },
  progressHeader: { gap: 6, marginTop: 12 },
  stepLabel: { color: colors.plum, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  stepIntro: { color: colors.muted, fontSize: 13 },
  progressTrack: { height: 5, borderRadius: 4, backgroundColor: '#E8E0EF', overflow: 'hidden', marginTop: -4 },
  progressFill: { height: '100%', backgroundColor: colors.plum, borderRadius: 4 },
  selectRow: { flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 66, backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 14 },
  selectedCard: { backgroundColor: colors.paleLavender, borderColor: colors.lavender },
  goalIcon: { width: 37, height: 37, borderRadius: 13, backgroundColor: '#F6F2F9', alignItems: 'center', justifyContent: 'center' },
  rowTitle: { flex: 1, fontSize: 14, fontWeight: '600' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#C9C0D0', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: colors.plum },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.plum },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  goalCard: { width: '48%', minHeight: 112, padding: 12, justifyContent: 'space-between', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md },
  goalText: { fontSize: 12, lineHeight: 17, fontWeight: '600', maxWidth: '90%' },
  check: { position: 'absolute', right: 10, top: 11 },
  nameCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14 },
  welcomeCard: { backgroundColor: '#F0EAFB', borderRadius: radius.lg, padding: 20, gap: 11 },
  welcomeMark: { width: 48, height: 48, borderRadius: 17, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  welcomeTitle: { fontFamily: 'Georgia', fontSize: 20, lineHeight: 27, color: colors.violet },
  nameIcon: { width: 38, height: 38, borderRadius: 14, backgroundColor: colors.paleLavender, alignItems: 'center', justifyContent: 'center' },
  nameInput: { flex: 1, fontSize: 15, color: colors.ink },
  privacyNote: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 15, backgroundColor: colors.paleLavender, borderRadius: radius.md },
  noteText: { fontSize: 12, flex: 1, color: colors.violet },
  footer: { marginTop: 'auto', flexDirection: 'row', gap: 10, paddingTop: 18 },
});
