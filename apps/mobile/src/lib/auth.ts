import * as SecureStore from 'expo-secure-store';
import { api, ApiError } from './api';

const TOKEN_KEY = 'lifeos_mobile_token';

export type AuthActionResult =
  | { type: 'success' }
  | { type: 'error'; message: string };

/** Sends a 6-digit code to the given email. */
export async function requestLoginCode(email: string): Promise<AuthActionResult> {
  try {
    await api.post('/api/v1/auth/mobile-login/request', { email });
    return { type: 'success' };
  } catch (err) {
    return {
      type: 'error',
      message: err instanceof ApiError ? err.message : 'Erro ao enviar código',
    };
  }
}

/** Verifies the code and stores the returned bearer token on success. */
export async function verifyLoginCode(
  email: string,
  code: string
): Promise<AuthActionResult> {
  try {
    const { token } = await api.post<{ token: string }>(
      '/api/v1/auth/mobile-login/verify',
      { email, code }
    );
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    return { type: 'success' };
  } catch (err) {
    return {
      type: 'error',
      message: err instanceof ApiError ? err.message : 'Código inválido',
    };
  }
}

export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function signOut(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
