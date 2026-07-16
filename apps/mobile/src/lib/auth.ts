import { api, ApiError } from './api';
import { getStoredToken, setStoredToken, clearStoredToken } from './token';

export { getStoredToken };

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
    await setStoredToken(token);
    return { type: 'success' };
  } catch (err) {
    return {
      type: 'error',
      message: err instanceof ApiError ? err.message : 'Código inválido',
    };
  }
}

export async function signOut(): Promise<void> {
  await clearStoredToken();
}
