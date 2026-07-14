'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { InferTransactionResult } from '@/types/infer';
import { SendHorizonal, Loader2 } from 'lucide-react';

export interface TransactionInferInputProps {
  onInferComplete: (result: InferTransactionResult) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

export function TransactionInferInput({
  onInferComplete,
  onError,
  disabled = false,
  className,
}: TransactionInferInputProps) {
  const [text, setText] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = React.useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, []);

  React.useEffect(() => {
    adjustTextareaHeight();
  }, [text, adjustTextareaHeight]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const trimmedText = text.trim();
    if (!trimmedText || isLoading || disabled) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/transactions/infer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: trimmedText }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData?.error?.message || 'Erro ao processar transação'
        );
      }

      const result = await response.json();
      onInferComplete(result.data);
      setText('');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao processar transação';
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('w-full', className)}>
      <div className="relative flex items-end gap-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition-shadow focus-within:shadow-md focus-within:ring-2 focus-within:ring-primary/20">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Descreva sua transação... Ex: Comprei café e pão na padaria, R$ 25"
          disabled={disabled || isLoading}
          rows={1}
          className={cn(
            'max-h-[150px] min-h-[24px] flex-1 resize-none bg-transparent text-base text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent'
          )}
          aria-label="Descreva sua transação"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!text.trim() || isLoading || disabled}
          className="h-10 w-10 shrink-0 rounded-xl"
          aria-label={isLoading ? 'Processando...' : 'Enviar transação'}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <SendHorizonal className="h-5 w-5" />
          )}
        </Button>
      </div>
      <p className="mt-2 text-center text-xs text-gray-500">
        Pressione Enter para enviar ou Shift+Enter para nova linha
      </p>
    </form>
  );
}
