import { BookHeart, CalendarHeart, Sparkles, Trash2 } from 'lucide-react-native';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Eyebrow, Panel, Screen, SectionHeader, Tag, TopBar } from '@/components/ui/Primitives';
import { demoJourney, moodOptions, recommendations } from '@/constants/mockData';
import { colors } from '@/constants/theme';
import { useAppData } from '@/hooks/useAppData';

export default function JourneyScreen() {
  const { moods, journals, deleteJournal, completedActions } = useAppData();
  const count = moods.length;
  const weekMoods = moods.filter((entry) => Date.now() - new Date(entry.createdAt).getTime() <= 7 * 24 * 60 * 60 * 1000);
  const frequentMoods = moodOptions.map((option) => ({ ...option, count: moods.filter((entry) => entry.mood === option.id).length })).filter((option) => option.count > 0).sort((a, b) => b.count - a.count);
  return (
    <Screen contentStyle={styles.content}>
      <TopBar title="Mon parcours" back />
      <View style={styles.heading}><Eyebrow>TON HISTOIRE, TON RYTHME</Eyebrow><AppText style={styles.title}>Tu avances comme tu peux.</AppText><AppText style={styles.subtitle}>Ici, il n’y a pas de score ni de bonne façon de ressentir.</AppText></View>
      <Panel style={styles.summary}><View style={styles.summaryHead}><View style={styles.summaryIcon}><CalendarHeart size={18} color={colors.plum} /></View><View style={{ flex: 1 }}><AppText style={styles.summaryTitle}>Tes ressentis notés</AppText><AppText style={styles.summarySub}>{count ? `${weekMoods.length} moment${weekMoods.length === 1 ? '' : 's'} cette semaine · ${count} au total` : 'Tes prochains check-ins apparaîtront ici.'}</AppText></View><Tag tint={count ? colors.paleGreen : colors.paleLavender}>{count ? 'À toi' : 'Vide'}</Tag></View>
        {count ? <View style={styles.moodList}>{moods.slice(0, 7).map((entry) => { const option = moodOptions.find((item) => item.id === entry.mood); return <View key={entry.id} style={styles.moodItem}><View style={[styles.moodDot, { backgroundColor: option?.tint }]} /><AppText style={styles.moodName}>{option?.label ?? 'Ressenti'}</AppText><AppText style={styles.moodDate}>{new Date(entry.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</AppText></View>; })}</View> : <AppText style={styles.empty}>Pas encore de check-in personnel. Tu peux commencer quand tu en as envie.</AppText>}
        {frequentMoods.length ? <View style={styles.frequencyBlock}><AppText style={styles.frequencyLabel}>Ressentis les plus notés</AppText><View style={styles.moodList}>{frequentMoods.slice(0, 3).map((option) => <View key={option.id} style={styles.moodItem}><View style={[styles.moodDot, { backgroundColor: option.tint }]} /><AppText style={styles.moodName}>{option.label} · {option.count}</AppText></View>)}</View></View> : null}
      </Panel>
      <SectionHeader title="Tes mots à toi" />
      {journals.length ? journals.map((entry) => <Panel key={entry.id} style={styles.journalCard}><View style={styles.journalTop}><BookHeart size={16} color={colors.plum} /><AppText style={styles.journalDate}>{new Date(entry.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</AppText>{entry.intensity ? <Tag>Intensité {entry.intensity}/5</Tag> : null}<Pressable accessibilityLabel="Supprimer cette note" onPress={() => Alert.alert('Supprimer cette note ?', 'Elle sera effacée de ton appareil.', [{ text: 'Garder', style: 'cancel' }, { text: 'Supprimer', style: 'destructive', onPress: () => deleteJournal(entry.id) }])} style={styles.delete}><Trash2 size={15} color="#B75C78" /></Pressable></View><AppText style={styles.journalText}>{entry.text}</AppText></Panel>) : <Panel style={styles.emptyPanel}><BookHeart size={21} color={colors.lavender} /><AppText style={styles.empty}>Les notes écrites dans Ton moment à toi apparaîtront ici, et restent supprimables par toi.</AppText></Panel>}
      <SectionHeader title="Les petits pas que tu as faits" />
      {completedActions.length ? <Panel style={styles.demoEntry}>{completedActions.map((id) => { const action = recommendations.find((item) => item.id === id); return action ? <View key={id} style={styles.completedRow}><View style={styles.completedDot} /><AppText style={styles.completedText}>{action.title}</AppText></View> : null; })}</Panel> : <AppText style={styles.empty}>Les actions terminées apparaîtront ici, sans compteur ni série à maintenir.</AppText>}
      <SectionHeader title="Exemples de parcours" />
      <View style={styles.demoBanner}><Sparkles size={14} color={colors.plum} /><AppText style={styles.demoBannerText}>Exemples de démonstration · ne représentent pas ton historique</AppText></View>
      {demoJourney.map((item) => <Panel key={item.title} style={styles.demoEntry}><View style={styles.demoTop}><AppText style={styles.demoTitle}>{item.title}</AppText><Tag tint="#F6F2F9">{item.date}</Tag></View><AppText style={styles.journalText}>{item.text}</AppText></Panel>)}
      <View style={styles.footer}><AppText style={styles.footerText}>Tes entrées sont stockées localement dans ce prototype. Aucun partage automatique.</AppText></View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingTop: 6 },
  heading: { gap: 5 },
  title: { fontFamily: 'Georgia', fontSize: 26, lineHeight: 32, color: colors.ink },
  subtitle: { fontSize: 12, color: colors.muted, lineHeight: 18 },
  summary: { padding: 15, gap: 13 },
  summaryHead: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  summaryIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.paleLavender, alignItems: 'center', justifyContent: 'center' },
  summaryTitle: { fontSize: 13, fontWeight: '700' },
  summarySub: { fontSize: 10, color: colors.muted, marginTop: 3 },
  frequencyBlock: { gap: 7, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 11 },
  frequencyLabel: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  moodList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moodItem: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 8, backgroundColor: '#F8F5FA', borderRadius: 12 },
  moodDot: { width: 8, height: 8, borderRadius: 4 },
  moodName: { fontSize: 10, color: colors.ink, fontWeight: '600' },
  moodDate: { fontSize: 9, color: colors.muted },
  empty: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  journalCard: { padding: 14, gap: 8 },
  journalTop: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  journalDate: { flex: 1, color: colors.muted, fontSize: 10 },
  delete: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#FCEEF1', alignItems: 'center', justifyContent: 'center' },
  journalText: { color: colors.ink, fontSize: 13, lineHeight: 20 },
  emptyPanel: { alignItems: 'center', gap: 8, padding: 18 },
  demoBanner: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, paddingVertical: 9, borderRadius: 13, backgroundColor: colors.paleLavender },
  demoBannerText: { flex: 1, color: colors.violet, fontSize: 10, lineHeight: 15 },
  demoEntry: { padding: 14, gap: 8 },
  demoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  demoTitle: { fontSize: 13, fontWeight: '700' },
  completedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  completedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
  completedText: { color: colors.ink, fontSize: 12 },
  footer: { padding: 8 },
  footerText: { textAlign: 'center', color: colors.muted, fontSize: 10, lineHeight: 15 },
});
