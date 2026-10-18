import { router } from 'expo-router';
import { ArrowLeft, Bookmark, Check, CheckCircle2, Clock3, HeartHandshake, NotebookPen, Presentation, Sparkles, Wind } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { BreathingOrb } from '@/components/animations/BreathingOrb';
import { AppText, Button, Eyebrow, Panel, Screen, Tag, TopBar } from '@/components/ui/Primitives';
import { recommendations } from '@/constants/mockData';
import { colors, radius } from '@/constants/theme';
import { useAppData } from '@/hooks/useAppData';

const icons = { wind: Wind, presentation: Presentation, 'notebook-pen': NotebookPen, 'heart-handshake': HeartHandshake } as const;
const actions = recommendations.slice(0, 2);

export default function ActionScreen() {
  const { savedActions, completedActions, toggleSavedAction, completeAction } = useAppData();
  const [active, setActive] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const finish = (id: string, title: string) => {
    completeAction(id);
    setActive(null);
    Alert.alert('Petit pas accompli', `Est-ce que « ${title} » t’a aidée ?`, ['Oui', 'Un peu', 'Pas vraiment'].map((answer) => ({ text: answer, onPress: () => setFeedback((current) => ({ ...current, [id]: answer })) })));
  };

  return (
    <Screen contentStyle={styles.content}>
      <TopBar title="Ton prochain pas" back />
      <View style={styles.heading}><Eyebrow>À TON RYTHME</Eyebrow><AppText style={styles.title}>Un petit pas suffit.</AppText><AppText style={styles.subtitle}>Voici deux idées, choisis celle qui te parle ou garde-les pour plus tard.</AppText></View>
      {actions.map((action) => {
        const Icon = icons[action.icon as keyof typeof icons] ?? Sparkles;
        const isActive = active === action.id;
        const done = completedActions.includes(action.id);
        return <Panel key={action.id} style={styles.card}>
          <View style={styles.cardHead}><View style={styles.actionIcon}><Icon size={20} color={colors.plum} /></View><View style={{ flex: 1, gap: 4 }}><Tag>{action.category}</Tag><AppText style={styles.actionTitle}>{action.title}</AppText></View><Pressable accessibilityRole="button" accessibilityLabel={savedActions.includes(action.id) ? 'Retirer des idées sauvegardées' : 'Garder pour plus tard'} onPress={() => toggleSavedAction(action.id)} style={styles.bookmark}><Bookmark size={17} color={savedActions.includes(action.id) ? colors.plum : colors.muted} fill={savedActions.includes(action.id) ? colors.lavender : 'transparent'} /></Pressable></View>
          <AppText style={styles.reason}>{action.reason}</AppText>
          <View style={styles.duration}><Clock3 size={14} color={colors.muted} /><AppText style={styles.durationText}>{action.duration}</AppText><View style={{ flex: 1 }} />{done ? <Tag tint={colors.paleGreen} textColor="#557D61">Terminée</Tag> : null}</View>
          {isActive ? <View style={styles.activity}>{action.id === 'breath' ? <View style={styles.breathing}><BreathingOrb active /><AppText style={styles.breathingText}>Inspire doucement, puis expire plus longtemps.</AppText></View> : null}<View style={styles.activityHead}><AppText style={styles.activityTitle}>{action.id === 'breath' ? 'Une pause, ici et maintenant' : 'Commence par une seule partie'}</AppText><AppText style={styles.activityText}>{action.id === 'breath' ? 'Inspire tranquillement pendant 4 secondes, puis expire doucement pendant 6. Recommence à ton rythme.' : 'Ouvre ton support, choisis une seule section et travaille dessus pendant quinze minutes. Tu peux t’arrêter ensuite.'}</AppText></View><Button title="J’ai terminé" icon={Check} onPress={() => finish(action.id, action.title)} /></View> : <Button title={done ? 'Refaire ce petit pas' : 'Commencer'} icon={done ? Sparkles : ArrowLeft} onPress={() => setActive(action.id)} />}
          {feedback[action.id] ? <View style={styles.feedback}><CheckCircle2 size={14} color={colors.green} /><AppText style={styles.feedbackText}>Merci, noté : « {feedback[action.id]} ».</AppText></View> : null}
        </Panel>;
      })}
      <View style={styles.note}><Sparkles size={15} color={colors.plum} /><AppText style={styles.noteText}>Ces idées sont des exemples. Elles ne sont pas personnalisées par un modèle entraîné.</AppText></View>
      <Button title="Retour à l’accueil" variant="text" onPress={() => router.replace('/(tabs)/home')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingTop: 6 },
  heading: { gap: 6 },
  title: { fontFamily: 'Georgia', fontSize: 27, color: colors.ink },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  card: { padding: 16, gap: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  actionIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.paleLavender, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontFamily: 'Georgia', fontSize: 17, color: colors.ink, lineHeight: 22 },
  bookmark: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#F8F5FA', alignItems: 'center', justifyContent: 'center' },
  reason: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  duration: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  durationText: { color: colors.muted, fontSize: 11 },
  activity: { gap: 11, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12 },
  activityHead: { gap: 5, backgroundColor: '#F8F5FA', padding: 12, borderRadius: radius.md },
  activityTitle: { fontSize: 13, fontWeight: '700' },
  activityText: { fontSize: 12, lineHeight: 18, color: colors.muted },
  breathing: { alignItems: 'center', gap: 7 },
  breathingText: { color: colors.violet, fontSize: 10, fontWeight: '600' },
  feedback: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  feedbackText: { fontSize: 10, color: colors.muted },
  note: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: colors.paleLavender, padding: 13, borderRadius: radius.md },
  noteText: { flex: 1, color: colors.violet, fontSize: 11, lineHeight: 16 },
});
