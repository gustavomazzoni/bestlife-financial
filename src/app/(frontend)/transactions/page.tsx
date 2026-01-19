'use client';

import { useState } from 'react';
import { TransactionQuickInput } from '@/components/features/transactions/transaction-quick-input';
import { TransactionConfirmSheet } from '@/components/features/transactions/transaction-confirm-sheet';
import { TransactionList } from '@/components/features/transactions/transaction-list';
import { InferenceResult } from '@/services/transactions/infer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export default function TransactionsPage() {
  const [inferenceResult, setInferenceResult] =
    useState<InferenceResult | null>(null);
  const [showQuickInput, setShowQuickInput] = useState(true);

  const handleInferenceComplete = (result: InferenceResult) => {
    setInferenceResult(result);
    setShowQuickInput(false);
  };

  const handleCloseConfirm = () => {
    setInferenceResult(null);
    setShowQuickInput(true);
  };

  const handleSuccess = () => {
    setInferenceResult(null);
    setShowQuickInput(true);
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 pb-20 md:pb-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <p className="mt-2 text-gray-600">
          Log your expenses, income, and savings with natural language
        </p>
      </div>

      {/* Quick Input */}
      {showQuickInput && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Transaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionQuickInput
              onInferenceComplete={handleInferenceComplete}
              placeholder="What's your transaction? Example: 'Smoothie and oatmeal bowl at healthy café, R$ 35'"
            />
          </CardContent>
        </Card>
      )}

      {/* Confirmation Sheet */}
      {inferenceResult && (
        <TransactionConfirmSheet
          inferenceResult={inferenceResult}
          onClose={handleCloseConfirm}
          onSuccess={handleSuccess}
        />
      )}

      {/* Transaction List */}
      <TransactionList />
    </div>
  );
}
