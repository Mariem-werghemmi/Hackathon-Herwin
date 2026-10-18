import * as SecureStore from 'expo-secure-store';
import { File } from 'expo-file-system';
import { fetch as expoFetch } from 'expo/fetch';
import { Platform } from 'react-native';

import type { Language, Preferences, SupportMode } from '@/types';

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

const accessTokenKey = 'hermind.api.access-token';
const conversationIdKey = 'hermind.api.conversation-id';

async function getStoredValue(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return globalThis.localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function setStoredValue(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function deleteStoredValue(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export interface ChatContextMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnonymousAccount {
  user_id: string;
  access_token: string;
  token_type: 'bearer';
}

export interface RemoteChatResponse {
  conversation_id: string | null;
  message: string;
  stored: boolean;
}

async function request<T>(path: string, options: { method?: string; token?: string; body?: unknown } = {}): Promise<T> {
  if (!API_BASE_URL) throw new Error('Adresse du serveur HERmind non configurée.');
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });
  } catch {
    throw new Error('Serveur HERmind injoignable. Vérifie ton réseau et l’adresse configurée.');
  }

  if (!response.ok) {
    let message = `Le serveur a répondu (${response.status}).`;
    try {
      const payload = await response.json() as { detail?: string };
      if (payload.detail) message = payload.detail;
    } catch {
      message = `Le serveur a répondu (${response.status}).`;
    }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}

export async function ensureRemoteAccount(preferences: Preferences): Promise<string> {
  const existing = await getStoredValue(accessTokenKey);
  if (existing) return existing;
  const account = await request<AnonymousAccount>('/users', {
    method: 'POST',
    body: { pseudonym: preferences.pseudonym, language: preferences.language, goals: preferences.goals },
  });
  await setStoredValue(accessTokenKey, account.access_token);
  return account.access_token;
}

export async function updateRemoteHistoryConsent(enabled: boolean, preferences: Preferences): Promise<void> {
  const token = await ensureRemoteAccount(preferences);
  await request<void>('/users/me/consent', { method: 'PATCH', token, body: { chat_history_enabled: enabled } });
  if (!enabled) await deleteStoredValue(conversationIdKey);
}

export async function sendRemoteChat(input: {
  message: string;
  mode: SupportMode;
  language: Language;
  context: ChatContextMessage[];
  preferences: Preferences;
}): Promise<RemoteChatResponse> {
  const token = await ensureRemoteAccount(input.preferences);
  const conversationId = await getStoredValue(conversationIdKey);
  const response = await request<RemoteChatResponse>('/chat', {
    method: 'POST',
    token,
    body: {
      message: input.message,
      mode: input.mode,
      language: input.language,
      conversation_id: conversationId,
      context: input.context.slice(-12),
    },
  });
  if (response.conversation_id) await setStoredValue(conversationIdKey, response.conversation_id);
  else await deleteStoredValue(conversationIdKey);
  return response;
}

export async function transcribeAudio(uri: string, language: Language, preferences: Preferences): Promise<string> {
  if (!API_BASE_URL) throw new Error('Adresse du serveur HERmind non configurée.');
  const token = await ensureRemoteAccount(preferences);

  let audio: Blob;
  try {
    if (Platform.OS === 'web') {
      const fileResponse = await globalThis.fetch(uri);
      if (!fileResponse.ok) throw new Error('Lecture de l’enregistrement impossible.');
      audio = await fileResponse.blob();
    } else {
      audio = new File(uri);
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Lecture de l’enregistrement impossible.');
  }

  const contentType = audio.type || 'audio/mp4';
  const extension = contentType.includes('webm') ? 'webm' : contentType.includes('wav') ? 'wav' : 'm4a';
  const formData = new FormData();
  formData.append('file', audio, `recording.${extension}`);
  if (language === 'Français') formData.append('language', 'fr');
  else if (language === 'العربية') formData.append('language', 'ar');

  let response: Response;
  try {
    response = await expoFetch(`${API_BASE_URL}/transcribe`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  } catch {
    throw new Error('Serveur HERmind injoignable pendant la transcription. Vérifie ton réseau.');
  }

  if (!response.ok) {
    let message = `La transcription a échoué (HTTP ${response.status}).`;
    try {
      const payload = await response.json() as { detail?: string };
      if (payload.detail) message = payload.detail;
    } catch {
      message = `La transcription a échoué (HTTP ${response.status}).`;
    }
    throw new Error(message);
  }

  const payload = await response.json() as { text?: unknown };
  if (typeof payload.text !== 'string' || !payload.text.trim()) {
    throw new Error('Aucun texte n’a été reconnu. Réessaie en parlant un peu plus près du micro.');
  }
  return payload.text.trim();
}

export async function clearRemoteChatHistory(): Promise<void> {
  const token = await getStoredValue(accessTokenKey);
  if (!token || !API_BASE_URL) return;
  await request<void>('/chat/history', { method: 'DELETE', token });
  await deleteStoredValue(conversationIdKey);
}

export async function deleteRemoteAccount(): Promise<void> {
  const token = await getStoredValue(accessTokenKey);
  if (token && API_BASE_URL) await request<void>('/users/me', { method: 'DELETE', token });
  await deleteStoredValue(accessTokenKey);
  await deleteStoredValue(conversationIdKey);
}

export const apiRoutes = {
  users: '/users',
  checkin: '/checkin',
  confirmCheckin: (id: string) => `/checkin/${id}/confirm`,
  chat: '/chat',
  nextStep: '/next-step',
  feedback: '/feedback',
  events: '/events',
  forecast: '/forecast',
  journey: '/journey',
  transcribe: '/transcribe',
} as const;
