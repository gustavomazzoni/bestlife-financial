/**
 * Radius/shadow scale lifted from the design prototype's card treatments
 * (18-24px radii, soft low-opacity shadows — never hard drop shadows).
 */
export const radius = {
  sm: 11,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  dark: {
    shadowColor: '#1B1A17',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 6,
  },
  accent: {
    shadowColor: '#1F8A5B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;
