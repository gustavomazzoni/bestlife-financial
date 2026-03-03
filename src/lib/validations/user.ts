import { z } from 'zod';

export const UserProfileSchema = z.object({
  activeIncomeMonthly: z.coerce
    .number()
    .min(0, 'A renda mensal deve ser maior ou igual a 0'),
  passiveIncomeMonthly: z.coerce
    .number()
    .min(0, 'A renda passiva deve ser maior ou igual a 0')
    .optional(),
  dreamLifestyleCost: z.coerce
    .number()
    .positive('O custo de vida dos sonhos deve ser maior que 0'),
  currentInvestments: z.coerce
    .number()
    .min(0, 'Os investimentos atuais devem ser maior ou igual a 0'),
});

export type UserProfileInput = z.infer<typeof UserProfileSchema>;
