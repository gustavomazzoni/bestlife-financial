/**
 * Warm neutral palette from the "Finance App" design prototype.
 * Light background with dark, high-contrast cards (e.g. the balance card).
 */
export const colors = {
  background: '#F6F5F1',
  surface: '#FFFFFF',
  card: '#1B1A17',
  cardForeground: '#F6F5F1',
  foreground: '#1B1A17',
  mutedForeground: '#8A8578',
  border: '#E5E2D9',
  accent: '#1F8A5B',
  accentForeground: '#FFFFFF',
  income: '#1F8A5B',
  expense: '#DC2626',
  saving: '#2563EB',
  transfer: '#6B7280',
  warning: '#F59E0B',
  danger: '#DC2626',
} as const;

export type ColorKey = keyof typeof colors;
