import type { AcademicEvent, Circle, Mood, MoodEntry } from '@/types';

export const moodOptions: { id: Mood; label: string; icon: string; tint: string }[] = [
  { id: 'bright', label: 'Légère', icon: 'sun', tint: '#F3D79B' },
  { id: 'steady', label: 'Sereine', icon: 'leaf', tint: '#B7D1B9' },
  { id: 'mixed', label: 'Mitigée', icon: 'cloud-sun', tint: '#C8B8E4' },
  { id: 'tense', label: 'Tendue', icon: 'cloud-lightning', tint: '#EAB6C9' },
  { id: 'heavy', label: 'Lourde', icon: 'cloud-rain', tint: '#B7BED4' },
];

export const demoMoods: MoodEntry[] = [
  { id: 'demo-m1', mood: 'steady', createdAt: '2026-10-12T09:00:00.000Z' },
  { id: 'demo-m2', mood: 'mixed', createdAt: '2026-10-13T09:00:00.000Z' },
  { id: 'demo-m3', mood: 'tense', createdAt: '2026-10-14T09:00:00.000Z' },
  { id: 'demo-m4', mood: 'bright', createdAt: '2026-10-15T09:00:00.000Z' },
  { id: 'demo-m5', mood: 'steady', createdAt: '2026-10-16T09:00:00.000Z' },
  { id: 'demo-m6', mood: 'mixed', createdAt: '2026-10-17T09:00:00.000Z' },
  { id: 'demo-m7', mood: 'steady', createdAt: '2026-10-18T09:00:00.000Z' },
];

export const demoEvents: AcademicEvent[] = [
  { id: 'demo-e1', title: 'Soutenance PFE', kind: 'PFE', date: '2026-10-24', note: 'Répéter les premières diapositives', demo: true },
  { id: 'demo-e2', title: 'Examen de marketing', kind: 'Examen', date: '2026-10-28', note: 'Révision par petits blocs', demo: true },
  { id: 'demo-e3', title: 'Entretien de stage', kind: 'Entretien', date: '2026-11-02', note: 'Préparer quelques exemples', demo: true },
];

export const recommendations = [
  { id: 'breath', title: 'Une respiration pour ralentir', category: 'Pause', duration: '3 min', reason: 'Une courte pause peut t’aider à revenir à l’instant présent.', icon: 'wind' },
  { id: 'slides', title: 'Préparer trois diapositives', category: 'PFE', duration: '15 min', reason: 'Commencer par une petite partie rend le projet plus abordable.', icon: 'presentation' },
  { id: 'write', title: 'Déposer tes pensées sur papier', category: 'Journal', duration: '5 min', reason: 'Mettre les choses en mots peut aider à les démêler.', icon: 'notebook-pen' },
  { id: 'friend', title: 'Prendre des nouvelles d’une amie', category: 'Lien', duration: '2 min', reason: 'Un échange choisi peut apporter un peu de présence.', icon: 'heart-handshake' },
];

export const circles: Circle[] = [
  { id: 'pfe', name: 'PFE w mstressia', description: 'Un espace pour avancer sur son projet sans pression.', members: 128, tone: '#F6DCE8' },
  { id: 'soutenance', name: 'Préparation soutenance', description: 'Répétitions, idées et encouragements entre étudiantes.', members: 86, tone: '#F0EAFB' },
  { id: 'stage', name: 'Premier stage', description: 'Partager les petites victoires du début professionnel.', members: 64, tone: '#EAF3EC' },
  { id: 'confidence', name: 'Confiance en soi', description: 'Se rappeler que chaque parcours a son propre rythme.', members: 102, tone: '#FFF0E7' },
];

export const demoJourney = [
  { title: 'Un pas à la fois', text: 'J’ai commencé les slides même si ce n’était pas parfait.', date: 'Hier', mood: 'steady' as Mood },
  { title: 'Une journée chargée', text: 'Les révisions ont pris toute la place, une pause m’a aidée.', date: 'Il y a 3 jours', mood: 'mixed' as Mood },
];
