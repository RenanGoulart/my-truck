import {
  currentYearPeriod,
  lastTwelveMonthsPeriod,
  monthPeriod,
} from '../date';

describe('report periods', () => {
  test('monthPeriod covers the selected month', () => {
    const period = monthPeriod(new Date('2026-05-15T12:00:00Z'));

    expect(new Date(period.from).getFullYear()).toBe(2026);
    expect(new Date(period.from).getMonth()).toBe(4);
    expect(new Date(period.from).getDate()).toBe(1);
    expect(new Date(period.to).getFullYear()).toBe(2026);
    expect(new Date(period.to).getMonth()).toBe(4);
    expect(new Date(period.to).getDate()).toBe(31);
  });

  test('lastTwelveMonthsPeriod starts 11 months before the reference month and ends today', () => {
    const period = lastTwelveMonthsPeriod(new Date('2026-05-15T12:00:00Z'));

    expect(new Date(period.from).getFullYear()).toBe(2025);
    expect(new Date(period.from).getMonth()).toBe(5);
    expect(new Date(period.from).getDate()).toBe(1);
    expect(period.to).toBe(new Date('2026-05-15T12:00:00Z').getTime());
  });

  test('currentYearPeriod covers the full calendar year', () => {
    const period = currentYearPeriod(new Date('2026-05-15T12:00:00Z'));

    expect(new Date(period.from).getFullYear()).toBe(2026);
    expect(new Date(period.from).getMonth()).toBe(0);
    expect(new Date(period.from).getDate()).toBe(1);
    expect(new Date(period.to).getFullYear()).toBe(2026);
    expect(new Date(period.to).getMonth()).toBe(11);
    expect(new Date(period.to).getDate()).toBe(31);
  });
});
