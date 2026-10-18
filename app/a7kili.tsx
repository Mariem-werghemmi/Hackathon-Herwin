import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { ArrowRight, CirclePlay, Headphones, Music2, Send } from 'lucide-react-native';
import { useId, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { TypingIndicator } from '@/components/animations/TypingIndicator';
import { AppText, Screen, TopBar } from '@/components/ui/Primitives';
import { colors, radius } from '@/constants/theme';
import { useAppData } from '@/hooks/useAppData';
import { sendRemoteChat } from '@/services/api';
import type { SupportMode } from '@/types';

type A7kiliTurn = {
  id: string;
  role: 'user' | 'companion';
  text: string;
  raw?: string;
  podcast?: string;
  music?: string;
};

function parseA7kiliReply(raw: string): Pick<A7kiliTurn, 'text' | 'podcast' | 'music'> {
  const heading = /^\s*(?:[-*•]\s*)?(?:\*\*|__)?\s*\[?(ECOUTE|PODCAST|MUSIQUE)\]?\s*(?:\*\*|__)?\s*:?\s*(.*)$/gim;
  const headings = Array.from(raw.matchAll(heading));
  const sections = new Map<string, string>();
  headings.forEach((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = headings[index + 1]?.index ?? raw.length;
    sections.set(match[1].toUpperCase(), [match[2], raw.slice(start, end)].join('\n').trim());
  });
  const text = sections.get('ECOUTE');
  const podcast = sections.get('PODCAST');
  const music = sections.get('MUSIQUE');
  if (!text || !podcast || !music) return { text: raw };
  return { text, podcast, music };
}

function youtubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export default function A7kiliScreen() {
  const { preferences } = useAppData();
  const messageIdPrefix = useId();
  const messageSequence = useRef(0);
  const [turns, setTurns] = useState<A7kiliTurn[]>([]);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const send = async (value = draft) => {
    const text = value.trim();
    if (!text || typing) return;
    if (!preferences.remoteChatEnabled) {
      setError('Active « Assistant connecté » dans les réglages pour utiliser A7kili.');
      return;
    }

    const nextSequence = messageSequence.current + 1;
    messageSequence.current = nextSequence;
    const userTurn: A7kiliTurn = { id: `${messageIdPrefix}-${nextSequence}-user`, role: 'user', text };
    const context = turns.slice(-10).map((turn) => ({
      role: turn.role === 'companion' ? 'assistant' as const : 'user' as const,
      content: turn.raw ?? turn.text,
    }));
    setTurns((current) => [...current, userTurn]);
    setDraft('');
    setError(null);
    setTyping(true);
    try {
      const response = await sendRemoteChat({
        message: text,
        mode: 'a7kili' satisfies SupportMode,
        language: preferences.language,
        context,
        preferences,
      });
      messageSequence.current += 1;
      const parsed = parseA7kiliReply(response.message);
      setTurns((current) => [...current, {
        id: `${messageIdPrefix}-${messageSequence.current}-reply`,
        role: 'companion',
        ...parsed,
        raw: response.message,
      }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'A7kili est momentanément indisponible.');
    } finally {
      setTyping(false);
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  };

  const openYouTube = async (query: string) => {
    try {
      setLinkError(null);
      await Linking.openURL(youtubeSearchUrl(query));
    } catch {
      setLinkError('Impossible d’ouvrir YouTube sur cet appareil.');
    }
  };

  return (
    <Screen scroll={false} contentStyle={styles.screen}>
      <TopBar title="A7kili" back />
      <View style={styles.intro}>
        <View style={styles.introIcon}><Headphones size={21} color={colors.plum} /></View>
        <View style={styles.introCopy}>
          <AppText style={styles.title}>A7kili, je t’écoute</AppText>
          <AppText style={styles.subtitle}>Raconte ce qui te pèse. HERmind t’écoute et te propose une musique et un podcast à découvrir.</AppText>
        </View>
      </View>

      {!preferences.remoteChatEnabled ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/settings')} style={styles.connectBanner}>
          <AppText style={styles.connectText}>Active l’assistant connecté pour discuter avec Groq.</AppText>
          <ArrowRight size={17} color={colors.plum} />
        </Pressable>
      ) : null}

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {turns.length === 0 ? (
          <View style={styles.welcomeCard}>
            <AppText style={styles.welcomeTitle}>Tu peux tout me raconter.</AppText>
            <AppText style={styles.welcomeText}>Une journée difficile, le stress des études, un coup de blues… Je suis là sans jugement. Ensuite, je chercherai avec toi une idée d’écoute qui pourrait te faire du bien.</AppText>
            <View style={styles.suggestions}>
              {['Je me sens dépassée', 'J’ai besoin de motivation', 'J’ai eu une journée difficile'].map((suggestion) => (
                <Pressable key={suggestion} onPress={() => { void send(suggestion); }} style={styles.suggestion}>
                  <AppText style={styles.suggestionText}>{suggestion}</AppText>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
        {turns.map((turn) => (
          <View key={turn.id} style={[styles.bubble, turn.role === 'user' ? styles.userBubble : styles.companionBubble]}>
            <AppText style={[styles.messageText, turn.role === 'user' && styles.userMessage]}>{turn.text}</AppText>
            {turn.podcast ? (
              <RecommendationCard
                icon="podcast"
                label="Podcast à découvrir"
                query={turn.podcast}
                onPress={() => { if (turn.podcast) void openYouTube(turn.podcast); }}
              />
            ) : null}
            {turn.music ? (
              <RecommendationCard
                icon="music"
                label="Musique pour toi"
                query={turn.music}
                onPress={() => { if (turn.music) void openYouTube(turn.music); }}
              />
            ) : null}
          </View>
        ))}
        {typing ? <View style={[styles.bubble, styles.companionBubble]}><TypingIndicator /></View> : null}
        {error || linkError ? <AppText accessibilityRole="alert" style={styles.errorText}>{error ?? linkError}</AppText> : null}
        <AppText style={styles.safetyNote}>Les suggestions sont des pistes d’écoute, pas un remplacement à une aide humaine ou professionnelle.</AppText>
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
        <View style={styles.inputRow}>
          <TextInput
            accessibilityLabel="Raconte ce qui te préoccupe à A7kili"
            editable={!typing}
            maxLength={1500}
            multiline
            onChangeText={setDraft}
            onSubmitEditing={() => { void send(); }}
            placeholder="Raconte-moi ce qui se passe…"
            placeholderTextColor={colors.muted}
            returnKeyType="send"
            style={styles.input}
            value={draft}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Envoyer ton message à A7kili"
            disabled={!draft.trim() || typing}
            onPress={() => { void send(); }}
            style={[styles.sendButton, (!draft.trim() || typing) && styles.disabledButton]}
          >
            <Send size={18} color={colors.white} />
          </Pressable>
        </View>
        <AppText style={styles.privacyNote}>Le message est traité par le chat Groq configuré dans HERmind. Les liens ouvrent des recherches YouTube, pas des vidéos vérifiées.</AppText>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function RecommendationCard({ icon, label, query, onPress }: { icon: 'podcast' | 'music'; label: string; query: string; onPress: () => void }) {
  const Icon = icon === 'podcast' ? Headphones : Music2;
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={styles.recommendation}>
      <View style={styles.recommendationIcon}><Icon size={17} color={colors.plum} /></View>
      <View style={styles.recommendationCopy}>
        <AppText style={styles.recommendationLabel}>{label}</AppText>
        <AppText style={styles.recommendationQuery}>{query}</AppText>
        <View style={styles.youtubeLabel}><CirclePlay size={12} color="#C83838" /><AppText style={styles.youtubeText}>Chercher sur YouTube</AppText></View>
      </View>
      <ArrowRight size={16} color={colors.plum} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16, paddingTop: 5, paddingBottom: 10, gap: 11 },
  intro: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  introIcon: { width: 43, height: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: colors.paleLavender },
  introCopy: { flex: 1, gap: 2 },
  title: { fontFamily: 'Georgia', fontSize: 21, color: colors.ink },
  subtitle: { color: colors.muted, fontSize: 11, lineHeight: 15 },
  connectBanner: { minHeight: 42, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: radius.md, backgroundColor: colors.paleLavender },
  connectText: { color: colors.plum, fontSize: 11, fontWeight: '600' },
  messages: { flex: 1 },
  messagesContent: { flexGrow: 1, gap: 11, paddingTop: 5, paddingBottom: 12 },
  welcomeCard: { marginTop: 12, padding: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, gap: 8 },
  welcomeTitle: { fontSize: 15, fontWeight: '700', color: colors.plum },
  welcomeText: { color: colors.ink, fontSize: 13, lineHeight: 19 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 3 },
  suggestion: { paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill },
  suggestionText: { color: colors.plum, fontSize: 10, fontWeight: '600' },
  bubble: { maxWidth: '91%', padding: 12, borderRadius: radius.md, gap: 8 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.plum },
  companionBubble: { alignSelf: 'stretch', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  messageText: { color: colors.ink, fontSize: 13, lineHeight: 19 },
  userMessage: { color: colors.white },
  recommendation: { minHeight: 67, padding: 9, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 13, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FFFCFF' },
  recommendationIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.paleLavender },
  recommendationCopy: { flex: 1, gap: 1 },
  recommendationLabel: { color: colors.plum, fontSize: 10, fontWeight: '700' },
  recommendationQuery: { color: colors.ink, fontSize: 11, fontWeight: '600' },
  youtubeLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  youtubeText: { color: colors.muted, fontSize: 9 },
  errorText: { padding: 9, borderRadius: 12, backgroundColor: colors.palePeach, color: '#85523A', fontSize: 11, lineHeight: 15 },
  safetyNote: { marginTop: 6, color: colors.muted, fontSize: 9, textAlign: 'center' },
  inputRow: { minHeight: 54, padding: 6, paddingLeft: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 22, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  input: { flex: 1, maxHeight: 90, paddingVertical: 8, color: colors.ink, fontSize: 13, lineHeight: 18 },
  sendButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: colors.plum },
  disabledButton: { opacity: 0.45 },
  privacyNote: { marginTop: 4, color: colors.muted, fontSize: 9, lineHeight: 13, textAlign: 'center' },
});
