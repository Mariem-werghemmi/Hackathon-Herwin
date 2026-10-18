import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowUp, BookOpen, Camera, Heart, Headphones, LockKeyhole, MessageCircleHeart, Sparkles, Wind } from 'lucide-react-native';
import { useId, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { TypingIndicator } from '@/components/animations/TypingIndicator';
import { AppText, Eyebrow, Screen, TopBar } from '@/components/ui/Primitives';
import { colors, radius } from '@/constants/theme';
import { useAppData } from '@/hooks/useAppData';
import { sendRemoteChat } from '@/services/api';
import type { SupportMode } from '@/types';

const modes: { id: SupportMode; label: string; icon: typeof Heart; description: string }[] = [
  { id: 'talk', label: 'Je t’écoute', icon: Heart, description: 'Déposer ce que tu ressens' },
  { id: 'act', label: 'On avance', icon: Sparkles, description: 'Choisir une petite étape' },
  { id: 'relax', label: 'On respire', icon: Wind, description: 'Faire une pause guidée' },
];
const suggestions = ['J’ai la tête pleine', 'Aide-moi à commencer', 'On respire un peu'];

export default function CompanionScreen() {
  const { messages, addMessage, preferences } = useAppData();
  const messageIdPrefix = useId();
  const messageSequence = useRef(0);
  const [mode, setMode] = useState<SupportMode>('talk');
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const send = async (value = draft) => {
    const text = value.trim();
    if (!text || typing) return;
    if (!preferences.remoteChatEnabled) {
      setChatError('Active l’assistant connecté dans les réglages pour recevoir une réponse générée par Groq.');
      return;
    }
    messageSequence.current += 1;
    addMessage({ id: `${messageIdPrefix}-${messageSequence.current}-user`, role: 'user', text });
    setDraft('');
    setChatError(null);
    setTyping(true);
    try {
      const response = await sendRemoteChat({
        message: text,
        mode,
        language: preferences.language,
        context: messages.slice(-12).map((message) => ({ role: message.role === 'companion' ? 'assistant' as const : 'user' as const, content: message.text })),
        preferences,
      });
      messageSequence.current += 1;
      addMessage({ id: `${messageIdPrefix}-${messageSequence.current}-reply`, role: 'companion', text: response.message });
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Le service de chat est momentanément indisponible.');
    } finally {
      setTyping(false);
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  };

  return (
    <Screen contentStyle={styles.screen} scroll={false}>
      <TopBar title="HERmind" right={<View style={[styles.lock, preferences.remoteChatEnabled && styles.connectedBadge]}><LockKeyhole size={13} color={preferences.remoteChatEnabled ? colors.plum : colors.green} /><AppText style={[styles.lockText, preferences.remoteChatEnabled && styles.connectedText]}>{preferences.remoteChatEnabled ? 'Connecté' : 'Local'}</AppText></View>} />
      <LinearGradient colors={['#F0EAFB', '#F8E9F0']} style={styles.header}>
        <View style={styles.avatarOrb}><View style={styles.orbCore} /><Sparkles size={13} color={colors.white} style={styles.orbSparkle} /></View>
        <View style={{ flex: 1, gap: 2 }}><AppText style={styles.headerTitle}>Ton espace bienveillant</AppText><AppText style={styles.headerSub}>{preferences.remoteChatEnabled ? 'Assistant connecté à Groq via HERmind' : 'Active le chat connecté pour utiliser Groq'}</AppText></View>
        <MessageCircleHeart size={20} color={colors.plum} />
      </LinearGradient>
      <Pressable accessibilityRole="button" onPress={() => router.push('/avatar')} style={styles.avatarCallButton}>
        <View style={styles.avatarCallIcon}><Camera size={16} color={colors.plum} /></View>
        <View style={styles.avatarCallCopy}><AppText style={styles.avatarCallTitle}>Parler face à face</AppText><AppText style={styles.avatarCallSubtitle}>Caméra privée · voix ou texte</AppText></View>
        <ArrowUp size={17} color={colors.plum} style={{ transform: [{ rotate: '45deg' }] }} />
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push('/a7kili')} style={styles.a7kiliButton}>
        <View style={styles.a7kiliIcon}><Headphones size={16} color={colors.plum} /></View>
        <View style={styles.avatarCallCopy}><AppText style={styles.avatarCallTitle}>A7kili · je t’écoute</AppText><AppText style={styles.avatarCallSubtitle}>Parle de ce qui te pèse, trouve une idée d’écoute</AppText></View>
        <ArrowUp size={17} color={colors.plum} style={{ transform: [{ rotate: '45deg' }] }} />
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push('/success')} style={styles.successButton}>
        <View style={styles.avatarCallIcon}><BookOpen size={16} color={colors.plum} /></View>
        <View style={styles.avatarCallCopy}><AppText style={styles.avatarCallTitle}>Réussite · ton coach d’étude</AppText><AppText style={styles.avatarCallSubtitle}>Plan, cours, quiz et motivation avec Groq</AppText></View>
        <ArrowUp size={17} color={colors.plum} style={{ transform: [{ rotate: '45deg' }] }} />
      </Pressable>
      <View style={styles.modeWrap}>
        <Eyebrow>DE QUOI AS-TU BESOIN ?</Eyebrow>
        <View style={styles.modeRow}>{modes.map(({ id, label, icon: Icon }) => <Pressable key={id} accessibilityRole="button" accessibilityState={{ selected: mode === id }} onPress={() => setMode(id)} style={[styles.modeButton, mode === id && styles.modeActive]}><Icon size={15} color={mode === id ? colors.white : colors.plum} /><AppText style={[styles.modeLabel, mode === id && { color: colors.white }]}>{label}</AppText></Pressable>)}</View>
      </View>
      <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={styles.messagesContent} keyboardShouldPersistTaps="handled" onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
        <View style={styles.mockBanner}><Sparkles size={13} color={colors.plum} /><AppText style={styles.mockText}>{preferences.remoteChatEnabled ? `Réponses générées par Groq · historique ${preferences.cloudHistoryEnabled ? 'conservé' : 'non conservé'}` : 'Aucune réponse prédéfinie · connexion à Groq requise'}</AppText></View>
        {messages.map((message) => <View key={message.id} style={[styles.bubble, message.role === 'user' ? styles.userBubble : styles.companionBubble]}>
          {message.role === 'companion' ? <View style={styles.miniIcon}><Heart size={12} color={colors.plum} /></View> : null}
          <AppText style={[styles.messageText, message.role === 'user' && { color: colors.white }, preferences.language === 'العربية' && { writingDirection: 'rtl', textAlign: 'right' }]}>{message.text}</AppText>
        </View>)}
        {typing ? <View style={[styles.bubble, styles.companionBubble]}><TypingIndicator /></View> : null}
        {chatError ? <View accessibilityRole="alert" style={styles.errorBox}><AppText style={styles.errorText}>{chatError}</AppText></View> : null}
        {messages.length < 3 ? <View style={styles.suggestions}>{suggestions.map((suggestion) => <Pressable key={suggestion} onPress={() => send(suggestion)} style={styles.suggestion}><AppText style={styles.suggestionText}>{suggestion}</AppText></Pressable>)}</View> : null}
        <AppText style={styles.safetyText}>Je peux t’accompagner, mais je ne remplace pas une personne de confiance ni un professionnel.</AppText>
      </ScrollView>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
        <View style={styles.inputRow}><TextInput value={draft} onChangeText={setDraft} onSubmitEditing={() => send()} returnKeyType="send" placeholder="Écris ce que tu veux…" placeholderTextColor="#A49AAA" multiline maxLength={800} style={styles.input} accessibilityLabel="Message à HERmind" /><Pressable accessibilityRole="button" accessibilityLabel="Envoyer le message" disabled={!draft.trim() || typing} onPress={() => send()} style={[styles.sendButton, (!draft.trim() || typing) && { opacity: 0.45 }]}><ArrowUp size={19} color={colors.white} /></Pressable></View>
        <AppText style={styles.inputHint}>{preferences.remoteChatEnabled ? 'Réponse générée par Groq' : 'Active le chat connecté dans les réglages'} · {modes.find((item) => item.id === mode)?.description}</AppText>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 16, paddingTop: 5, paddingBottom: 9, gap: 10 },
  lock: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.paleGreen, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 12 },
  lockText: { fontSize: 10, color: '#557D61', fontWeight: '700' },
  connectedBadge: { backgroundColor: colors.paleLavender },
  connectedText: { color: colors.plum },
  header: { minHeight: 72, borderRadius: radius.md, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  avatarOrb: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.plum, alignItems: 'center', justifyContent: 'center' },
  orbCore: { width: 23, height: 23, borderRadius: 12, backgroundColor: '#DCCDF2' },
  orbSparkle: { position: 'absolute', top: 4, right: 3 },
  headerTitle: { fontSize: 14, fontWeight: '700' },
  headerSub: { fontSize: 10, color: colors.muted },
  avatarCallButton: { minHeight: 54, paddingHorizontal: 11, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarCallIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.paleLavender },
  avatarCallCopy: { flex: 1, gap: 1 },
  avatarCallTitle: { fontSize: 12, fontWeight: '700', color: colors.ink },
  avatarCallSubtitle: { fontSize: 10, color: colors.muted },
  a7kiliButton: { minHeight: 54, paddingHorizontal: 11, borderRadius: radius.md, borderWidth: 1, borderColor: '#F0DDE8', backgroundColor: '#FFFAFC', flexDirection: 'row', alignItems: 'center', gap: 10 },
  a7kiliIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#F8E9F0' },
  successButton: { minHeight: 54, paddingHorizontal: 11, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', gap: 10 },
  modeWrap: { gap: 7 },
  modeRow: { flexDirection: 'row', gap: 6 },
  modeButton: { flex: 1, minHeight: 39, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  modeActive: { backgroundColor: colors.plum, borderColor: colors.plum },
  modeLabel: { fontSize: 10, color: colors.violet, fontWeight: '700' },
  messages: { flex: 1 },
  messagesContent: { gap: 11, paddingTop: 8, paddingBottom: 16 },
  mockBanner: { alignSelf: 'center', flexDirection: 'row', gap: 5, alignItems: 'center', backgroundColor: colors.paleLavender, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  mockText: { fontSize: 9, fontWeight: '600', color: colors.violet },
  bubble: { maxWidth: '86%', paddingHorizontal: 14, paddingVertical: 11, borderRadius: 19, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  companionBubble: { alignSelf: 'flex-start', backgroundColor: colors.white, borderBottomLeftRadius: 5, borderWidth: 1, borderColor: colors.line },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.plum, borderBottomRightRadius: 5 },
  miniIcon: { width: 21, height: 21, borderRadius: 11, backgroundColor: colors.paleLavender, alignItems: 'center', justifyContent: 'center' },
  messageText: { flexShrink: 1, fontSize: 13, lineHeight: 19 },
  typing: { fontSize: 11, color: colors.muted, fontStyle: 'italic' },
  errorBox: { alignSelf: 'stretch', padding: 10, borderRadius: 12, backgroundColor: '#FFF0E7' },
  errorText: { color: '#85523A', fontSize: 11, lineHeight: 16 },
  suggestions: { flexDirection: 'row', gap: 7, flexWrap: 'wrap' },
  suggestion: { borderWidth: 1, borderColor: colors.lavender, paddingVertical: 8, paddingHorizontal: 11, borderRadius: 15 },
  suggestionText: { color: colors.plum, fontSize: 10, fontWeight: '600' },
  safetyText: { textAlign: 'center', color: colors.muted, fontSize: 9, lineHeight: 14, marginHorizontal: 10 },
  inputRow: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 23, minHeight: 50, flexDirection: 'row', alignItems: 'center', paddingLeft: 14, paddingRight: 7, gap: 8 },
  input: { flex: 1, maxHeight: 94, paddingVertical: 11, color: colors.ink, fontSize: 13, lineHeight: 18 },
  sendButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.plum, alignItems: 'center', justifyContent: 'center' },
  inputHint: { color: colors.muted, textAlign: 'center', fontSize: 9, marginTop: 5 },
});
