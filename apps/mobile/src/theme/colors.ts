/**
 * Warm neutral palette from the "Finance App" design prototype
 * (claude.ai/design project 483fe27b-74a0-4bb0-8c0d-ccce959b1b4a).
 * Light background with dark, high-contrast cards (e.g. the balance card).
 */
export const colors = {
  background: '#F6F5F1',
  surface: '#FFFFFF',
  surfaceMuted: '#F3F1EB',
  card: '#1B1A17',
  cardForeground: '#F6F5F1',
  foreground: '#1B1A17',
  mutedForeground: '#8C887F',
  mutedForeground2: '#B8B4AA',
  border: '#ECEAE3',
  borderSoft: '#F1EFE9',
  borderDashed: '#E0DDD4',
  accent: '#1F8A5B',
  accentSoft: '#E7F2EC',
  accentForeground: '#FFFFFF',
  income: '#1F8A5B',
  incomeSoft: '#6FD3A0',
  expense: '#C8553B',
  expenseSoft: '#F2A78F',
  saving: '#2563EB',
  transfer: '#6B7280',
  warning: '#C98A2B',
  warningSoft: '#F6EEDD',
  danger: '#C8553B',
} as const;

export type ColorKey = keyof typeof colors;
