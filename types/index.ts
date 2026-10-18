export type Mood = 'bright' | 'steady' | 'mixed' | 'tense' | 'heavy';
export type Language = 'Français' | 'Darija tunisienne' | 'العربية';
export type SupportMode =
  | 'talk'
  | 'act'
  | 'relax'
  | 'a7kili'
  | 'study_plan'
  | 'study_tutor'
  | 'study_quiz'
  | 'success_coach';
export type EventKind = 'Examen' | 'PFE' | 'Stage' | 'Entretien' | 'Autre';

export interface Preferences {
  onboardingComplete: boolean;
  pseudonym: string;
  language: Language;
  goals: string[];
  supportStyle: string;
  notificationsEnabled: boolean;
  pinPrototypeEnabled: boolean;
  remoteChatEnabled: boolean;
  cloudHistoryEnabled: boolean;
}

export interface AcademicEvent {
  id: string;
  title: string;
  kind: EventKind;
  date: string;
  note?: string;
  demo?: boolean;
}

export interface JournalEntry {
  id: string;
  text: string;
  createdAt: string;
  mood?: Mood;
  intensity?: number;
}

export interface MoodEntry {
  id: string;
  mood: Mood;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'companion';
  text: string;
}

export interface Circle {
  id: string;
  name: string;
  description: string;
  members: number;
  tone: string;
}
