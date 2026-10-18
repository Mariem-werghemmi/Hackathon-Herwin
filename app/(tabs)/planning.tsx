import { CalendarDays, Clock3, Pencil, Plus, Sparkles, Trash2, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { AppText, Button, Eyebrow, Panel, Screen, SectionHeader, Tag, TopBar } from '@/components/ui/Primitives';
import { demoEvents } from '@/constants/mockData';
import { colors } from '@/constants/theme';
import { useAppData } from '@/hooks/useAppData';
import type { AcademicEvent, EventKind } from '@/types';

const kinds: EventKind[] = ['Examen', 'PFE', 'Stage', 'Entretien', 'Autre'];
const stress = [25, 48, 39, 61, 44, 72, 54, 35, 59, 45, 68, 41, 32, 51];
const daysFromToday = (count: number) => Array.from({ length: count }, (_, index) => { const date = new Date(); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() + index); return date.toISOString().slice(0, 10); });

export default function PlanningScreen() {
  const { events, addEvent, updateEvent, deleteEvent } = useAppData();
  const [period, setPeriod] = useState<7 | 14>(7);
  const dates = useMemo(() => daysFromToday(period), [period]);
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AcademicEvent | null>(null);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<EventKind>('Examen');
  const [date, setDate] = useState(selectedDate);
  const [note, setNote] = useState('');
  const combined = [...events, ...demoEvents].sort((a, b) => a.date.localeCompare(b.date));
  const dailyEvents = combined.filter((item) => item.date === selectedDate);

  const openCreate = () => { setEditing(null); setTitle(''); setKind('Examen'); setDate(selectedDate); setNote(''); setModalOpen(true); };
  const openEdit = (event: AcademicEvent) => { setEditing(event); setTitle(event.title); setKind(event.kind); setDate(event.date); setNote(event.note ?? ''); setModalOpen(true); };
  const save = () => {
    if (!title.trim()) return Alert.alert('Ajoute un titre', 'Donne un nom à ce rendez-vous.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return Alert.alert('Date invalide', 'Utilise le format AAAA-MM-JJ.');
    const value = { title: title.trim(), kind, date, note: note.trim() || undefined };
    if (editing) updateEvent({ ...value, id: editing.id }); else addEvent(value);
    setSelectedDate(date);
    setModalOpen(false);
  };

  return (
    <Screen contentStyle={styles.content}>
      <TopBar title="Mon planning" right={<Pressable accessibilityRole="button" accessibilityLabel="Ajouter un événement" onPress={openCreate} style={styles.addButton}><Plus size={19} color={colors.white} /></Pressable>} />
      <View style={styles.heading}><AppText style={styles.title}>Prépare-toi en douceur.</AppText><AppText style={styles.subtitle}>Un pas après l’autre, à ton rythme.</AppText></View>
      <View style={styles.periodControl}>{([7, 14] as const).map((value) => <Pressable key={value} onPress={() => { setPeriod(value); const nextDates = daysFromToday(value); setSelectedDate(nextDates[0]); }} style={[styles.periodButton, period === value && styles.periodActive]}><AppText style={[styles.periodText, period === value && styles.periodTextActive]}>{value === 7 ? '7 jours' : '14 jours'}</AppText></Pressable>)}</View>
      <View style={styles.dateStrip}>{dates.map((item, index) => { const dateValue = new Date(`${item}T12:00:00`); const active = item === selectedDate; const hasEvent = combined.some((event) => event.date === item); return <Pressable key={item} onPress={() => setSelectedDate(item)} style={[styles.dateCell, active && styles.dateActive]}><AppText style={[styles.dateDay, active && styles.dateTextActive]}>{index === 0 ? 'Auj.' : dateValue.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 2)}</AppText><AppText style={[styles.dateNum, active && styles.dateTextActive]}>{dateValue.getDate()}</AppText><View style={[styles.dateDot, hasEvent && { backgroundColor: active ? colors.white : colors.rose }]} /></Pressable>; })}</View>
      <Panel style={styles.forecast}>
        <View style={styles.forecastHeader}><View><Eyebrow>INDICATEURS DE CHARGE</Eyebrow><AppText style={styles.forecastTitle}>Prévision de démonstration</AppText></View><Tag tint={colors.palePeach}>Non clinique</Tag></View>
        <Svg width="100%" height={114} viewBox="0 0 300 114" preserveAspectRatio="none">
          {[25, 55, 85].map((y) => <Line key={y} x1="6" y1={y} x2="294" y2={y} stroke="#EAE3F0" strokeWidth="1" />)}
          <Polyline points={stress.slice(0, period).map((value, index) => `${8 + index * (284 / (period - 1))},${98 - value * 0.8}`).join(' ')} fill="none" stroke={colors.plum} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {stress.slice(0, period).map((value, index) => <Circle key={index} cx={8 + index * (284 / (period - 1))} cy={98 - value * 0.8} r="3.5" fill={colors.white} stroke={colors.plum} strokeWidth="2" />)}
        </Svg>
        <View style={styles.forecastLegend}><Sparkles size={13} color={colors.plum} /><AppText style={styles.forecastNote}>Valeurs illustratives, sans données personnelles ni prédiction clinique.</AppText></View>
      </Panel>
      <SectionHeader title={new Date(`${selectedDate}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} action="Ajouter" onPress={openCreate} />
      {dailyEvents.length === 0 ? <Panel style={styles.empty}><CalendarDays size={20} color={colors.lavender} /><AppText style={styles.emptyText}>Rien de prévu ce jour-là. Tu peux le garder libre.</AppText></Panel> : dailyEvents.map((event) => <EventCard key={event.id} event={event} onEdit={() => openEdit(event)} onDelete={() => Alert.alert('Supprimer cet événement ?', 'Cette action concerne uniquement ton planning local.', [{ text: 'Garder', style: 'cancel' }, { text: 'Supprimer', style: 'destructive', onPress: () => deleteEvent(event.id) }])} />)}
      <SectionHeader title="À venir" />
      {combined.slice(0, 5).map((event) => <EventCard key={`upcoming-${event.id}`} event={event} onEdit={() => openEdit(event)} onDelete={() => Alert.alert('Supprimer cet événement ?', 'Cette action concerne uniquement ton planning local.', [{ text: 'Garder', style: 'cancel' }, { text: 'Supprimer', style: 'destructive', onPress: () => deleteEvent(event.id) }])} />)}
      <SectionHeader title="À garder en tête" />
      <Panel style={styles.tip}><View style={styles.tipIcon}><Clock3 size={17} color={colors.plum} /></View><View style={{ flex: 1, gap: 4 }}><AppText style={styles.tipTitle}>Découpe la préparation</AppText><AppText style={styles.tipText}>Un petit bloc de révision ou une répétition suffit pour commencer.</AppText></View></Panel>
      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalShade}><View style={styles.modal}>
          <View style={styles.modalTop}><AppText style={styles.modalTitle}>{editing ? 'Modifier le rendez-vous' : 'Ajouter au planning'}</AppText><Pressable accessibilityLabel="Fermer" onPress={() => setModalOpen(false)} style={styles.close}><X size={18} color={colors.ink} /></Pressable></View>
          <AppText style={styles.fieldLabel}>Titre</AppText><TextInput value={title} onChangeText={setTitle} placeholder="Ex. Examen de marketing" style={styles.field} placeholderTextColor={colors.muted} />
          <AppText style={styles.fieldLabel}>Type</AppText><View style={styles.kindRow}>{kinds.map((item) => <Pressable key={item} onPress={() => setKind(item)} style={[styles.kindChip, kind === item && styles.kindSelected]}><AppText style={[styles.kindText, kind === item && { color: colors.white }]}>{item}</AppText></Pressable>)}</View>
          <AppText style={styles.fieldLabel}>Date · AAAA-MM-JJ</AppText><TextInput value={date} onChangeText={setDate} placeholder="2026-10-24" style={styles.field} autoCapitalize="none" />
          <AppText style={styles.fieldLabel}>Note (facultative)</AppText><TextInput value={note} onChangeText={setNote} placeholder="Une petite précision…" style={[styles.field, { minHeight: 68 }]} multiline />
          <View style={styles.modalActions}><Button title="Annuler" variant="outline" onPress={() => setModalOpen(false)} style={{ flex: 1 }} /><Button title="Enregistrer" onPress={save} style={{ flex: 1 }} /></View>
        </View></View>
      </Modal>
    </Screen>
  );
}

function EventCard({ event, onEdit, onDelete }: { event: AcademicEvent; onEdit: () => void; onDelete: () => void }) {
  const formattedDate = new Date(`${event.date}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  return <Panel style={styles.eventCard}><View style={styles.eventMark} /><View style={{ flex: 1, gap: 4 }}><View style={styles.eventTitleRow}><AppText style={styles.eventTitle}>{event.title}</AppText><Tag tint={event.demo ? colors.palePeach : colors.paleLavender}>{event.demo ? 'Exemple' : event.kind}</Tag></View><AppText style={styles.eventNote}>{formattedDate}{event.note ? ` · ${event.note}` : ''}</AppText></View>{!event.demo ? <View style={styles.eventActions}><Pressable accessibilityLabel="Modifier" onPress={onEdit} style={styles.actionIcon}><Pencil size={14} color={colors.plum} /></Pressable><Pressable accessibilityLabel="Supprimer" onPress={onDelete} style={styles.actionIcon}><Trash2 size={14} color="#B75C78" /></Pressable></View> : null}</Panel>;
}

const styles = StyleSheet.create({
  content: { gap: 14, paddingTop: 5 },
  addButton: { width: 37, height: 37, borderRadius: 19, backgroundColor: colors.plum, alignItems: 'center', justifyContent: 'center' },
  heading: { gap: 4 },
  title: { fontFamily: 'Georgia', fontSize: 26, lineHeight: 32, color: colors.ink, fontWeight: '600' },
  subtitle: { color: colors.muted, fontSize: 13 },
  periodControl: { flexDirection: 'row', padding: 4, borderRadius: 15, backgroundColor: '#EEE9F2', alignSelf: 'flex-start' },
  periodButton: { minWidth: 74, alignItems: 'center', paddingVertical: 7, borderRadius: 12 },
  periodActive: { backgroundColor: colors.white },
  periodText: { fontSize: 11, color: colors.muted, fontWeight: '600' },
  periodTextActive: { color: colors.plum, fontWeight: '800' },
  dateStrip: { flexDirection: 'row', gap: 5, justifyContent: 'space-between' },
  dateCell: { flex: 1, minWidth: 34, minHeight: 70, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, gap: 2, borderWidth: 1, borderColor: colors.line },
  dateActive: { backgroundColor: colors.plum, borderColor: colors.plum },
  dateDay: { fontSize: 9, color: colors.muted, textTransform: 'capitalize' },
  dateNum: { fontSize: 14, fontWeight: '700', color: colors.ink },
  dateTextActive: { color: colors.white },
  dateDot: { width: 4, height: 4, borderRadius: 3, backgroundColor: 'transparent' },
  forecast: { padding: 15, gap: 10 },
  forecastHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 },
  forecastTitle: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  forecastLegend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  forecastNote: { color: colors.muted, fontSize: 10, lineHeight: 14, flex: 1 },
  empty: { minHeight: 78, flexDirection: 'row', gap: 9, alignItems: 'center', padding: 15 },
  emptyText: { flex: 1, color: colors.muted, fontSize: 12, lineHeight: 18 },
  eventCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  eventMark: { width: 5, height: 38, borderRadius: 4, backgroundColor: colors.rose },
  eventTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  eventTitle: { fontSize: 13, fontWeight: '700' },
  eventNote: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  eventActions: { gap: 5 },
  actionIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paleLavender, borderRadius: 10 },
  tip: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14 },
  tipIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.paleLavender, alignItems: 'center', justifyContent: 'center' },
  tipTitle: { fontSize: 13, fontWeight: '700' },
  tipText: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  modalShade: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(48,40,61,0.35)' },
  modal: { backgroundColor: colors.cream, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 30, borderTopLeftRadius: 26, borderTopRightRadius: 26, gap: 10 },
  modalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  modalTitle: { fontFamily: 'Georgia', fontSize: 21, color: colors.ink },
  close: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.paleLavender, alignItems: 'center', justifyContent: 'center' },
  fieldLabel: { fontSize: 11, color: colors.muted, fontWeight: '700', marginTop: 2 },
  field: { minHeight: 46, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 13, paddingHorizontal: 12, color: colors.ink, fontSize: 13 },
  kindRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  kindChip: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  kindSelected: { backgroundColor: colors.plum, borderColor: colors.plum },
  kindText: { fontSize: 10, color: colors.violet, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 5 },
});
