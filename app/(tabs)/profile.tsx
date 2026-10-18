import { router } from 'expo-router';
import { Bell, BookHeart, ChevronRight, CircleHelp, Globe2, Heart, LockKeyhole, Settings, ShieldCheck, Sparkles, Trash2, UserRound } from 'lucide-react-native';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, Panel, Screen, Tag, TopBar } from '@/components/ui/Primitives';
import { colors } from '@/constants/theme';
import { useAppData } from '@/hooks/useAppData';
import { clearRemoteChatHistory, deleteRemoteAccount } from '@/services/api';
import type { Language } from '@/types';

const languages: Language[] = ['Français', 'Darija tunisienne', 'العربية'];

export default function ProfileScreen() {
  const { preferences, updatePreferences, setLanguage, clearHistory, deleteLocalData } = useAppData();
  const toggleNotifications = () => updatePreferences({ notificationsEnabled: !preferences.notificationsEnabled });
  const togglePin = () => updatePreferences({ pinPrototypeEnabled: !preferences.pinPrototypeEnabled });

  const clearHistoryEverywhere = async () => {
    await clearHistory();
    if (preferences.cloudHistoryEnabled) {
      try {
        await clearRemoteChatHistory();
      } catch (error) {
        Alert.alert('Historique local effacé', error instanceof Error ? `La suppression serveur reste à confirmer : ${error.message}` : 'Le serveur n’a pas pu être contacté.');
      }
    }
  };
  const deleteDataEverywhere = async () => {
    try {
      await deleteRemoteAccount();
      await deleteLocalData();
    } catch (error) {
      Alert.alert('Suppression non terminée', error instanceof Error ? error.message : 'Le serveur n’a pas pu être contacté; réessaie pour supprimer aussi les données serveur.');
    }
  };
  const askClear = () => Alert.alert('Effacer ton historique ?', 'Tes notes et humeurs seront supprimées de cet appareil. Si tu as activé l’historique serveur, les conversations qui y sont stockées seront aussi effacées.', [{ text: 'Annuler', style: 'cancel' }, { text: 'Effacer', style: 'destructive', onPress: () => { void clearHistoryEverywhere(); } }]);
  const askDelete = () => Alert.alert('Supprimer toutes tes données ?', 'Cette action supprime tes données locales, ton compte anonyme et son historique serveur si le serveur est configuré.', [{ text: 'Annuler', style: 'cancel' }, { text: 'Tout supprimer', style: 'destructive', onPress: () => { void deleteDataEverywhere(); } }]);

  return (
    <Screen contentStyle={styles.content}>
      <TopBar title="Mon espace" />
      <View style={styles.profileHead}><View style={styles.avatar}><UserRound size={27} color={colors.plum} /></View><View style={{ flex: 1, gap: 3 }}><AppText style={styles.name}>{preferences.pseudonym}</AppText><AppText style={styles.profileSub}>Un espace personnel, à ton rythme</AppText></View><Tag tint={colors.paleGreen} textColor="#557D61">Local</Tag></View>
      <Panel style={styles.prefPanel}><View style={styles.sectionTop}><Globe2 size={17} color={colors.plum} /><AppText style={styles.sectionTitle}>Ta langue</AppText></View><View style={styles.languageRow}>{languages.map((language) => <Pressable key={language} onPress={() => setLanguage(language)} style={[styles.langOption, preferences.language === language && styles.langSelected]}><AppText style={[styles.langText, preferences.language === language && styles.langTextActive]}>{language}</AppText></Pressable>)}</View></Panel>
      <Panel style={styles.prefPanel}><View style={styles.sectionTop}><Heart size={17} color={colors.plum} /><AppText style={styles.sectionTitle}>Ton accompagnement</AppText></View>
        <SettingRow title="Notifications douces" detail="Rappels facultatifs" icon={Bell} value={Boolean(preferences.notificationsEnabled)} onToggle={toggleNotifications} />
        <View style={styles.divider} />
        <View style={styles.prefHint}><AppText style={styles.prefLabel}>Style préféré</AppText><AppText style={styles.prefValue}>{preferences.supportStyle}</AppText></View>
        {preferences.goals.length ? <View style={styles.goalTags}>{preferences.goals.slice(0, 3).map((goal) => <Tag key={goal}>{goal}</Tag>)}</View> : null}
      </Panel>
      <Panel style={styles.prefPanel}><View style={styles.sectionTop}><ShieldCheck size={17} color={colors.plum} /><AppText style={styles.sectionTitle}>Vie privée et sécurité</AppText></View>
        <SettingRow title="Verrouillage par code" detail="Prototype visuel, ne protège pas encore l’app" icon={LockKeyhole} value={Boolean(preferences.pinPrototypeEnabled)} onToggle={togglePin} />
        <View style={styles.divider} />
        <MenuRow title="Confidentialité et aide" detail="Comprendre tes données et les limites" icon={ShieldCheck} onPress={() => router.push('/privacy')} />
      </Panel>
      <Panel style={styles.prefPanel}><MenuRow title="Réglages" detail="Notifications et verrouillage prototype" icon={Settings} onPress={() => router.push('/settings')} /><View style={styles.divider} /><MenuRow title="Mon parcours" detail="Tes ressentis et notes enregistrées" icon={BookHeart} onPress={() => router.push('/journey')} /><View style={styles.divider} /><MenuRow title="Découvrir HerCircle" detail="Espaces de discussion simulés" icon={Sparkles} onPress={() => router.push('/circle')} /><View style={styles.divider} /><MenuRow title="Aide et sécurité" detail="À propos de HERmind" icon={CircleHelp} onPress={() => router.push('/privacy')} /></Panel>
      <View style={{ gap: 9 }}><Button title="Effacer mon historique" icon={Trash2} variant="outline" onPress={askClear} /><Button title="Supprimer toutes mes données locales" variant="text" onPress={askDelete} /></View>
      <AppText style={styles.version}>HERmind Bloom · Prototype frontend · v0.1</AppText>
    </Screen>
  );
}

function SettingRow({ title, detail, icon: Icon, value, onToggle }: { title: string; detail: string; icon: typeof Bell; value: boolean; onToggle: () => void }) {
  return <View style={styles.settingRow}><View style={styles.rowIcon}><Icon size={16} color={colors.plum} /></View><View style={{ flex: 1, gap: 2 }}><AppText style={styles.rowTitle}>{title}</AppText><AppText style={styles.rowDetail}>{detail}</AppText></View><Pressable accessibilityRole="switch" accessibilityState={{ checked: value }} accessibilityLabel={title} onPress={onToggle} style={[styles.switch, value && styles.switchOn]}><View style={[styles.switchThumb, value && styles.thumbOn]} /></Pressable></View>;
}

function MenuRow({ title, detail, icon: Icon, onPress }: { title: string; detail: string; icon: typeof Bell; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.menuRow}><View style={styles.rowIcon}><Icon size={16} color={colors.plum} /></View><View style={{ flex: 1, gap: 2 }}><AppText style={styles.rowTitle}>{title}</AppText><AppText style={styles.rowDetail}>{detail}</AppText></View><ChevronRight size={17} color={colors.muted} /></Pressable>;
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingTop: 6 },
  profileHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 5 },
  avatar: { width: 57, height: 57, borderRadius: 29, backgroundColor: colors.paleLavender, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: 'Georgia', fontSize: 23, color: colors.ink },
  profileSub: { fontSize: 11, color: colors.muted },
  prefPanel: { padding: 15, gap: 12 },
  sectionTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  languageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  langOption: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  langSelected: { backgroundColor: colors.paleLavender, borderColor: colors.lavender },
  langText: { color: colors.muted, fontSize: 10, fontWeight: '600' },
  langTextActive: { color: colors.plum, fontWeight: '800' },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 48 },
  rowIcon: { width: 31, height: 31, borderRadius: 11, backgroundColor: colors.paleLavender, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 12, fontWeight: '700' },
  rowDetail: { fontSize: 10, lineHeight: 14, color: colors.muted },
  switch: { width: 43, height: 25, borderRadius: 13, padding: 3, backgroundColor: '#DAD4DF', justifyContent: 'center' },
  switchOn: { backgroundColor: colors.plum },
  switchThumb: { width: 19, height: 19, borderRadius: 10, backgroundColor: colors.white },
  thumbOn: { alignSelf: 'flex-end' },
  divider: { height: 1, backgroundColor: '#F0ECF2' },
  prefHint: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'center' },
  prefLabel: { color: colors.muted, fontSize: 11 },
  prefValue: { color: colors.ink, fontSize: 11, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  goalTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 47 },
  version: { textAlign: 'center', fontSize: 10, color: colors.muted, paddingVertical: 5 },
});
