# Dashboard and Transactions Period Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add shared `Mes`, `12 meses`, and `Ano atual` period filters to dashboard, transactions, and reports so all three screens show the same active transaction period.

**Architecture:** Centralize period selection state in `useTransactionsStore`, keep period math and user-facing labels in pure helpers, and render the same reusable period filter component in the three tab screens. Dashboard and transactions consume the store-loaded period data directly; reports keeps its chart aggregation flow but derives its period from the shared store.

**Tech Stack:** Expo Router, React Native, NativeWind, Zustand, date-fns, SQLite repository, Jest, TypeScript.

---

## File Structure

- Create `src/shared/lib/periodFilter.ts`: pure period-selection types, options, period derivation, and labels.
- Create `src/shared/lib/__tests__/periodFilter.test.ts`: unit tests for period derivation and labels.
- Create `src/shared/ui/PeriodFilterCard.tsx`: reusable segmented control and month navigation UI.
- Modify `src/features/transactions/store/transactions.store.ts`: add global period mode/month selection actions and derive `period`.
- Modify `app/(tabs)/dashboard.tsx`: render period filter and dynamic labels.
- Modify `app/(tabs)/transactions.tsx`: render period filter and dynamic empty/loading labels.
- Modify `app/(tabs)/reports.tsx`: remove local period filter state and use the shared store/component.
- Verify existing tests in `src/shared/lib/__tests__/date.test.ts` and `src/features/reports/services/__tests__/aggregations.test.ts` still pass.

---

### Task 1: Add Pure Period Filter Helpers

**Files:**
- Create: `src/shared/lib/periodFilter.ts`
- Test: `src/shared/lib/__tests__/periodFilter.test.ts`

- [ ] **Step 1: Write helper tests first**

Create `src/shared/lib/__tests__/periodFilter.test.ts`:

```ts
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
    expect(periodDisplayLabel('last12', selectedMonth, today)).toBe('jun. 2025 - mai. 2026');
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

    expect(emptyTransactionsDescription('month')).toBe(
      'Toque em + para registrar o primeiro lançamento deste mês.'
    );
    expect(emptyTransactionsDescription('last12')).toBe(
      'Toque em + para registrar um lançamento neste período.'
    );
    expect(recentTransactionsTitle('month')).toBe('Últimas transações do mês');
    expect(recentTransactionsTitle('last12')).toBe('Últimas transações do período');
  });
});
```

- [ ] **Step 2: Run the new test and confirm it fails because the helper does not exist**

Run:

```bash
npx jest src/shared/lib/__tests__/periodFilter.test.ts
```

Expected: FAIL with a module resolution error for `../periodFilter`.

- [ ] **Step 3: Implement the helper**

Create `src/shared/lib/periodFilter.ts`:

```ts
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  currentYearPeriod,
  lastTwelveMonthsPeriod,
  monthPeriod,
  type Period,
} from './date';

export type PeriodMode = 'month' | 'last12' | 'year';

export const PERIOD_FILTER_OPTIONS: { value: PeriodMode; label: string }[] = [
  { value: 'month', label: 'Mês' },
  { value: 'last12', label: '12 meses' },
  { value: 'year', label: 'Ano atual' },
];

export const periodForSelection = (
  mode: PeriodMode,
  selectedMonth: Date,
  today = new Date()
): Period => {
  if (mode === 'last12') return lastTwelveMonthsPeriod(today);
  if (mode === 'year') return currentYearPeriod(today);
  return monthPeriod(selectedMonth);
};

export const periodDisplayLabel = (
  mode: PeriodMode,
  selectedMonth: Date,
  today = new Date()
): string => {
  if (mode === 'last12') {
    return `${format(subMonths(today, 11), 'MMM yyyy', { locale: ptBR })} - ${format(
      today,
      'MMM yyyy',
      { locale: ptBR }
    )}`;
  }
  if (mode === 'year') return format(today, 'yyyy');
  return format(selectedMonth, 'MMMM yyyy', { locale: ptBR });
};

export const emptyTransactionsTitle = (
  mode: PeriodMode,
  selectedMonth: Date,
  today = new Date()
): string => {
  if (mode === 'last12') return 'Sem lançamentos nos últimos 12 meses';
  if (mode === 'year') return `Sem lançamentos em ${format(today, 'yyyy')}`;
  return `Sem lançamentos em ${format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}`;
};

export const emptyTransactionsDescription = (mode: PeriodMode): string => {
  if (mode === 'month') return 'Toque em + para registrar o primeiro lançamento deste mês.';
  return 'Toque em + para registrar um lançamento neste período.';
};

export const recentTransactionsTitle = (mode: PeriodMode): string => {
  if (mode === 'month') return 'Últimas transações do mês';
  return 'Últimas transações do período';
};
```

- [ ] **Step 4: Run the helper test and confirm it passes**

Run:

```bash
npx jest src/shared/lib/__tests__/periodFilter.test.ts
```

Expected: PASS.

---

### Task 2: Move Period Selection Into the Transactions Store

**Files:**
- Modify: `src/features/transactions/store/transactions.store.ts`

- [ ] **Step 1: Update store imports and state type**

Replace the date import and add period-filter imports:

```ts
import { addMonths, subMonths } from 'date-fns';
import { create } from 'zustand';

import { type Period } from '@/shared/lib/date';
import {
  periodForSelection,
  type PeriodMode,
} from '@/shared/lib/periodFilter';
```

Update `type State` to include the new fields and actions:

```ts
type State = {
  truckId: string | null;
  items: Transaction[];
  period: Period;
  periodMode: PeriodMode;
  selectedMonth: Date;
  isLoading: boolean;
  incomeCents: number;
  expenseCents: number;
  setTruck: (truckId: string) => void;
  setPeriod: (p: Period) => Promise<void>;
  setPeriodMode: (mode: PeriodMode) => Promise<void>;
  setSelectedMonth: (month: Date) => Promise<void>;
  goToPreviousMonth: () => Promise<void>;
  goToNextMonth: () => Promise<void>;
  load: () => Promise<void>;
  add: (input: Omit<NewTransaction, 'truckId'>) => Promise<Transaction>;
  update: (id: string, patch: TransactionPatch) => Promise<void>;
  remove: (id: string) => Promise<void>;
};
```

- [ ] **Step 2: Add the initial selection**

Inside the store factory, define the initial month and replace `period: currentMonthRange()`:

```ts
const initialSelectedMonth = new Date();
const initialPeriodMode: PeriodMode = 'month';

export const useTransactionsStore = create<State>((set, get) => ({
  truckId: null,
  items: [],
  period: periodForSelection(initialPeriodMode, initialSelectedMonth),
  periodMode: initialPeriodMode,
  selectedMonth: initialSelectedMonth,
  isLoading: false,
  incomeCents: 0,
  expenseCents: 0,
```

- [ ] **Step 3: Add store actions that derive period and reload**

Keep `setPeriod` for compatibility, then add the new actions below it:

```ts
  setPeriod: async (period) => {
    set({ period });
    await get().load();
  },

  setPeriodMode: async (periodMode) => {
    const selectedMonth = get().selectedMonth;
    set({ periodMode, period: periodForSelection(periodMode, selectedMonth) });
    await get().load();
  },

  setSelectedMonth: async (selectedMonth) => {
    const periodMode = get().periodMode;
    set({ selectedMonth, period: periodForSelection(periodMode, selectedMonth) });
    await get().load();
  },

  goToPreviousMonth: async () => {
    const selectedMonth = subMonths(get().selectedMonth, 1);
    set({
      selectedMonth,
      period: periodForSelection(get().periodMode, selectedMonth),
    });
    await get().load();
  },

  goToNextMonth: async () => {
    const selectedMonth = addMonths(get().selectedMonth, 1);
    set({
      selectedMonth,
      period: periodForSelection(get().periodMode, selectedMonth),
    });
    await get().load();
  },
```

- [ ] **Step 4: Run typecheck after store changes**

Run:

```bash
npx tsc --noEmit
```

Expected: PASS or only failures unrelated to this change. Fix any type errors caused by the new store fields before continuing.

---

### Task 3: Create the Shared Period Filter UI

**Files:**
- Create: `src/shared/ui/PeriodFilterCard.tsx`

- [ ] **Step 1: Implement the reusable card**

Create `src/shared/ui/PeriodFilterCard.tsx`:

```tsx
import { AntDesign } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  PERIOD_FILTER_OPTIONS,
  periodDisplayLabel,
  type PeriodMode,
} from '@/shared/lib/periodFilter';

import { Card } from './Card';

type Props = {
  mode: PeriodMode;
  selectedMonth: Date;
  onModeChange: (mode: PeriodMode) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
};

export function PeriodFilterCard({
  mode,
  selectedMonth,
  onModeChange,
  onPreviousMonth,
  onNextMonth,
}: Props) {
  const today = new Date();
  const label = periodDisplayLabel(mode, selectedMonth, today);

  return (
    <Card>
      <View className="flex-row bg-surface rounded-lg p-1">
        {PERIOD_FILTER_OPTIONS.map((option) => {
          const isActive = option.value === mode;
          return (
            <Pressable
              key={option.value}
              onPress={() => onModeChange(option.value)}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected: isActive }}
              className={`h-10 flex-1 items-center justify-center rounded-md ${
                isActive ? 'bg-primary' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  isActive ? 'text-primary-fg' : 'text-muted'
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {mode === 'month' ? (
        <View className="flex-row items-center justify-between mt-4">
          <IconButton
            label="Mês anterior"
            icon="left"
            onPress={onPreviousMonth}
          />
          <Text className="text-white text-base font-semibold">{label}</Text>
          <IconButton label="Próximo mês" icon="right" onPress={onNextMonth} />
        </View>
      ) : (
        <Text className="text-muted text-sm text-center mt-4">{label}</Text>
      )}
    </Card>
  );
}

function IconButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: ComponentProps<typeof AntDesign>['name'];
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={12}
      className="w-11 h-11 rounded-lg bg-surface items-center justify-center"
    >
      <AntDesign name={icon} size={18} color="#FFC107" />
    </Pressable>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run:

```bash
npx tsc --noEmit
```

Expected: PASS.

---

### Task 4: Update Dashboard

**Files:**
- Modify: `app/(tabs)/dashboard.tsx`

- [ ] **Step 1: Import helper/component dependencies**

Add imports:

```ts
import {
  emptyTransactionsDescription,
  emptyTransactionsTitle,
  recentTransactionsTitle,
} from '@/shared/lib/periodFilter';
import { PeriodFilterCard } from '@/shared/ui/PeriodFilterCard';
```

- [ ] **Step 2: Read period filter state/actions from the store**

Inside `Dashboard`, add selectors:

```ts
  const periodMode = useTransactionsStore((s) => s.periodMode);
  const selectedMonth = useTransactionsStore((s) => s.selectedMonth);
  const setPeriodMode = useTransactionsStore((s) => s.setPeriodMode);
  const goToPreviousMonth = useTransactionsStore((s) => s.goToPreviousMonth);
  const goToNextMonth = useTransactionsStore((s) => s.goToNextMonth);
```

- [ ] **Step 3: Render the filter after the truck header**

Place this block after the active truck header and before `BalanceCard`:

```tsx
        <PeriodFilterCard
          mode={periodMode}
          selectedMonth={selectedMonth}
          onModeChange={(mode) => void setPeriodMode(mode)}
          onPreviousMonth={() => void goToPreviousMonth()}
          onNextMonth={() => void goToNextMonth()}
        />
```

- [ ] **Step 4: Replace fixed recent transaction labels**

Replace the section title:

```tsx
          <Text className="text-white text-base font-semibold mb-2">
            {recentTransactionsTitle(periodMode)}
          </Text>
```

Replace the empty state copy:

```tsx
            <EmptyState
              icon="swap"
              title={emptyTransactionsTitle(periodMode, selectedMonth)}
              description={emptyTransactionsDescription(periodMode)}
            />
```

- [ ] **Step 5: Run typecheck**

Run:

```bash
npx tsc --noEmit
```

Expected: PASS.

---

### Task 5: Update Transactions List

**Files:**
- Modify: `app/(tabs)/transactions.tsx`

- [ ] **Step 1: Import dynamic labels and shared filter**

Add imports:

```ts
import {
  emptyTransactionsDescription,
  emptyTransactionsTitle,
} from '@/shared/lib/periodFilter';
import { PeriodFilterCard } from '@/shared/ui/PeriodFilterCard';
```

- [ ] **Step 2: Read period filter state/actions from the store**

Inside `Transactions`, add selectors:

```ts
  const periodMode = useTransactionsStore((s) => s.periodMode);
  const selectedMonth = useTransactionsStore((s) => s.selectedMonth);
  const setPeriodMode = useTransactionsStore((s) => s.setPeriodMode);
  const goToPreviousMonth = useTransactionsStore((s) => s.goToPreviousMonth);
  const goToNextMonth = useTransactionsStore((s) => s.goToNextMonth);
```

- [ ] **Step 3: Render the filter at the top of the screen**

Inside the main `<View className="flex-1 px-5 pt-4">`, add:

```tsx
        <PeriodFilterCard
          mode={periodMode}
          selectedMonth={selectedMonth}
          onModeChange={(mode) => void setPeriodMode(mode)}
          onPreviousMonth={() => void goToPreviousMonth()}
          onNextMonth={() => void goToNextMonth()}
        />
```

Change the wrapper class to include spacing:

```tsx
      <View className="flex-1 px-5 pt-4 gap-4">
```

- [ ] **Step 4: Replace the fixed empty state copy**

Replace the empty state:

```tsx
            <EmptyState
              icon="swap"
              title={emptyTransactionsTitle(periodMode, selectedMonth)}
              description={emptyTransactionsDescription(periodMode)}
            />
```

- [ ] **Step 5: Keep list sizing stable**

Wrap the existing conditional content below the filter in a flex container:

```tsx
        <View className="flex-1">
          {isLoading && items.length === 0 ? (
            <View className="gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} height={64} rounded="lg" />
              ))}
            </View>
          ) : items.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <EmptyState
                icon="swap"
                title={emptyTransactionsTitle(periodMode, selectedMonth)}
                description={emptyTransactionsDescription(periodMode)}
              />
            </View>
          ) : (
            <FlashList
              data={items}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => <TransactionListItem tx={item} />}
              ItemSeparatorComponent={() => <View className="h-2" />}
              contentContainerStyle={{ paddingBottom: 100 }}
            />
          )}
        </View>
```

- [ ] **Step 6: Run typecheck**

Run:

```bash
npx tsc --noEmit
```

Expected: PASS.

---

### Task 6: Update Reports to Use Shared Filter State

**Files:**
- Modify: `app/(tabs)/reports.tsx`

- [ ] **Step 1: Remove local filter imports and definitions**

Remove imports that become unused:

```ts
import { AntDesign } from '@expo/vector-icons';
import { addMonths, format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ComponentProps } from 'react';
import { Pressable } from 'react-native';
```

Remove local `ReportViewMode`, `VIEW_OPTIONS`, `reportPeriodLabel`, and `IconButton`.

- [ ] **Step 2: Add shared helper/component imports**

Add:

```ts
import { periodDisplayLabel } from '@/shared/lib/periodFilter';
import { PeriodFilterCard } from '@/shared/ui/PeriodFilterCard';
```

- [ ] **Step 3: Replace local period state with store selectors**

Remove:

```ts
  const [viewMode, setViewMode] = useState<ReportViewMode>('month');
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());
```

Add:

```ts
  const viewMode = useTransactionsStore((s) => s.periodMode);
  const selectedMonth = useTransactionsStore((s) => s.selectedMonth);
  const period = useTransactionsStore((s) => s.period);
  const setPeriodMode = useTransactionsStore((s) => s.setPeriodMode);
  const goToPreviousMonth = useTransactionsStore((s) => s.goToPreviousMonth);
  const goToNextMonth = useTransactionsStore((s) => s.goToNextMonth);
```

Remove the local `period = useMemo(...)` block.

- [ ] **Step 4: Replace the local filter card UI**

Replace the first `<Card>...</Card>` in the scroll view with:

```tsx
        <PeriodFilterCard
          mode={viewMode}
          selectedMonth={selectedMonth}
          onModeChange={(mode) => void setPeriodMode(mode)}
          onPreviousMonth={() => void goToPreviousMonth()}
          onNextMonth={() => void goToNextMonth()}
        />
```

- [ ] **Step 5: Keep report title logic typed against shared mode**

Change `reportTitle` signature:

```ts
function reportTitle(viewMode: PeriodMode) {
  if (viewMode === 'last12') return 'Últimos 12 meses';
  if (viewMode === 'year') return 'Ano atual';
  return 'Mês selecionado';
}
```

If `periodDisplayLabel` is unused after replacing the filter card, remove that import.

- [ ] **Step 6: Run report-related tests and typecheck**

Run:

```bash
npx jest src/features/reports/services/__tests__/aggregations.test.ts
npx tsc --noEmit
```

Expected: PASS.

---

### Task 7: Verification

**Files:**
- Verify all changed files

- [ ] **Step 1: Run focused unit tests**

Run:

```bash
npx jest src/shared/lib/__tests__/date.test.ts src/shared/lib/__tests__/periodFilter.test.ts src/features/reports/services/__tests__/aggregations.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full Jest suite**

Run:

```bash
npm test -- --ci
```

Expected: PASS.

- [ ] **Step 3: Run TypeScript validation**

Run:

```bash
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 4: Manually inspect labels in code**

Confirm these fixed strings no longer appear in dashboard or transactions:

```bash
Select-String -Path 'app/(tabs)/dashboard.tsx','app/(tabs)/transactions.tsx' -Pattern 'neste mês|neste mes|Neste mês|Neste mes'
```

Expected: no matches in those two files.

- [ ] **Step 5: Check git status**

Run:

```bash
git status --short
```

Expected: changed files match the planned files only.
