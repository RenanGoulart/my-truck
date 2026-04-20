import { endOfMonth, startOfMonth, subMonths } from 'date-fns';

export type Period = { from: number; to: number };

export const currentMonthRange = (ref = new Date()): Period => ({
  from: startOfMonth(ref).getTime(),
  to: endOfMonth(ref).getTime(),
});

export const previousMonthRange = (ref = new Date()): Period =>
  currentMonthRange(subMonths(ref, 1));
