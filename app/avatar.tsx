import { CameraView, useCameraPermissions } from 'expo-camera';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import * as Speech from 'expo-speech';
import { router } from 'expo-router';
import { ArrowRight, Camera, CameraOff, Mic, MicOff, Send, Settings, Volume2 } from 'lucide-react-native';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AvatarRobot } from '@/components/animations/AvatarRobot';
import { AppText, Screen, TopBar } from '@/components/ui/Primitives';
import { colors, radius } from '@/constants/theme';
import { useAppData } from '@/hooks/useAppData';
import { sendRemoteChat, transcribeAudio } from '@/services/api';
import type { Language } from '@/types';

function speechLanguage(language: Language): string {
  if (language === 'Français') return 'fr-FR';
  return 'ar-TN';
}

export default function AvatarScreen() {
  const { messages, addMessage, preferences, hydrated } = useAppData();
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const idPrefix = useId();
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [listening, setListening] = useState(false);
  const [sending, setSending] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const messageSequenceRef = useRef(0);
  const sendingRef = useRef(false);
  const welcomedRef = useRef(false);
  const latestReply = [...messages].reverse().find((message) => message.role === 'companion');

  useEffect(() => () => {
    if (audioRecorder.isRecording) void audioRecorder.stop();
    void Speech.stop().catch(() => undefined);
  }, [audioRecorder]);

  const welcomeMessage = preferences.language === 'Français'
    ? 'Salut, moi c’est HERmind. Je suis là pour t’écouter. Quand tu veux, appuie sur le micro et parle-moi.'
    : preferences.language === 'Darija tunisienne'
      ? 'Aslema, ena HERmind. Ena houni bech nesma3lek. Wa9telli t7ebbi, odhghthi 3al micro w ahkili.'
      : 'عسلامة، أنا HERmind. أنا هنا لنسمعك. وقت تحبّي، اضغطي على الميكرو واحكيلي.';
  const displayMessage = conversationStarted ? latestReply?.text ?? welcomeMessage : welcomeMessage;

  const sendMessage = async (value: string) => {
    const message = value.trim();
    if (!message || sendingRef.current) return;
    if (!preferences.remoteChatEnabled) {
      setChatError('Active d’abord « Assistant connecté » dans les réglages pour parler avec Groq.');
      return;
    }

    sendingRef.current = true;
    setSending(true);
    setChatError(null);
    setVoiceError(null);
    messageSequenceRef.current += 1;
    addMessage({ id: `${idPrefix}-${messageSequenceRef.current}-user`, role: 'user', text: message });

    try {
      const response = await sendRemoteChat({
        message,
        mode: 'talk',
        language: preferences.language,
        context: messages.slice(-12).map((item) => ({
          role: item.role === 'companion' ? 'assistant' : 'user',
          content: item.text,
        })),
        preferences,
      });
      messageSequenceRef.current += 1;
      addMessage({ id: `${idPrefix}-${messageSequenceRef.current}-reply`, role: 'companion', text: response.message });
      setConversationStarted(true);
      speak(response.message);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Le service de chat est momentanément indisponible.');
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const speak = useCallback((text: string) => {
    try {
      Speech.speak(text, {
        language: speechLanguage(preferences.language),
        rate: 0.92,
        onStart: () => setSpeaking(true),
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        ...(Platform.OS === 'web' ? {} : {
          onError: () => {
            setSpeaking(false);
            setVoiceError('La réponse est disponible en texte, mais la voix de synthèse ne fonctionne pas sur cet appareil.');
          },
        }),
      });
    } catch {
      setSpeaking(false);
      setVoiceError('La réponse reste disponible en texte, mais la synthèse vocale est indisponible.');
    }
  }, [preferences.language]);

  useEffect(() => {
    if (!hydrated || welcomedRef.current) return;
    welcomedRef.current = true;
    speak(welcomeMessage);
  }, [hydrated, speak, welcomeMessage]);

  const toggleMicrophone = async () => {
    if (listening) {
      setListening(false);
      setTranscribing(true);
      try {
        await audioRecorder.stop();
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        const uri = audioRecorder.uri;
        if (!uri) throw new Error('L’enregistrement audio est introuvable. Réessaie.');
        const transcript = await transcribeAudio(uri, preferences.language, preferences);
        setDraft('');
        await sendMessage(transcript);
      } catch (error) {
        setVoiceError(error instanceof Error ? error.message : 'La transcription a échoué. Réessaie ou écris ton message.');
      } finally {
        setTranscribing(false);
      }
      return;
    }

    if (!preferences.remoteChatEnabled) {
      setChatError('Active d’abord « Assistant connecté » dans les réglages pour parler avec Groq.');
      return;
    }

    setVoiceError(null);
    setChatError(null);
    setDraft('');
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setVoiceError('Autorise le micro dans les réglages de ton navigateur ou de ton appareil, puis réessaie.');
        return;
      }
      await Speech.stop();
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setListening(true);
    } catch (error) {
      setListening(false);
      setVoiceError(error instanceof Error ? `Impossible de démarrer le micro : ${error.message}` : 'Impossible de démarrer le micro. Vérifie son autorisation.');
    }
  };

  const toggleCamera = async () => {
    if (cameraEnabled) {
      setCameraEnabled(false);
      setCameraError(null);
      return;
    }
    try {
      if (!cameraPermission?.granted) {
        const permission = await requestCameraPermission();
        if (!permission.granted) {
          setCameraError('Autorise la caméra dans ton navigateur pour afficher ton aperçu.');
          return;
        }
      }
      setCameraError(null);
      setCameraEnabled(true);
    } catch {
      setCameraError('Impossible d’ouvrir la caméra. Vérifie son autorisation dans ton navigateur.');
    }
  };

  return (
    <Screen scroll={false} contentStyle={styles.screen}>
      <TopBar title="Face à face" back />
      <View style={styles.intro}>
        <AppText style={styles.title}>Ton robot HERmind</AppText>
        <AppText style={styles.subtitle}>Il t’accueille et te répond à voix haute. Ton aperçu caméra reste privé.</AppText>
      </View>

      <View style={styles.callStage}>
        {cameraEnabled && cameraPermission?.granted ? (
          <CameraView facing="front" style={styles.camera} onMountError={(event) => {
            setCameraEnabled(false);
            setCameraError(event.message);
          }} />
        ) : (
          <View style={styles.stageBackdrop} />
        )}
        <View pointerEvents="none" style={styles.robotWrap}>
          <AvatarRobot talking={speaking} reacting={speaking || sending || listening} />
          <View style={styles.robotStatus}>
            <View style={[styles.statusDot, (sending || listening) && styles.statusActive]} />
            <AppText style={styles.robotStatusText}>
              {sending ? 'Je réfléchis…' : listening ? 'Je t’écoute…' : speaking ? 'Je te parle…' : 'Prête à discuter'}
            </AppText>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={cameraEnabled ? 'Désactiver la caméra' : 'Activer mon aperçu caméra privé'}
          onPress={() => { void toggleCamera(); }}
          style={styles.cameraToggle}
        >
          {cameraEnabled ? <CameraOff size={16} color={colors.plum} /> : <Camera size={16} color={colors.plum} />}
          <AppText style={styles.cameraToggleText}>{cameraEnabled ? 'Masquer' : 'Mon aperçu'}</AppText>
        </Pressable>
      </View>

      <View style={styles.replyCard}>
        <View style={styles.replyContent}>
          <AppText style={styles.replyTitle}>{conversationStarted && latestReply ? 'HERmind te répond' : 'Son petit mot pour toi'}</AppText>
          <AppText style={styles.replyText}>{displayMessage}</AppText>
        </View>
        {!speaking ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Écouter la voix du robot"
            onPress={() => { setVoiceError(null); speak(displayMessage); }}
            style={styles.listenButton}
          >
            <Volume2 size={18} color={colors.plum} />
          </Pressable>
        ) : null}
      </View>

      {chatError || voiceError || cameraError ? (
        <AppText accessibilityRole="alert" style={styles.errorText}>{chatError ?? voiceError ?? cameraError}</AppText>
      ) : null}

      <View style={styles.controls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={listening ? 'Arrêter de parler' : 'Parler avec le robot'}
          disabled={sending || transcribing}
          onPress={() => { void toggleMicrophone(); }}
          style={[styles.talkButton, (listening || transcribing) && styles.talkButtonActive, (sending || transcribing) && styles.disabledButton]}
        >
          {listening ? <MicOff size={19} color={colors.white} /> : <Mic size={19} color={colors.white} />}
          <AppText style={styles.talkButtonText}>{listening ? 'Je t’écoute… appuie pour terminer' : transcribing ? 'Je prépare ta réponse…' : 'Appuie ici et parle avec moi'}</AppText>
        </Pressable>
        <View style={styles.inputRow}>
          <TextInput
            accessibilityLabel="Message pour ton avatar"
            editable={!sending && !listening && !transcribing}
            maxLength={800}
            multiline
            onChangeText={setDraft}
            onSubmitEditing={() => { void sendMessage(draft); }}
            placeholder={listening ? 'Je t’écoute…' : 'Écris ou dicte ton message…'}
            placeholderTextColor={colors.muted}
            returnKeyType="send"
            style={styles.input}
            value={draft}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Envoyer le message à ton avatar"
            disabled={!draft.trim() || sending || listening || transcribing}
            onPress={() => { void sendMessage(draft); setDraft(''); }}
            style={[styles.roundButton, styles.sendButton, (!draft.trim() || sending || listening || transcribing) && styles.disabledButton]}
          >
            <Send size={18} color={colors.white} />
          </Pressable>
        </View>
        <AppText style={styles.privacyNote}>L’enregistrement est envoyé à Groq via HERmind pour transcription, sans être conservé par HERmind. Seul le texte transcrit est envoyé au chat.</AppText>
        {!preferences.remoteChatEnabled ? (
          <Pressable accessibilityRole="button" onPress={() => router.push('/settings')} style={styles.settingsLink}>
            <Settings size={15} color={colors.plum} />
            <AppText style={styles.settingsText}>Activer l’assistant connecté</AppText>
            <ArrowRight size={14} color={colors.plum} />
          </Pressable>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12, gap: 12 },
  intro: { gap: 3 },
  title: { fontFamily: 'Georgia', fontSize: 23, lineHeight: 29, color: colors.ink },
  subtitle: { fontSize: 11, lineHeight: 16, color: colors.muted },
  callStage: { flex: 1, minHeight: 240, maxHeight: 360, overflow: 'hidden', borderRadius: radius.lg, backgroundColor: '#DCD3EC', position: 'relative' },
  camera: { ...StyleSheet.absoluteFill },
  stageBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: '#E9E1F0' },
  robotWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(232,223,242,0.42)' },
  robotStatus: { position: 'absolute', bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.88)' },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#8A7B9D' },
  statusActive: { backgroundColor: '#67A783' },
  robotStatusText: { color: colors.ink, fontSize: 10, fontWeight: '600' },
  cameraToggle: { position: 'absolute', top: 10, right: 10, minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.92)' },
  cameraToggleText: { color: colors.plum, fontSize: 10, fontWeight: '700' },
  replyCard: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 78, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  replyContent: { flex: 1, gap: 3 },
  replyTitle: { fontSize: 12, fontWeight: '700', color: colors.plum },
  replyText: { maxHeight: 54, overflow: 'hidden', fontSize: 11, lineHeight: 16 },
  listenButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: colors.paleLavender },
  errorText: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: radius.sm, backgroundColor: colors.palePeach, color: '#85523A', fontSize: 11, lineHeight: 16 },
  controls: { gap: 7 },
  talkButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: radius.pill, backgroundColor: colors.plum },
  talkButtonActive: { backgroundColor: '#B94F68' },
  talkButtonText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 7, padding: 7, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  input: { flex: 1, maxHeight: 80, minHeight: 42, paddingHorizontal: 9, paddingVertical: 9, color: colors.ink, fontSize: 13, textAlignVertical: 'center' },
  roundButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: colors.paleLavender },
  sendButton: { backgroundColor: colors.plum },
  disabledButton: { opacity: 0.45 },
  privacyNote: { color: colors.muted, fontSize: 9, lineHeight: 13, textAlign: 'center' },
  settingsLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  settingsText: { color: colors.plum, fontSize: 11, fontWeight: '700' },
});
