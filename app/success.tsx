import { router } from 'expo-router';
import { ArrowUp, BookOpen, CalendarDays, ClipboardList, Heart, Sparkles } from 'lucide-react-native';
import { useId, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { TypingIndicator } from '@/components/animations/TypingIndicator';
import { AppText, Eyebrow, Screen, TopBar } from '@/components/ui/Primitives';
import { colors, radius } from '@/constants/theme';
import { useAppData } from '@/hooks/useAppData';
import { sendRemoteChat } from '@/services/api';
import type { SupportMode } from '@/types';

type StudyMode = Extract<SupportMode, 'study_plan' | 'study_tutor' | 'study_quiz' | 'success_coach'>;
type StudyTurn = { id: string; role: 'user' | 'companion'; text: string };

const studyModes: {
  id: StudyMode;
  label: string;
  description: string;
  example: string;
  icon: typeof BookOpen;
}[] = [
  {
    id: 'study_plan',
    label: 'Plan d’étude',
    description: 'Organise tes révisions sans te surcharger.',
    example: 'J’ai un examen de biologie dans 2 semaines et 1 heure par jour.',
    icon: CalendarDays,
  },
  {
    id: 'study_tutor',
    label: 'Comprendre',
    description: 'Fais expliquer un cours simplement.',
    example: 'Explique-moi ce concept avec un exemple simple : …',
    icon: BookOpen,
  },
  {
    id: 'study_quiz',
    label: 'Quiz',
    description: 'Révise avec une question à la fois.',
    example: 'Fais-moi réviser la photosynthèse niveau licence.',
    icon: ClipboardList,
  },
  {
    id: 'success_coach',
    label: 'Motivation',
    description: 'Choisis un prochain pas réaliste.',
    example: 'Je repousse mon mémoire et je ne sais pas par où commencer.',
    icon: Heart,
  },
];

export default function SuccessScreen() {
  const { preferences } = useAppData();
  const idPrefix = useId();
  const sequence = useRef(0);
  const scrollRef = useRef<ScrollView>(null);
  const [mode, setMode] = useState<StudyMode>('study_plan');
  const [turns, setTurns] = useState<StudyTurn[]>([]);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedMode = studyModes.find((item) => item.id === mode) ?? studyModes[0];

  const send = async (value = draft) => {
    const text = value.trim();
    if (!text || typing) return;
    if (!preferences.remoteChatEnabled) {
      setError('Active « Assistant connecté » dans les réglages pour recevoir une réponse de Groq.');
      return;
    }

    const context = turns.slice(-10).map((turn) => ({
      role: turn.role === 'companion' ? 'assistant' as const : 'user' as const,
      content: turn.text,
    }));
    sequence.current += 1;
    setTurns((current) => [...current, { id: `${idPrefix}-${sequence.current}`, role: 'user', text }]);
    setDraft('');
    setError(null);
    setTyping(true);
    try {
      const response = await sendRemoteChat({
        message: text,
        mode,
        language: preferences.language,
        context,
        preferences,
      });
      sequence.current += 1;
      setTurns((current) => [
        ...current,
        { id: `${idPrefix}-${sequence.current}`, role: 'companion', text: response.message },
      ]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Le coach est momentanément indisponible.');
    } finally {
      setTyping(false);
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  };

  return (
    <Screen scroll={false} contentStyle={styles.screen}>
      <TopBar title="Réussite" back />
      <View style={styles.intro}>
        <View style={styles.introIcon}><Sparkles size={20} color={colors.plum} /></View>
        <View style={styles.introCopy}>
          <AppText style={styles.title}>Tes études, à ton rythme.</AppText>
          <AppText style={styles.subtitle}>Un compagnon IA pour comprendre, réviser et avancer sans pression.</AppText>
        </View>
      </View>

      {!preferences.remoteChatEnabled ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/settings')} style={styles.connectBanner}>
          <AppText style={styles.connectText}>Active l’assistant connecté pour utiliser le coach Groq.</AppText>
          <AppText style={styles.connectAction}>Réglages →</AppText>
        </Pressable>
      ) : null}

      <View style={styles.modeSection}>
        <Eyebrow>CHOISIS TON PROCHAIN PAS</Eyebrow>
        <View style={styles.modeGrid}>
          {studyModes.map(({ id, label, icon: Icon }) => (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === id }}
              onPress={() => setMode(id)}
              style={[styles.modeButton, mode === id && styles.modeSelected]}
            >
              <Icon size={15} color={mode === id ? colors.white : colors.plum} />
              <AppText style={[styles.modeLabel, mode === id && styles.modeLabelSelected]}>{label}</AppText>
            </Pressable>
          ))}
        </View>
        <AppText style={styles.modeDescription}>{selectedMode.description}</AppText>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {turns.length === 0 ? (
          <View style={styles.welcomeCard}>
            <AppText style={styles.welcomeTitle}>On commence par quoi ?</AppText>
            <AppText style={styles.welcomeText}>
              Donne-moi ta matière, ton objectif ou ce qui te bloque. Pour un planning précis, indique aussi ta date d’examen et le temps dont tu disposes.
            </AppText>
            <Pressable accessibilityRole="button" onPress={() => { void send(selectedMode.example); }} style={styles.suggestion}>
              <AppText style={styles.suggestionText}>{selectedMode.example}</AppText>
            </Pressable>
          </View>
        ) : null}
        {turns.map((turn) => (
          <View key={turn.id} style={[styles.bubble, turn.role === 'user' ? styles.userBubble : styles.companionBubble]}>
            {turn.role === 'companion' ? <Sparkles size={14} color={colors.plum} /> : null}
            <AppText style={[styles.messageText, turn.role === 'user' && styles.userMessage]}>{turn.text}</AppText>
          </View>
        ))}
        {typing ? <View style={[styles.bubble, styles.companionBubble]}><TypingIndicator /></View> : null}
        {error ? <AppText accessibilityRole="alert" style={styles.errorText}>{error}</AppText> : null}
        <AppText style={styles.note}>Les réponses sont générées par Groq. Vérifie les informations importantes avec tes supports de cours.</AppText>
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
        <View style={styles.inputRow}>
          <TextInput
            accessibilityLabel="Écris ta question ou ton objectif d’étude"
            editable={!typing}
            maxLength={1800}
            multiline
            onChangeText={setDraft}
            onSubmitEditing={() => { void send(); }}
            placeholder={mode === 'study_tutor' ? 'Colle un extrait ou pose ta question…' : 'Écris ce dont tu as besoin…'}
            placeholderTextColor={colors.muted}
            returnKeyType="send"
            style={styles.input}
            value={draft}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Envoyer au coach d’étude"
            disabled={!draft.trim() || typing}
            onPress={() => { void send(); }}
            style={[styles.sendButton, (!draft.trim() || typing) && styles.sendDisabled]}
          >
            <ArrowUp size={19} color={colors.white} />
          </Pressable>
        </View>
        <AppText style={styles.inputHint}>{preferences.remoteChatEnabled ? 'Réponse personnalisée générée par Groq' : 'Connexion à Groq requise · Active-la dans les réglages'}</AppText>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 16, paddingTop: 5, paddingBottom: 9, gap: 10 },
  intro: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 3 },
  introIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paleLavender },
  introCopy: { flex: 1, gap: 2 },
  title: { fontSize: 19, fontFamily: 'Georgia', fontWeight: '600' },
  subtitle: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  connectBanner: { borderRadius: radius.md, backgroundColor: colors.paleLavender, padding: 11, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  connectText: { flex: 1, fontSize: 11, color: colors.violet },
  connectAction: { fontSize: 11, color: colors.plum, fontWeight: '700' },
  modeSection: { gap: 7 },
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  modeButton: { width: '48.5%', minHeight: 42, paddingHorizontal: 10, borderWidth: 1, borderColor: colors.line, borderRadius: 14, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  modeSelected: { backgroundColor: colors.plum, borderColor: colors.plum },
  modeLabel: { color: colors.violet, fontSize: 11, fontWeight: '700' },
  modeLabelSelected: { color: colors.white },
  modeDescription: { color: colors.muted, fontSize: 10 },
  messages: { flex: 1 },
  messagesContent: { gap: 10, paddingTop: 5, paddingBottom: 12 },
  welcomeCard: { padding: 15, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, gap: 9 },
  welcomeTitle: { fontSize: 15, fontWeight: '700' },
  welcomeText: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  suggestion: { alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.lavender, borderRadius: 15, paddingVertical: 8, paddingHorizontal: 11 },
  suggestionText: { color: colors.plum, fontSize: 11, fontWeight: '600' },
  bubble: { maxWidth: '90%', paddingHorizontal: 13, paddingVertical: 10, borderRadius: 18, flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  companionBubble: { alignSelf: 'flex-start', backgroundColor: colors.white, borderBottomLeftRadius: 5, borderWidth: 1, borderColor: colors.line },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.plum, borderBottomRightRadius: 5 },
  messageText: { flexShrink: 1, fontSize: 12, lineHeight: 18 },
  userMessage: { color: colors.white },
  errorText: { padding: 10, borderRadius: 12, backgroundColor: colors.palePeach, color: '#85523A', fontSize: 11, lineHeight: 16 },
  note: { textAlign: 'center', color: colors.muted, fontSize: 9, lineHeight: 13, marginHorizontal: 8 },
  inputRow: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 23, minHeight: 50, flexDirection: 'row', alignItems: 'center', paddingLeft: 14, paddingRight: 7, gap: 8 },
  input: { flex: 1, maxHeight: 100, paddingVertical: 11, color: colors.ink, fontSize: 13, lineHeight: 18 },
  sendButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.plum, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: 0.45 },
  inputHint: { color: colors.muted, textAlign: 'center', fontSize: 9, marginTop: 5 },
});
