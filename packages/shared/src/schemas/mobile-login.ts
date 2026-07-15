import { z } from 'zod';

export const MobileLoginRequestSchema = z.object({
  email: z.string().email('Invalid email'),
});

export const MobileLoginVerifySchema = z.object({
  email: z.string().email('Invalid email'),
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
});

export type MobileLoginRequestInput = z.infer<typeof MobileLoginRequestSchema>;
export type MobileLoginVerifyInput = z.infer<typeof MobileLoginVerifySchema>;
