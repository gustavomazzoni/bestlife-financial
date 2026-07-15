import prisma from '@/lib/db';
import { InferTransactionResult } from '@/types';
import { createInferenceProvider } from '@/lib/llm/factory';

export async function inferTransaction(
  text: string,
  userId: string
): Promise<InferTransactionResult> {
  const [categories, accounts] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true, type: true } }),
    prisma.financialAccount.findMany({
      where: { userId },
      select: { id: true, name: true },
    }),
  ]);

  const provider = createInferenceProvider();
  return provider.inferTransaction(text, categories, accounts);
}
