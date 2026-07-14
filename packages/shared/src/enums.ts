/**
 * Plain (non-Prisma) mirrors of the enums defined in apps/web/prisma/schema.prisma.
 * Kept in sync by hand — this package must not depend on the generated Prisma
 * client so the mobile app can import it without pulling in Prisma.
 */

export const TransactionType = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
  SAVING: 'SAVING',
  TRANSFER: 'TRANSFER',
} as const;
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export const NecessityLevel = {
  IMPORTANT: 'IMPORTANT',
  NEEDS: 'NEEDS',
  WANTS: 'WANTS',
} as const;
export type NecessityLevel = (typeof NecessityLevel)[keyof typeof NecessityLevel];

export const ValueAlignment = {
  ALIGNED: 'ALIGNED',
  DEFAULT: 'DEFAULT',
  EXPERIENCE: 'EXPERIENCE',
  MATERIAL: 'MATERIAL',
  FREEDOM_ENABLING: 'FREEDOM_ENABLING',
  FREEDOM_LIMITING: 'FREEDOM_LIMITING',
} as const;
export type ValueAlignment = (typeof ValueAlignment)[keyof typeof ValueAlignment];

export const ScheduleFrequency = {
  ONCE: 'ONCE',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
} as const;
export type ScheduleFrequency = (typeof ScheduleFrequency)[keyof typeof ScheduleFrequency];
