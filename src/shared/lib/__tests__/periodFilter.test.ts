import {
  emptyTransactionsDescription,
  emptyTransactionsTitle,
  periodDisplayLabel,
  periodForSelection,
  recentTransactionsTitle,
} from '../periodFilter';

describe('period filter helpers', () => {
  const today = new Date('2026-05-15T12:00:00Z');
  const selectedMonth = new Date('2026-03-10T12:00:00Z');

  test('periodForSelection uses the selected month in month mode', () => {
    const period = periodForSelection('month', selectedMonth, today);

    expect(new Date(period.from).toISOString()).toBe('2026-03-01T03:00:00.000Z');
    expect(new Date(period.to).toISOString()).toBe('2026-04-01T02:59:59.999Z');
  });

  test('periodForSelection uses a rolling window in last12 mode', () => {
    const period = periodForSelection('last12', selectedMonth, today);

    expect(new Date(period.from).toISOString()).toBe('2025-06-01T03:00:00.000Z');
    expect(new Date(period.to).toISOString()).toBe(today.toISOString());
  });

  test('periodForSelection uses the current calendar year in year mode', () => {
    const period = periodForSelection('year', selectedMonth, today);

    expect(new Date(period.from).toISOString()).toBe('2026-01-01T03:00:00.000Z');
    expect(new Date(period.to).toISOString()).toBe('2027-01-01T02:59:59.999Z');
  });

  test('periodDisplayLabel describes all modes', () => {
    expect(periodDisplayLabel('month', selectedMonth, today)).toBe('março 2026');
    expect(periodDisplayLabel('last12', selectedMonth, today)).toBe('jun 2025 - mai 2026');
    expect(periodDisplayLabel('year', selectedMonth, today)).toBe('2026');
  });

  test('transaction copy changes with the active mode', () => {
    expect(emptyTransactionsTitle('month', selectedMonth, today)).toBe(
      'Sem lançamentos em março 2026'
    );
    expect(emptyTransactionsTitle('last12', selectedMonth, today)).toBe(
      'Sem lançamentos nos últimos 12 meses'
    );
    expect(emptyTransactionsTitle('year', selectedMonth, today)).toBe(
      'Sem lançamentos em 2026'
    );

    expect(emptyTransactionsDescription('month', selectedMonth)).toBe(
      'Toque em + para registrar um lançamento em março 2026.'
    );
    expect(emptyTransactionsDescription('last12', selectedMonth)).toBe(
      'Toque em + para registrar um lançamento neste período.'
    );
    expect(recentTransactionsTitle('month')).toBe('Últimas transações do mês');
    expect(recentTransactionsTitle('last12')).toBe('Últimas transações do período');
  });
});
