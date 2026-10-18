import { Heart, LockKeyhole, ShieldCheck, UserRound, UsersRound } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText, Panel, Screen, TopBar } from '@/components/ui/Primitives';
import { colors } from '@/constants/theme';
import { useAppData } from '@/hooks/useAppData';

export default function PrivacyScreen() {
  const { preferences } = useAppData();
  const principles = [
    { icon: Heart, title: 'Un soutien, pas un diagnostic', body: 'HERmind propose un espace de réflexion et de soutien. Ce prototype ne fournit aucun diagnostic ni conseil médical.' },
    { icon: LockKeyhole, title: 'Tes mots t’appartiennent', body: preferences.remoteChatEnabled
      ? `Tes check-ins, notes et journaux restent sur cet appareil et ne sont pas transmis. Tes messages, ton pseudonyme, ta langue et tes thèmes sont envoyés au serveur HERmind. L’historique serveur est ${preferences.cloudHistoryEnabled ? 'conservé avec ton accord' : 'désactivé par défaut'}; tu peux l’effacer depuis ton profil. Le prototype n’ajoute pas encore de chiffrement applicatif aux messages stockés : utilise uniquement des données de test.`
      : 'Les check-ins, notes et échanges restent localement dans la démo. Tu peux effacer ton historique depuis ton profil.' },
    { icon: UsersRound, title: 'La communauté est facultative', body: 'Les cercles présentés sont simulés. Aucune entrée de journal ni humeur n’est partagée avec eux.' },
    { icon: ShieldCheck, title: preferences.remoteChatEnabled ? 'IA connectée, réponse non clinique' : 'IA simulée', body: preferences.remoteChatEnabled
      ? 'Les messages et le contexte de conversation sont traités par le serveur HERmind et le fournisseur IA configuré. Les réponses peuvent être incorrectes; elles ne constituent ni un diagnostic ni un avis médical.'
      : 'Les échanges et reflets émotionnels utilisent des réponses locales de démonstration. Aucun service IA ni backend n’est contacté.' },
  ];

  return (
    <Screen contentStyle={styles.content}>
      <TopBar title="Confidentialité et aide" back />
      <View style={styles.heading}><AppText style={styles.title}>Un espace qui respecte tes limites.</AppText><AppText style={styles.subtitle}>Tu choisis ce que tu partages, ce que tu gardes et ce que tu effaces.</AppText></View>
      {principles.map(({ icon: Icon, title, body }) => <Panel key={title} style={styles.principle}><View style={styles.icon}><Icon size={18} color={colors.plum} /></View><View style={{ flex: 1, gap: 4 }}><AppText style={styles.principleTitle}>{title}</AppText><AppText style={styles.body}>{body}</AppText></View></Panel>)}
      <Panel style={styles.support}><AppText style={styles.supportTitle}>Si tu traverses un moment difficile</AppText><AppText style={styles.body}>Tu mérites d’être accompagnée par une vraie personne. Parle à quelqu’un de confiance ou à un professionnel de santé. En cas de danger immédiat, contacte les services d’urgence locaux ou une ressource d’aide vérifiée dans ta région.</AppText></Panel>
      <View style={styles.footer}><UserRound size={14} color={colors.muted} /><AppText style={styles.footerText}>Le verrouillage par code est une maquette visuelle et ne protège pas encore l’application.</AppText></View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 13, paddingTop: 6 },
  heading: { gap: 6, marginBottom: 2 },
  title: { fontFamily: 'Georgia', fontSize: 26, lineHeight: 32, color: colors.ink },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  principle: { flexDirection: 'row', gap: 11, padding: 14 },
  icon: { width: 37, height: 37, borderRadius: 13, backgroundColor: colors.paleLavender, alignItems: 'center', justifyContent: 'center' },
  principleTitle: { fontSize: 13, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  support: { gap: 7, padding: 16, backgroundColor: '#FFF1E8' },
  supportTitle: { fontFamily: 'Georgia', fontSize: 17, color: colors.ink },
  footer: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, padding: 7 },
  footerText: { flex: 1, color: colors.muted, fontSize: 10, lineHeight: 15 },
});
