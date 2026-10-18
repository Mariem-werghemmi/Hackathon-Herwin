import { router } from 'expo-router';
import { Bell, ChevronRight, LockKeyhole, MessageCircleHeart, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Panel, Screen, TopBar } from '@/components/ui/Primitives';
import { colors, radius } from '@/constants/theme';
import { useAppData } from '@/hooks/useAppData';
import { API_BASE_URL, ensureRemoteAccount, updateRemoteHistoryConsent } from '@/services/api';

type Confirmation = 'enable-chat' | 'disable-chat' | 'enable-history' | 'disable-history' | 'chat-required';

const confirmationCopy: Record<Confirmation, { title: string; description: string; confirmLabel: string | null; destructive?: boolean }> = {
  'enable-chat': {
    title: 'Activer le chat connecté ?',
    description: `Tes messages, ton pseudonyme, ta langue et les thèmes choisis seront envoyés au serveur HERmind, puis au fournisseur Groq configuré. Tes journaux et check-ins ne sont pas envoyés. L’historique serveur reste désactivé par défaut.${Platform.OS === 'web' ? ' Sur le web, le jeton de connexion sera conservé dans le stockage local du navigateur, qui n’est pas chiffré.' : ''}`,
    confirmLabel: 'Activer',
  },
  'disable-chat': {
    title: 'Désactiver le chat connecté ?',
    description: 'L’historique enregistré sur le serveur sera supprimé avant de désactiver le chat.',
    confirmLabel: 'Désactiver et effacer',
    destructive: true,
  },
  'enable-history': {
    title: 'Conserver l’historique sur le serveur ?',
    description: 'Les messages de tes conversations seront conservés sur le serveur pour retrouver le contexte. Tu peux retirer ton consentement à tout moment.',
    confirmLabel: 'J’accepte',
  },
  'disable-history': {
    title: 'Effacer l’historique du serveur ?',
    description: 'Les conversations déjà stockées seront supprimées du serveur.',
    confirmLabel: 'Effacer',
    destructive: true,
  },
  'chat-required': {
    title: 'Assistant connecté requis',
    description: 'Active d’abord l’assistant connecté pour gérer l’historique serveur.',
    confirmLabel: null,
  },
};

export default function SettingsScreen() {
  const { preferences, updatePreferences } = useAppData();
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [processing, setProcessing] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const openConfirmation = (next: Confirmation) => {
    setDialogError(null);
    setConfirmation(next);
  };

  const dismissConfirmation = () => {
    if (processing) return;
    setConfirmation(null);
    setDialogError(null);
  };

  const confirmAction = async () => {
    if (!confirmation || processing || confirmation === 'chat-required') return;
    if (confirmation === 'enable-chat' && !API_BASE_URL) {
      setDialogError('Serveur non configuré. Ajoute EXPO_PUBLIC_API_URL au fichier .env.local puis redémarre Expo.');
      return;
    }

    setProcessing(true);
    setDialogError(null);
    try {
      switch (confirmation) {
        case 'enable-chat':
          await ensureRemoteAccount(preferences);
          updatePreferences({ remoteChatEnabled: true });
          break;
        case 'disable-chat':
          await updateRemoteHistoryConsent(false, preferences);
          updatePreferences({ remoteChatEnabled: false, cloudHistoryEnabled: false });
          break;
        case 'enable-history':
          await updateRemoteHistoryConsent(true, preferences);
          updatePreferences({ cloudHistoryEnabled: true });
          break;
        case 'disable-history':
          await updateRemoteHistoryConsent(false, preferences);
          updatePreferences({ cloudHistoryEnabled: false });
          break;
      }
      setConfirmation(null);
    } catch (error) {
      setDialogError(error instanceof Error ? error.message : 'Le serveur HERmind n’a pas pu être contacté.');
    } finally {
      setProcessing(false);
    }
  };

  const toggleRemoteChat = () => {
    if (preferences.remoteChatEnabled) {
      if (preferences.cloudHistoryEnabled) openConfirmation('disable-chat');
      else updatePreferences({ remoteChatEnabled: false });
      return;
    }
    openConfirmation('enable-chat');
  };

  const toggleCloudHistory = () => {
    if (!preferences.remoteChatEnabled) {
      openConfirmation('chat-required');
      return;
    }
    openConfirmation(preferences.cloudHistoryEnabled ? 'disable-history' : 'enable-history');
  };

  const copy = confirmation ? confirmationCopy[confirmation] : null;

  return (
    <Screen contentStyle={styles.content}>
      <TopBar title="Réglages" back />
      <View style={styles.heading}><AppText style={styles.title}>Tes préférences</AppText><AppText style={styles.subtitle}>Des réglages simples, modifiables à tout moment.</AppText></View>
      <Panel style={styles.panel}>
        <PreferenceRow icon={MessageCircleHeart} title="Assistant connecté" detail={API_BASE_URL ? 'Envoie les messages à Groq via ton serveur HERmind' : 'Configure EXPO_PUBLIC_API_URL pour l’activer'} value={preferences.remoteChatEnabled} disabled={processing} onPress={toggleRemoteChat} />
        <View style={styles.divider} />
        <PreferenceRow icon={ShieldCheck} title="Conserver l’historique serveur" detail="Consentement séparé · désactiver efface l’historique" value={preferences.cloudHistoryEnabled} disabled={processing} onPress={toggleCloudHistory} />
        <View style={styles.divider} />
        <PreferenceRow icon={Bell} title="Notifications douces" detail="Rappels facultatifs" value={Boolean(preferences.notificationsEnabled)} onPress={() => updatePreferences({ notificationsEnabled: !preferences.notificationsEnabled })} />
        <View style={styles.divider} />
        <PreferenceRow icon={LockKeyhole} title="Verrouillage par code" detail="Prototype visuel, aucune sécurité réelle" value={Boolean(preferences.pinPrototypeEnabled)} onPress={() => updatePreferences({ pinPrototypeEnabled: !preferences.pinPrototypeEnabled })} />
      </Panel>
      <Pressable accessibilityRole="button" accessibilityLabel="Confidentialité et aide" onPress={() => router.push('/privacy')} style={styles.privacyLink}><View style={styles.privacyIcon}><ShieldCheck size={17} color={colors.plum} /></View><View style={{ flex: 1 }}><AppText style={styles.rowTitle}>Confidentialité et aide</AppText><AppText style={styles.rowDetail}>Données locales, limites et ressources</AppText></View><ChevronRight size={17} color={colors.muted} /></Pressable>
      <AppText style={styles.note}>Les préférences sont enregistrées sur cet appareil dans le prototype.</AppText>
      <Modal transparent visible={confirmation !== null} animationType="fade" onRequestClose={dismissConfirmation}>
        <View style={styles.modalRoot}>
          <Pressable accessibilityRole="button" accessibilityLabel="Fermer la confirmation" disabled={processing} onPress={dismissConfirmation} style={StyleSheet.absoluteFill} />
          {copy ? (
            <View accessibilityViewIsModal style={styles.dialog}>
              <AppText style={styles.dialogTitle}>{copy.title}</AppText>
              <AppText style={styles.dialogDescription}>{copy.description}</AppText>
              {dialogError ? <AppText accessibilityRole="alert" style={styles.dialogError}>{dialogError}</AppText> : null}
              <View style={styles.dialogActions}>
                <Pressable accessibilityRole="button" disabled={processing} onPress={dismissConfirmation} style={[styles.dialogButton, styles.cancelButton, processing && styles.disabledButton]}>
                  <AppText style={styles.cancelLabel}>Annuler</AppText>
                </Pressable>
                {copy.confirmLabel ? (
                  <Pressable accessibilityRole="button" accessibilityState={{ disabled: processing }} disabled={processing} onPress={() => { void confirmAction(); }} style={[styles.dialogButton, copy.destructive ? styles.destructiveButton : styles.confirmButton, processing && styles.disabledButton]}>
                    <AppText style={styles.confirmLabel}>{processing ? 'Connexion…' : copy.confirmLabel}</AppText>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </Screen>
  );
}

function PreferenceRow({ icon: Icon, title, detail, value, disabled = false, onPress }: { icon: typeof Bell; title: string; detail: string; value: boolean; disabled?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="switch" accessibilityState={{ checked: value, disabled }} disabled={disabled} onPress={onPress} style={[styles.row, disabled && styles.disabledRow]}><View style={styles.icon}><Icon size={17} color={colors.plum} /></View><View style={{ flex: 1, gap: 2 }}><AppText style={styles.rowTitle}>{title}</AppText><AppText style={styles.rowDetail}>{detail}</AppText></View><View style={[styles.switch, value && styles.switchOn]}><View style={[styles.thumb, value && styles.thumbOn]} /></View></Pressable>;
}

const styles = StyleSheet.create({
  content: { gap: 15, paddingTop: 6 },
  heading: { gap: 5 },
  title: { fontFamily: 'Georgia', fontSize: 26, color: colors.ink },
  subtitle: { color: colors.muted, fontSize: 12 },
  panel: { padding: 14, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 54, gap: 10 },
  disabledRow: { opacity: 0.55 },
  icon: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.paleLavender, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 12, fontWeight: '700' },
  rowDetail: { color: colors.muted, fontSize: 10, lineHeight: 14 },
  divider: { height: 1, backgroundColor: colors.line },
  switch: { width: 43, height: 25, padding: 3, borderRadius: 14, justifyContent: 'center', backgroundColor: '#DAD4DF' },
  switchOn: { backgroundColor: colors.plum },
  thumb: { width: 19, height: 19, borderRadius: 10, backgroundColor: colors.white },
  thumbOn: { alignSelf: 'flex-end' },
  privacyLink: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  privacyIcon: { width: 35, height: 35, borderRadius: 12, backgroundColor: colors.paleLavender, alignItems: 'center', justifyContent: 'center' },
  note: { color: colors.muted, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  modalRoot: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 22, backgroundColor: 'rgba(35, 24, 48, 0.42)' },
  dialog: { width: '100%', maxWidth: 420, gap: 14, padding: 22, borderRadius: radius.lg, backgroundColor: colors.white },
  dialogTitle: { fontFamily: 'Georgia', fontSize: 20, lineHeight: 26, fontWeight: '600', color: colors.ink },
  dialogDescription: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  dialogError: { padding: 10, borderRadius: radius.sm, backgroundColor: '#FCEBEC', color: '#9B3239', fontSize: 12, lineHeight: 18 },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 9, marginTop: 3 },
  dialogButton: { minHeight: 44, minWidth: 100, paddingHorizontal: 15, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  cancelButton: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  confirmButton: { backgroundColor: colors.plum },
  destructiveButton: { backgroundColor: '#A83F4A' },
  cancelLabel: { color: colors.plum, fontSize: 13, fontWeight: '700' },
  confirmLabel: { color: colors.white, fontSize: 13, fontWeight: '700' },
  disabledButton: { opacity: 0.55 },
});
