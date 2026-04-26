import { useEffect, useState } from 'react';

import { formatDateBR, parseDateBR } from '@/shared/lib/forms/schemas';

import { Input } from './Input';

type Props = {
  valueDate: Date | undefined;
  onChange: (d: Date | undefined) => void;
  label?: string;
  error?: string;
  placeholder?: string;
};

function applyMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  const parts: string[] = [];
  if (digits.length > 0) parts.push(digits.slice(0, 2));
  if (digits.length >= 3) parts.push(digits.slice(2, 4));
  if (digits.length >= 5) parts.push(digits.slice(4, 8));
  return parts.join('/');
}

export function DateInput({ valueDate, onChange, label, error, placeholder }: Props) {
  const [text, setText] = useState(valueDate ? formatDateBR(valueDate) : '');

  useEffect(() => {
    const expected = valueDate ? formatDateBR(valueDate) : '';
    setText((curr) => {
      if (curr === expected) return curr;
      const currParsed = parseDateBR(curr);
      if (currParsed && valueDate && currParsed.getTime() === valueDate.getTime()) {
        return curr;
      }
      return expected;
    });
  }, [valueDate]);

  const handleChange = (raw: string) => {
    const masked = applyMask(raw);
    setText(masked);
    if (masked.length === 10) {
      const parsed = parseDateBR(masked);
      onChange(parsed);
    } else {
      onChange(undefined);
    }
  };

  const handleBlur = () => {
    if (text.length === 0) {
      onChange(undefined);
      return;
    }
    onChange(parseDateBR(text));
  };

  return (
    <Input
      label={label}
      error={error}
      placeholder={placeholder ?? 'dd/mm/aaaa'}
      keyboardType="numeric"
      maxLength={10}
      value={text}
      onChangeText={handleChange}
      onBlur={handleBlur}
    />
  );
}
