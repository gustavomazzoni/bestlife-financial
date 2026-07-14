import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from './config';

const TOKEN_KEY = 'lifeos_mobile_token';

export type SignInResult =
  | { type: 'success' }
  | { type: 'cancelled' }
  | { type: 'error'; message: string };

/**
 * Bridges apps/web's NextAuth email magic-link flow into the app: opens
 * the existing /login page in an in-app browser (real cookie jar, so
 * NextAuth's CSRF handshake works unmodified), the user requests + taps
 * the magic link there, and NextAuth's flow redirects through
 * /api/v1/auth/mobile-exchange to this app's own deep link carrying a
 * bearer token — which the in-app browser session then resolves back to
 * this call directly, no separate deep-link listener needed.
 */
export async function signInWithEmail(email: string): Promise<SignInResult> {
  const returnUrl = Linking.createURL('auth');
  const mobileExchangeUrl = `${API_URL}/api/v1/auth/mobile-exchange?returnUrl=${encodeURIComponent(returnUrl)}`;
  const loginUrl = `${API_URL}/login?email=${encodeURIComponent(email)}&from=${encodeURIComponent(mobileExchangeUrl)}`;

  const result = await WebBrowser.openAuthSessionAsync(loginUrl, returnUrl);

  if (result.type !== 'success' || !result.url) {
    return { type: 'cancelled' };
  }

  const { queryParams } = Linking.parse(result.url);
  const token = queryParams?.token;
  const error = queryParams?.error;

  if (typeof token === 'string' && token.length > 0) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    return { type: 'success' };
  }

  return {
    type: 'error',
    message: typeof error === 'string' ? error : 'Sign-in failed',
  };
}

export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function signOut(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
