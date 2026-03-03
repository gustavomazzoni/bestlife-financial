'use client';

import * as React from 'react';
import { Label } from './label';

interface FieldProps {
  label: string;
  id?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function Field({
  label,
  id,
  error,
  hint,
  children,
  className,
}: FieldProps) {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  return (
    <div className={`space-y-1.5${className ? ` ${className}` : ''}`}>
      <Label htmlFor={fieldId}>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
