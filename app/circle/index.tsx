import { router } from 'expo-router';
import { ArrowRight, HeartHandshake, ShieldCheck, UsersRound } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Eyebrow, Panel, Screen, Tag, TopBar } from '@/components/ui/Primitives';
import { circles } from '@/constants/mockData';
import { colors } from '@/constants/theme';
import { useAppData } from '@/hooks/useAppData';

export default function CircleScreen() {
  const { joinedCircles, toggleCircle } = useAppData();
  return (
    <Screen contentStyle={styles.content}>
      <TopBar title="HerCircle" back />
      <View style={styles.heading}><Eyebrow>ENSEMBLE, À NOTRE FAÇON</Eyebrow><AppText style={styles.title}>Tu n’es pas seule.</AppText><AppText style={styles.subtitle}>Des espaces entre étudiantes, autour de sujets qui nous rassemblent.</AppText></View>
      <View style={styles.safety}><ShieldCheck size={16} color={colors.green} /><AppText style={styles.safetyText}>Contenus et nombres de participantes simulés. Tes check-ins et ton journal ne sont jamais partagés ici.</AppText></View>
      {circles.map((circle) => {
        const joined = joinedCircles.includes(circle.id);
        return <Panel key={circle.id} style={styles.circleCard}>
          <View style={[styles.illustration, { backgroundColor: circle.tone }]}><View style={styles.circleOrb} /><View style={[styles.person, { left: 21 }]} /><View style={[styles.person, { left: 42, top: 28 }]} /><View style={[styles.person, { left: 60, top: 19 }]} /><HeartHandshake size={18} color={colors.plum} style={styles.heartIcon} /></View>
          <View style={{ flex: 1, gap: 6 }}><View style={styles.titleRow}><AppText style={styles.circleName}>{circle.name}</AppText>{joined ? <Tag tint={colors.paleGreen} textColor="#557D61">Rejointe</Tag> : null}</View><AppText style={styles.circleDesc}>{circle.description}</AppText><View style={styles.cardFooter}><View style={styles.people}><UsersRound size={12} color={colors.muted} /><AppText style={styles.peopleText}>~{circle.members} · démo</AppText></View><View style={styles.buttons}><Pressable accessibilityRole="button" onPress={() => toggleCircle(circle.id)} style={[styles.joinButton, joined && styles.leaveButton]}><AppText style={[styles.joinText, joined && { color: colors.plum }]}>{joined ? 'Quitter' : 'Rejoindre'}</AppText></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Voir ${circle.name}`} onPress={() => router.push(`/circle/${circle.id}`)} style={styles.open}><ArrowRight size={15} color={colors.white} /></Pressable></View></View></View>
        </Panel>;
      })}
      <AppText style={styles.disclaimer}>Pas de messagerie privée entre inconnues dans cette démo. Tu peux quitter un cercle à tout moment.</AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 13, paddingTop: 6 },
  heading: { gap: 5 },
  title: { fontFamily: 'Georgia', fontSize: 27, color: colors.ink },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  safety: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, backgroundColor: colors.paleGreen, borderRadius: 14 },
  safetyText: { flex: 1, fontSize: 10, color: '#557D61', lineHeight: 15 },
  circleCard: { flexDirection: 'row', gap: 12, padding: 13 },
  illustration: { width: 82, height: 91, borderRadius: 17, overflow: 'hidden', justifyContent: 'center' },
  circleOrb: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.52)', alignSelf: 'center' },
  person: { position: 'absolute', bottom: 27, width: 15, height: 18, borderRadius: 8, backgroundColor: colors.plum },
  heartIcon: { position: 'absolute', bottom: 6, right: 7 },
  titleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5 },
  circleName: { fontSize: 13, fontWeight: '700', flexShrink: 1 },
  circleDesc: { color: colors.muted, fontSize: 10, lineHeight: 15 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  people: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  peopleText: { color: colors.muted, fontSize: 9 },
  buttons: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  joinButton: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, backgroundColor: colors.paleLavender },
  leaveButton: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  joinText: { fontSize: 10, fontWeight: '700', color: colors.plum },
  open: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.plum, alignItems: 'center', justifyContent: 'center' },
  disclaimer: { textAlign: 'center', color: colors.muted, fontSize: 10, lineHeight: 15, paddingHorizontal: 10 },
});
