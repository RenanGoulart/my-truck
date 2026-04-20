import { formatBRL, fromCents, toCents } from '../money';

describe('money', () => {
  test('toCents arredonda corretamente', () => {
    expect(toCents(10)).toBe(1000);
    expect(toCents(10.5)).toBe(1050);
    expect(toCents(0.1 + 0.2)).toBe(30);
  });

  test('fromCents é o inverso de toCents', () => {
    expect(fromCents(toCents(123.45))).toBe(123.45);
  });

  test('formatBRL usa locale pt-BR', () => {
    const formatted = formatBRL(123456);
    expect(formatted).toMatch(/R\$/);
    expect(formatted).toContain('1.234,56');
  });
});
