# Reports Period Views Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add report period modes for selected month, last 12 months, and current calendar year.

**Architecture:** Keep period math in pure helpers, keep report aggregation pure, and let `app/(tabs)/reports.tsx` own local view state and data loading. Reuse the existing repository API because it already accepts arbitrary periods.

**Tech Stack:** Expo Router, React Native, NativeWind, Zustand, SQLite repository, date-fns, Jest.

---

### Task 1: Period Helpers

**Files:**
- Modify: `src/shared/lib/date.ts`
- Test: `src/shared/lib/__tests__/date.test.ts`

- [ ] Add failing tests for `monthPeriod`, `lastTwelveMonthsPeriod`, and `currentYearPeriod`.
- [ ] Run `npx jest src/shared/lib/__tests__/date.test.ts` and confirm the new helpers are missing.
- [ ] Implement the helpers with `date-fns`.
- [ ] Run the date helper tests and confirm they pass.

### Task 2: Report Aggregation Buckets

**Files:**
- Modify: `src/features/reports/services/aggregations.ts`
- Test: `src/features/reports/services/__tests__/aggregations.test.ts`

- [ ] Add failing tests for 12-month rolling buckets and calendar-year buckets.
- [ ] Run `npx jest src/features/reports/services/__tests__/aggregations.test.ts` and confirm the bucket mode support is missing.
- [ ] Extend `monthlyByKind` with an explicit bucket mode while keeping the existing default behavior.
- [ ] Run aggregation tests and confirm they pass.

### Task 3: Reports Screen UI

**Files:**
- Modify: `app/(tabs)/reports.tsx`

- [ ] Add `viewMode`, `selectedMonth`, derived period, labels, and bucket configuration.
- [ ] Replace the fixed "Ultimos 6 meses" query with the selected period.
- [ ] Add segmented controls for `Mes`, `12 meses`, and `Ano atual`.
- [ ] Add previous/next month controls only in `Mes` mode.
- [ ] Filter category slices from the period-loaded report rows instead of the global transaction store items.
- [ ] Add a small loading state so period switches do not display stale rows.

### Task 4: Verification

**Files:**
- Verify all changed files

- [ ] Run `npx jest src/shared/lib/__tests__/date.test.ts src/features/reports/services/__tests__/aggregations.test.ts`.
- [ ] Run `npx tsc --noEmit`.
- [ ] Check `git status --short` and summarize changed files.
