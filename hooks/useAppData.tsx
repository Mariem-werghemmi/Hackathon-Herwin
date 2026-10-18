import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import type { AcademicEvent, ChatMessage, JournalEntry, Language, Mood, MoodEntry, Preferences } from '@/types';

const keys = {
  preferences: 'hermind.preferences.v1',
  moods: 'hermind.moods.v1',
  journals: 'hermind.journals.v1',
  events: 'hermind.events.v1',
  messages: 'hermind.messages.v1',
  saved: 'hermind.saved-actions.v1',
  completed: 'hermind.completed-actions.v1',
  joined: 'hermind.joined-circles.v1',
} as const;

const defaultPreferences: Preferences = {
  onboardingComplete: false,
  pseudonym: 'Amira',
  language: 'Français',
  goals: [],
  supportStyle: 'Un mélange des trois',
  notificationsEnabled: false,
  pinPrototypeEnabled: false,
  remoteChatEnabled: false,
  cloudHistoryEnabled: false,
};

interface AppData {
  hydrated: boolean;
  preferences: Preferences;
  moods: MoodEntry[];
  journals: JournalEntry[];
  events: AcademicEvent[];
  messages: ChatMessage[];
  savedActions: string[];
  completedActions: string[];
  joinedCircles: string[];
  updatePreferences: (patch: Partial<Preferences>) => void;
  setLanguage: (language: Language) => void;
  recordMood: (mood: Mood) => void;
  addJournal: (text: string, mood?: Mood, intensity?: number) => void;
  deleteJournal: (id: string) => void;
  addEvent: (event: Omit<AcademicEvent, 'id'>) => void;
  updateEvent: (event: AcademicEvent) => void;
  deleteEvent: (id: string) => void;
  addMessage: (message: ChatMessage) => void;
  toggleSavedAction: (id: string) => void;
  completeAction: (id: string) => void;
  toggleCircle: (id: string) => void;
  clearHistory: () => Promise<void>;
  deleteLocalData: () => Promise<void>;
}

const AppDataContext = createContext<AppData | null>(null);

export function AppDataProvider({ children }: PropsWithChildren) {
  const [hydrated, setHydrated] = useState(false);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [savedActions, setSavedActions] = useState<string[]>([]);
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  const [joinedCircles, setJoinedCircles] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    AsyncStorage.multiGet(Object.values(keys))
      .then((entries) => {
        if (!active) return;
        const values = Object.fromEntries(entries);
        const parse = <T,>(key: keyof typeof keys, fallback: T): T => {
          try {
            return values[keys[key]] ? JSON.parse(values[keys[key]] as string) as T : fallback;
          } catch {
            return fallback;
          }
        };
        setPreferences({ ...defaultPreferences, ...(parse<Partial<Preferences>>('preferences', {}) ?? {}) });
        setMoods(parse('moods', []));
        setJournals(parse('journals', []));
        setEvents(parse('events', []));
        setMessages(parse<ChatMessage[]>('messages', []).filter((message) => message.id !== 'starter-1'));
        setSavedActions(parse('saved', []));
        setCompletedActions(parse('completed', []));
        setJoinedCircles(parse('joined', []));
      })
      .catch(() => undefined)
      .finally(() => { if (active) setHydrated(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const values: [string, string][] = [
      [keys.preferences, JSON.stringify(preferences)],
      [keys.moods, JSON.stringify(moods)],
      [keys.journals, JSON.stringify(journals)],
      [keys.events, JSON.stringify(events)],
      [keys.messages, JSON.stringify(messages)],
      [keys.saved, JSON.stringify(savedActions)],
      [keys.completed, JSON.stringify(completedActions)],
      [keys.joined, JSON.stringify(joinedCircles)],
    ];
    AsyncStorage.multiSet(values).catch(() => undefined);
  }, [hydrated, preferences, moods, journals, events, messages, savedActions, completedActions, joinedCircles]);

  const value: AppData = {
    hydrated,
    preferences,
    moods,
    journals,
    events,
    messages,
    savedActions,
    completedActions,
    joinedCircles,
    updatePreferences: (patch) => setPreferences((current) => ({ ...current, ...patch })),
    setLanguage: (language) => setPreferences((current) => ({ ...current, language })),
    recordMood: (mood) => setMoods((current) => [{ id: `${Date.now()}`, mood, createdAt: new Date().toISOString() }, ...current]),
    addJournal: (text, mood, intensity) => setJournals((current) => [{ id: `${Date.now()}`, text, mood, intensity, createdAt: new Date().toISOString() }, ...current]),
    deleteJournal: (id) => setJournals((current) => current.filter((entry) => entry.id !== id)),
    addEvent: (event) => setEvents((current) => [...current, { ...event, id: `${Date.now()}` }]),
    updateEvent: (event) => setEvents((current) => current.map((item) => item.id === event.id ? event : item)),
    deleteEvent: (id) => setEvents((current) => current.filter((event) => event.id !== id)),
    addMessage: (message) => setMessages((current) => [...current, message]),
    toggleSavedAction: (id) => setSavedActions((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]),
    completeAction: (id) => setCompletedActions((current) => current.includes(id) ? current : [...current, id]),
    toggleCircle: (id) => setJoinedCircles((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]),
    clearHistory: async () => {
      setMoods([]);
      setJournals([]);
      setMessages([]);
      await AsyncStorage.multiRemove([keys.moods, keys.journals, keys.messages]);
    },
    deleteLocalData: async () => {
      await AsyncStorage.multiRemove(Object.values(keys));
      setPreferences(defaultPreferences);
      setMoods([]);
      setJournals([]);
      setEvents([]);
      setMessages([]);
      setSavedActions([]);
      setCompletedActions([]);
      setJoinedCircles([]);
    },
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppData {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used inside AppDataProvider');
  return context;
}
