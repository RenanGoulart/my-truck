import { endOfMonth, endOfYear, startOfMonth, startOfYear, subMonths } from 'date-fns';

export type Period = { from: number; to: number };

export const monthPeriod = (ref = new Date()): Period => ({
  from: startOfMonth(ref).getTime(),
  to: endOfMonth(ref).getTime(),
});

export const currentMonthRange = monthPeriod;

export const previousMonthRange = (ref = new Date()): Period =>
  monthPeriod(subMonths(ref, 1));

export const lastTwelveMonthsPeriod = (ref = new Date()): Period => ({
  from: startOfMonth(subMonths(ref, 11)).getTime(),
  to: ref.getTime(),
});

export const currentYearPeriod = (ref = new Date()): Period => ({
  from: startOfYear(ref).getTime(),
  to: endOfYear(ref).getTime(),
});
