export const toCents = (value: number): number => Math.round(value * 100);

export const fromCents = (cents: number): number => cents / 100;

export const formatBRL = (cents: number): string =>
  (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
