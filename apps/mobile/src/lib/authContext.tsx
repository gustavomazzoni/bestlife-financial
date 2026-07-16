import { createContext, useContext } from 'react';

interface AuthContextValue {
  /** Clears the stored token and returns the app to the signed-out state. */
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthContext.Provider');
  }
  return ctx;
}
