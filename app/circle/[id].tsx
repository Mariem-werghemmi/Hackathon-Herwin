import { useLocalSearchParams } from 'expo-router';
import { Flag, Heart, MessageCircle, ShieldCheck, UsersRound } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, Panel, Screen, Tag, TopBar } from '@/components/ui/Primitives';
import { circles } from '@/constants/mockData';
import { colors, radius } from '@/constants/theme';
import { useAppData } from '@/hooks/useAppData';

const posts = [
  { id: 'post-1', name: 'Nour · démo', time: 'Il y a 2 h', text: 'J’ai avancé sur mon plan de soutenance aujourd’hui. Pas tout fini, mais c’est déjà un bon début.' },
  { id: 'post-2', name: 'Salma · démo', time: 'Hier', text: 'Petit rappel entre nous : on a le droit de faire une pause sans l’avoir méritée.' },
  { id: 'post-3', name: 'Inès · démo', time: 'Hier', text: 'Une répétition avec ma cousine m’a aidée à me sentir un peu plus prête.' },
];

export default function CircleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const circle = circles.find((item) => item.id === id) ?? circles[0];
  const { joinedCircles, toggleCircle } = useAppData();
  const [reacted, setReacted] = useState<string[]>([]);
  const joined = joinedCircles.includes(circle.id);
  const report = () => Alert.alert('Signaler le contenu', 'Dans cette démo, aucun message n’est transmis. Une version complète ajoutera une modération et un canal de signalement.', [{ text: 'Compris' }]);

  return (
    <Screen contentStyle={styles.content}>
      <TopBar title="HerCircle" back />
      <View style={[styles.hero, { backgroundColor: circle.tone }]}><View style={styles.heroArt}><View style={styles.heroOrb} /><View style={styles.heroPerson1} /><View style={styles.heroPerson2} /><Heart size={18} color={colors.plum} /></View><View style={{ flex: 1, gap: 6 }}><Tag tint={colors.white}>CERCLE DÉMO</Tag><AppText style={styles.title}>{circle.name}</AppText><AppText style={styles.description}>{circle.description}</AppText></View></View>
      <View style={styles.safety}><ShieldCheck size={15} color={colors.green} /><AppText style={styles.safetyText}>Posts simulés. Pas de messages privés. Ne partage pas d’informations personnelles.</AppText></View>
      <View style={styles.memberRow}><View style={styles.memberCount}><UsersRound size={15} color={colors.plum} /><AppText style={styles.countText}>~{circle.members} participantes · démo</AppText></View><Pressable onPress={() => toggleCircle(circle.id)} style={[styles.joinButton, joined && styles.joined]}><AppText style={[styles.joinText, joined && { color: colors.plum }]}>{joined ? 'Quitter le cercle' : 'Rejoindre'}</AppText></Pressable></View>
      <View style={styles.feedTitle}><AppText style={styles.sectionTitle}>Quelques mots du cercle</AppText><Tag tint={colors.paleLavender}>Simulé</Tag></View>
      {posts.map((post) => { const active = reacted.includes(post.id); return <Panel key={post.id} style={styles.post}><View style={styles.postHead}><View style={styles.postAvatar}><AppText style={styles.postInitial}>{post.name.slice(0, 1)}</AppText></View><View style={{ flex: 1 }}><AppText style={styles.postName}>{post.name}</AppText><AppText style={styles.postTime}>{post.time}</AppText></View><Pressable accessibilityRole="button" accessibilityLabel="Signaler le contenu" onPress={report} style={styles.flag}><Flag size={15} color={colors.muted} /></Pressable></View><AppText style={styles.postText}>{post.text}</AppText><Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => setReacted((current) => active ? current.filter((item) => item !== post.id) : [...current, post.id])} style={styles.reaction}><Heart size={14} color={active ? '#B75C78' : colors.plum} fill={active ? '#E9AFC8' : 'transparent'} /><AppText style={styles.reactionText}>{active ? 'Je me sens proche de ça' : 'Envoyer du soutien'}</AppText><MessageCircle size={13} color={colors.muted} /></Pressable></Panel>; })}
      <Button title="Signaler un problème" variant="outline" icon={Flag} onPress={report} />
      <AppText style={styles.footer}>Les participantes, réactions et contenus sont uniquement des exemples de démonstration.</AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 13, paddingTop: 6 },
  hero: { minHeight: 148, padding: 15, borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroArt: { width: 80, height: 92, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.56)', alignItems: 'center', justifyContent: 'center', gap: 7 },
  heroOrb: { position: 'absolute', width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.58)' },
  heroPerson1: { width: 16, height: 20, borderRadius: 9, position: 'absolute', bottom: 24, left: 20, backgroundColor: colors.plum },
  heroPerson2: { width: 16, height: 20, borderRadius: 9, position: 'absolute', bottom: 24, right: 17, backgroundColor: colors.rose },
  title: { fontFamily: 'Georgia', fontSize: 19, lineHeight: 23, color: colors.ink },
  description: { fontSize: 10, lineHeight: 15, color: colors.violet },
  safety: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, padding: 11, backgroundColor: colors.paleGreen, borderRadius: 13 },
  safetyText: { flex: 1, color: '#557D61', fontSize: 10, lineHeight: 15 },
  memberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  memberCount: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  countText: { color: colors.muted, fontSize: 10 },
  joinButton: { paddingHorizontal: 14, paddingVertical: 9, backgroundColor: colors.plum, borderRadius: 14 },
  joined: { backgroundColor: colors.paleLavender },
  joinText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  feedTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  post: { padding: 14, gap: 10 },
  postHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  postAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.paleLavender, alignItems: 'center', justifyContent: 'center' },
  postInitial: { color: colors.plum, fontWeight: '800' },
  postName: { fontSize: 11, fontWeight: '700' },
  postTime: { fontSize: 9, color: colors.muted },
  flag: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#F8F5FA', alignItems: 'center', justifyContent: 'center' },
  postText: { fontFamily: 'Georgia', fontSize: 15, lineHeight: 22, color: colors.ink },
  reaction: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 7, paddingHorizontal: 9, borderRadius: 12, backgroundColor: '#F8F5FA' },
  reactionText: { color: colors.plum, fontSize: 9, fontWeight: '700' },
  footer: { textAlign: 'center', color: colors.muted, fontSize: 9, lineHeight: 14, paddingHorizontal: 12 },
});
