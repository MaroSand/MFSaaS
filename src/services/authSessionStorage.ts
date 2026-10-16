import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'mfff.remembered-session.v1';

export interface RememberedSession {
  username: string;
  token: string;
  tokenType: string;
}

export async function saveRememberedSession(session: RememberedSession): Promise<void> {
  const value = JSON.stringify(session);
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.setItem(SESSION_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(SESSION_KEY, value);
}

export async function loadRememberedSession(): Promise<RememberedSession | null> {
  const value = Platform.OS === 'web'
    ? (typeof localStorage !== 'undefined' ? localStorage.getItem(SESSION_KEY) : null)
    : await SecureStore.getItemAsync(SESSION_KEY);
  if (!value) return null;

  try {
    const session = JSON.parse(value) as Partial<RememberedSession>;
    if (typeof session.username === 'string' && session.username &&
        typeof session.token === 'string' && session.token) {
      return {
        username: session.username,
        token: session.token,
        tokenType: session.tokenType || 'Bearer',
      };
    }
  } catch {
    // A damaged saved session should be discarded rather than restored.
  }

  await removeRememberedSession();
  return null;
}

export async function removeRememberedSession(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(SESSION_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
