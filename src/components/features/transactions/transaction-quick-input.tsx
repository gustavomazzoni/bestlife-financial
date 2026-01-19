'use client';

import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useInferTransaction } from '@/hooks/use-transactions';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { InferenceResult } from '@/services/transactions/infer';

interface TransactionQuickInputProps {
  onInferenceComplete: (inferred: InferenceResult) => void;
  placeholder?: string;
  className?: string;
}

const isMacPlatform = (): boolean =>
  navigator.platform.includes('Mac') ||
  navigator.platform.indexOf('Mac') === 0 ||
  navigator.platform === 'iPhone';

export function TransactionQuickInput({
  onInferenceComplete,
  placeholder = "What's your transaction?",
  className,
}: TransactionQuickInputProps) {
  const [text, setText] = useState('');
  const [isInferring, setIsInferring] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inferMutation = useInferTransaction();

  const handleAnalyze = async () => {
    if (!text.trim()) {
      toast.error('Please enter a transaction description');
      return;
    }

    setIsInferring(true);
    try {
      const result = await inferMutation.mutateAsync(text);
      setText(''); // Clear input after successful inference
      onInferenceComplete(result);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Couldn't understand this right now. Try again or use the full form."
      );
    } finally {
      setIsInferring(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div className={className}>
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[100px] resize-none pr-24 text-base md:min-h-[120px]"
          disabled={isInferring}
        />
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          {isInferring && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">Understanding...</span>
            </div>
          )}
          <Button
            onClick={handleAnalyze}
            disabled={!text.trim() || isInferring}
            size="sm"
            className="h-8"
          >
            {isInferring ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze'
            )}
          </Button>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Example: &ldquo;Smoothie and oatmeal bowl at healthy café, R$ 35&rdquo;
        • Press{' '}
        <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs">
          {isMacPlatform() ? '⌘' : 'Ctrl'}
        </kbd>{' '}
        +{' '}
        <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs">
          Enter
        </kbd>{' '}
        to analyze
      </p>
    </div>
  );
}
