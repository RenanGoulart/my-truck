# Backup/Restore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir ao usuário exportar todos os dados do app em JSON via share sheet do SO e restaurar a partir de um JSON, com migrações de versão de schema, dupla confirmação e backup automático pré-restore.

**Architecture:** Nova fatia vertical em `src/features/backup/` com camadas `services/` (puro: schema zod, migrations entre versões, serialize/deserialize) + um wrapper fino que toca o `getDb()` para read/replace. Testes unitários cobrem somente camadas puras (jest roda em `node`, sem `expo-sqlite`). UI host em `app/settings/backup.tsx`.

**Tech Stack:** TypeScript, Expo (~54), expo-sqlite ~16, expo-router ~6, zod ^4, react-hook-form (já usado no resto do app), Jest 30 + ts-jest. Novas deps: `expo-file-system`, `expo-sharing`, `expo-document-picker`.

**Spec:** [`docs/superpowers/specs/2026-05-01-db-export-import-design.md`](../specs/2026-05-01-db-export-import-design.md).

**Convenções a seguir (CLAUDE.md):**
- Testes apenas em `src/**/__tests__/**/*.test.ts` (sem `.tsx`).
- `@/*` → `src/*`.
- Valores monetários em centavos.
- Schema zod novo deve ser declarado em `src/shared/lib/forms/schemas.ts` somente se for de **formulário**. Schemas internos da feature ficam em `src/features/backup/services/schema.ts`.
- Não editar migrations existentes.
- Tipagem validada via `npx tsc --noEmit`.

---

## File Structure

**Criar:**
- `src/features/backup/types.ts`
- `src/features/backup/services/rows.ts` — tipos `*Row` espelhando colunas SQL.
- `src/features/backup/services/schema.ts` — zod schemas versionados (`backupSchemaV1`, `backupSchemaV2`).
- `src/features/backup/services/migrations.ts` — `migrateBackup(file)`, lista de transformações puras.
- `src/features/backup/services/serialize.ts` — `serializeBackup(data, meta)` puro.
- `src/features/backup/services/exporter.ts` — `buildBackup()` lê DB e chama `serializeBackup`.
- `src/features/backup/services/importer.ts` — `applyBackup(rows)` executa replace transacional.
- `src/features/backup/services/backup-meta.ts` — last export timestamp via `expo-sqlite` (tabela `_backup_meta`) ou AsyncStorage. Decisão neste plano: tabela SQL nova via migration v3.
- `src/features/backup/services/file-io.ts` — wrappers de `expo-file-system` (write/read) e `expo-sharing` (share). Isolam IO para facilitar test.
- `src/features/backup/components/BackupCard.tsx`
- `src/features/backup/components/ExportButton.tsx`
- `src/features/backup/components/ImportFlow.tsx`
- `app/settings/backup.tsx`
- `src/db/migrations/003_backup_meta.ts` — cria tabela `_backup_meta`.
- `src/features/backup/__tests__/schema.test.ts`
- `src/features/backup/__tests__/migrations.test.ts`
- `src/features/backup/__tests__/serialize.test.ts`
- `src/features/backup/__tests__/migrations-fixtures.ts` — fixtures de backup v1, v2.
- `src/features/backup/__tests__/round-trip.test.ts`

**Modificar:**
- `src/db/migrations/index.ts` — registrar `migration003BackupMeta`.
- `app/settings/index.tsx` — adicionar entrada "Backup" na lista `ENTRIES`.
- `package.json` — adicionar deps.
- `CLAUDE.md` — adicionar nota sobre exceção em `exporter.ts` (toca `getDb()` fora de `repository/`).

**Notas:**
- Versão atual de schema do DB hoje = 2. Após migration 003, será 3. `CURRENT_BACKUP_SCHEMA = 3`.
- Tests cobrem apenas funções puras (serialize, migrations, schema validation). Exporter/importer SQL são wrappers finos testados manualmente em device.

---

## Task 1: Adicionar dependências do Expo

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Instalar deps com versões compatíveis ao SDK 54**

```bash
npx expo install expo-file-system expo-sharing expo-document-picker
```

Espera: `package.json` ganha as 3 deps com `~xx.x.x` compatível, `package-lock.json` atualizado.

- [ ] **Step 2: Verificar instalação**

```bash
npm ls expo-file-system expo-sharing expo-document-picker
```

Espera: 3 entradas resolvidas sem `UNMET DEPENDENCY`.

- [ ] **Step 3: TypeCheck**

```bash
npx tsc --noEmit
```

Espera: sem erros.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(backup): add expo-file-system, expo-sharing, expo-document-picker"
```

---

## Task 2: Migration 003 — tabela `_backup_meta`

**Files:**
- Create: `src/db/migrations/003_backup_meta.ts`
- Modify: `src/db/migrations/index.ts`

- [ ] **Step 1: Criar migration**

`src/db/migrations/003_backup_meta.ts`:

```ts
import type { Migration } from './index';

export const migration003BackupMeta: Migration = {
  version: 3,
  up: async (db) => {
    await db.execAsync(`
      CREATE TABLE _backup_meta (
        key TEXT PRIMARY KEY,
        value_int INTEGER,
        value_text TEXT,
        updated_at INTEGER NOT NULL
      );
    `);
  },
};
```

- [ ] **Step 2: Registrar na lista**

Modificar `src/db/migrations/index.ts`. Adicionar import e push no array:

```ts
import { migration001Init } from './001_init';
import { migration002Seed } from './002_seed';
import { migration003BackupMeta } from './003_backup_meta';

// ...
const migrations: Migration[] = [
  migration001Init,
  migration002Seed,
  migration003BackupMeta,
];
```

- [ ] **Step 3: TypeCheck**

```bash
npx tsc --noEmit
```

Espera: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/db/migrations/003_backup_meta.ts src/db/migrations/index.ts
git commit -m "feat(db): add _backup_meta table (migration 003)"
```

---

## Task 3: Tipos do domínio backup

**Files:**
- Create: `src/features/backup/types.ts`
- Create: `src/features/backup/services/rows.ts`

- [ ] **Step 1: Criar `rows.ts`**

`src/features/backup/services/rows.ts`:

```ts
export type TruckRow = {
  id: string;
  nickname: string;
  plate: string | null;
  initial_odometer: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
};

export type CategoryRow = {
  id: string;
  name: string;
  kind: 'income' | 'expense';
  icon: string | null;
  color: string | null;
  is_system: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
};

export type TransactionRow = {
  id: string;
  truck_id: string;
  category_id: string;
  kind: 'income' | 'expense';
  amount_cents: number;
  occurred_at: number;
  description: string | null;
  odometer: number | null;
  liters: number | null;
  price_per_liter_cents: number | null;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
  sync_status: 'pending' | 'synced' | 'conflict';
  server_id: string | null;
  server_updated_at: number | null;
};
```

- [ ] **Step 2: Criar `types.ts`**

`src/features/backup/types.ts`:

```ts
import type { CategoryRow, TransactionRow, TruckRow } from './services/rows';

export const CURRENT_BACKUP_SCHEMA = 3;

export type BackupPlatform = 'ios' | 'android' | 'web';

export type BackupFile = {
  app: 'my-truck';
  schemaVersion: number;
  exportedAt: number;
  exportedBy: { appVersion: string; platform: BackupPlatform };
  data: {
    trucks: TruckRow[];
    categories: CategoryRow[];
    transactions: TransactionRow[];
  };
};

export class BackupTooNewError extends Error {
  constructor(public got: number, public max: number) {
    super(`Backup schema v${got} is newer than app's v${max}. Update the app.`);
    this.name = 'BackupTooNewError';
  }
}

export class BackupInvalidError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackupInvalidError';
  }
}
```

- [ ] **Step 3: TypeCheck**

```bash
npx tsc --noEmit
```

Espera: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/features/backup/
git commit -m "feat(backup): add row + backup file types"
```

---

## Task 4: Schema zod versionado — TDD

**Files:**
- Create: `src/features/backup/__tests__/schema.test.ts`
- Create: `src/features/backup/services/schema.ts`

- [ ] **Step 1: Escrever teste falho**

`src/features/backup/__tests__/schema.test.ts`:

```ts
import { parseBackup } from '../services/schema';
import type { BackupFile } from '../types';

const validV3: BackupFile = {
  app: 'my-truck',
  schemaVersion: 3,
  exportedAt: 1730000000000,
  exportedBy: { appVersion: '1.0.0', platform: 'android' },
  data: { trucks: [], categories: [], transactions: [] },
};

describe('parseBackup', () => {
  test('aceita backup v3 vazio válido', () => {
    const out = parseBackup(validV3);
    expect(out.schemaVersion).toBe(3);
    expect(out.app).toBe('my-truck');
  });

  test('rejeita app diferente', () => {
    expect(() => parseBackup({ ...validV3, app: 'other' })).toThrow();
  });

  test('rejeita schemaVersion não numérico', () => {
    expect(() => parseBackup({ ...validV3, schemaVersion: 'x' })).toThrow();
  });

  test('rejeita campo data ausente', () => {
    const { data, ...rest } = validV3;
    expect(() => parseBackup(rest)).toThrow();
  });

  test('aceita backup v1 (categorias sem deleted_at)', () => {
    const v1 = {
      app: 'my-truck',
      schemaVersion: 1,
      exportedAt: 1,
      exportedBy: { appVersion: '0.1', platform: 'android' },
      data: {
        trucks: [
          {
            id: 't1',
            nickname: 'Caminhão',
            plate: null,
            initial_odometer: 0,
            created_at: 1,
            updated_at: 1,
            deleted_at: null,
          },
        ],
        categories: [],
        transactions: [],
      },
    };
    const out = parseBackup(v1);
    expect(out.schemaVersion).toBe(1);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
npx jest src/features/backup/__tests__/schema.test.ts
```

Espera: FAIL — `Cannot find module '../services/schema'`.

- [ ] **Step 3: Implementar schema**

`src/features/backup/services/schema.ts`:

```ts
import { z } from 'zod';

import { BackupInvalidError, type BackupFile } from '../types';

const truckRowV1 = z.object({
  id: z.string(),
  nickname: z.string(),
  plate: z.string().nullable(),
  initial_odometer: z.number(),
  created_at: z.number(),
  updated_at: z.number(),
  deleted_at: z.number().nullable(),
});

const categoryRowV1 = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(['income', 'expense']),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  is_system: z.number(),
  created_at: z.number(),
  updated_at: z.number(),
  deleted_at: z.number().nullable(),
});

const transactionRowV1 = z.object({
  id: z.string(),
  truck_id: z.string(),
  category_id: z.string(),
  kind: z.enum(['income', 'expense']),
  amount_cents: z.number(),
  occurred_at: z.number(),
  description: z.string().nullable(),
  odometer: z.number().nullable(),
  liters: z.number().nullable(),
  price_per_liter_cents: z.number().nullable(),
  created_at: z.number(),
  updated_at: z.number(),
  deleted_at: z.number().nullable(),
  sync_status: z.enum(['pending', 'synced', 'conflict']),
  server_id: z.string().nullable(),
  server_updated_at: z.number().nullable(),
});

const baseEnvelope = z.object({
  app: z.literal('my-truck'),
  schemaVersion: z.number().int().positive(),
  exportedAt: z.number(),
  exportedBy: z.object({
    appVersion: z.string(),
    platform: z.enum(['ios', 'android', 'web']),
  }),
  data: z.object({
    trucks: z.array(truckRowV1),
    categories: z.array(categoryRowV1),
    transactions: z.array(transactionRowV1),
  }),
});

export const parseBackup = (input: unknown): BackupFile => {
  const result = baseEnvelope.safeParse(input);
  if (!result.success) {
    throw new BackupInvalidError(`Backup inválido: ${result.error.message}`);
  }
  return result.data as BackupFile;
};
```

Nota: schema é tolerante o suficiente para v1/v2/v3 atuais (mesmas colunas). Quando uma migration de schema do DB futura mudar colunas, criar `truckRowV4` etc. e branch por `schemaVersion` antes do parse.

- [ ] **Step 4: Rodar e ver passar**

```bash
npx jest src/features/backup/__tests__/schema.test.ts
```

Espera: 5 tests PASS.

- [ ] **Step 5: TypeCheck**

```bash
npx tsc --noEmit
```

Espera: sem erros.

- [ ] **Step 6: Commit**

```bash
git add src/features/backup/__tests__/schema.test.ts src/features/backup/services/schema.ts
git commit -m "feat(backup): add zod schema validator for backup file"
```

---

## Task 5: Migrations entre versões de backup — TDD

**Files:**
- Create: `src/features/backup/__tests__/migrations.test.ts`
- Create: `src/features/backup/services/migrations.ts`

- [ ] **Step 1: Escrever teste falho**

`src/features/backup/__tests__/migrations.test.ts`:

```ts
import { migrateBackup } from '../services/migrations';
import { BackupTooNewError, CURRENT_BACKUP_SCHEMA, type BackupFile } from '../types';

const baseFile = (over: Partial<BackupFile>): BackupFile => ({
  app: 'my-truck',
  schemaVersion: CURRENT_BACKUP_SCHEMA,
  exportedAt: 0,
  exportedBy: { appVersion: '1.0', platform: 'android' },
  data: { trucks: [], categories: [], transactions: [] },
  ...over,
});

describe('migrateBackup', () => {
  test('passa intocado quando já está em CURRENT_BACKUP_SCHEMA', () => {
    const f = baseFile({});
    const out = migrateBackup(f);
    expect(out).toEqual({ ...f, schemaVersion: CURRENT_BACKUP_SCHEMA });
  });

  test('migra v1 → CURRENT', () => {
    const v1 = baseFile({ schemaVersion: 1 });
    const out = migrateBackup(v1);
    expect(out.schemaVersion).toBe(CURRENT_BACKUP_SCHEMA);
  });

  test('migra v2 → CURRENT', () => {
    const v2 = baseFile({ schemaVersion: 2 });
    const out = migrateBackup(v2);
    expect(out.schemaVersion).toBe(CURRENT_BACKUP_SCHEMA);
  });

  test('lança BackupTooNewError para versão > CURRENT', () => {
    const future = baseFile({ schemaVersion: CURRENT_BACKUP_SCHEMA + 1 });
    expect(() => migrateBackup(future)).toThrow(BackupTooNewError);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
npx jest src/features/backup/__tests__/migrations.test.ts
```

Espera: FAIL — `Cannot find module '../services/migrations'`.

- [ ] **Step 3: Implementar**

`src/features/backup/services/migrations.ts`:

```ts
import {
  BackupTooNewError,
  CURRENT_BACKUP_SCHEMA,
  type BackupFile,
} from '../types';

type Step = { from: number; to: number; up: (file: BackupFile) => BackupFile };

const steps: Step[] = [
  { from: 1, to: 2, up: (file) => ({ ...file, schemaVersion: 2 }) },
  { from: 2, to: 3, up: (file) => ({ ...file, schemaVersion: 3 }) },
];

export const migrateBackup = (input: BackupFile): BackupFile => {
  if (input.schemaVersion > CURRENT_BACKUP_SCHEMA) {
    throw new BackupTooNewError(input.schemaVersion, CURRENT_BACKUP_SCHEMA);
  }
  let cur = input;
  while (cur.schemaVersion < CURRENT_BACKUP_SCHEMA) {
    const step = steps.find((s) => s.from === cur.schemaVersion);
    if (!step) {
      throw new Error(`No migration step from v${cur.schemaVersion}`);
    }
    cur = step.up(cur);
  }
  return cur;
};
```

Nota: as migrations 1→2 e 2→3 são identidade hoje (somente bump de versão) porque migrations 002 e 003 do DB não alteraram colunas das 3 tabelas exportadas. Manter os steps explícitos para que migrations futuras tenham um lugar claro.

- [ ] **Step 4: Rodar e ver passar**

```bash
npx jest src/features/backup/__tests__/migrations.test.ts
```

Espera: 4 tests PASS.

- [ ] **Step 5: TypeCheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/features/backup/__tests__/migrations.test.ts src/features/backup/services/migrations.ts
git commit -m "feat(backup): add versioned backup migration pipeline"
```

---

## Task 6: Serialize puro — TDD

**Files:**
- Create: `src/features/backup/__tests__/serialize.test.ts`
- Create: `src/features/backup/services/serialize.ts`

- [ ] **Step 1: Escrever teste falho**

`src/features/backup/__tests__/serialize.test.ts`:

```ts
import { CURRENT_BACKUP_SCHEMA } from '../types';
import { serializeBackup } from '../services/serialize';
import type { TruckRow, CategoryRow, TransactionRow } from '../services/rows';

const truck: TruckRow = {
  id: 't1', nickname: 'C', plate: null, initial_odometer: 0,
  created_at: 1, updated_at: 1, deleted_at: null,
};

describe('serializeBackup', () => {
  test('monta envelope com schemaVersion atual', () => {
    const file = serializeBackup(
      { trucks: [truck], categories: [], transactions: [] },
      { exportedAt: 999, appVersion: '1.0.0', platform: 'android' }
    );
    expect(file.app).toBe('my-truck');
    expect(file.schemaVersion).toBe(CURRENT_BACKUP_SCHEMA);
    expect(file.exportedAt).toBe(999);
    expect(file.exportedBy.platform).toBe('android');
    expect(file.data.trucks).toHaveLength(1);
    expect(file.data.trucks[0]).toEqual(truck);
  });

  test('preserva ordem dos rows', () => {
    const cats: CategoryRow[] = [
      { id: 'a', name: 'A', kind: 'income', icon: null, color: null, is_system: 0, created_at: 1, updated_at: 1, deleted_at: null },
      { id: 'b', name: 'B', kind: 'expense', icon: null, color: null, is_system: 0, created_at: 2, updated_at: 2, deleted_at: null },
    ];
    const file = serializeBackup(
      { trucks: [], categories: cats, transactions: [] },
      { exportedAt: 1, appVersion: '1', platform: 'ios' }
    );
    expect(file.data.categories.map((c) => c.id)).toEqual(['a', 'b']);
  });

  test('inclui rows soft-deleted', () => {
    const tx: TransactionRow = {
      id: 'x', truck_id: 't1', category_id: 'c1', kind: 'expense',
      amount_cents: 100, occurred_at: 1, description: null, odometer: null,
      liters: null, price_per_liter_cents: null, created_at: 1, updated_at: 1,
      deleted_at: 999, sync_status: 'pending', server_id: null, server_updated_at: null,
    };
    const file = serializeBackup(
      { trucks: [], categories: [], transactions: [tx] },
      { exportedAt: 1, appVersion: '1', platform: 'web' }
    );
    expect(file.data.transactions[0].deleted_at).toBe(999);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
npx jest src/features/backup/__tests__/serialize.test.ts
```

Espera: FAIL — módulo não existe.

- [ ] **Step 3: Implementar**

`src/features/backup/services/serialize.ts`:

```ts
import { CURRENT_BACKUP_SCHEMA, type BackupFile, type BackupPlatform } from '../types';
import type { CategoryRow, TransactionRow, TruckRow } from './rows';

export type SerializeData = {
  trucks: TruckRow[];
  categories: CategoryRow[];
  transactions: TransactionRow[];
};

export type SerializeMeta = {
  exportedAt: number;
  appVersion: string;
  platform: BackupPlatform;
};

export const serializeBackup = (
  data: SerializeData,
  meta: SerializeMeta
): BackupFile => ({
  app: 'my-truck',
  schemaVersion: CURRENT_BACKUP_SCHEMA,
  exportedAt: meta.exportedAt,
  exportedBy: { appVersion: meta.appVersion, platform: meta.platform },
  data,
});
```

- [ ] **Step 4: Rodar e ver passar**

```bash
npx jest src/features/backup/__tests__/serialize.test.ts
```

Espera: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/backup/__tests__/serialize.test.ts src/features/backup/services/serialize.ts
git commit -m "feat(backup): add pure serializeBackup builder"
```

---

## Task 7: Round-trip parse → migrate → serialize

**Files:**
- Create: `src/features/backup/__tests__/round-trip.test.ts`

- [ ] **Step 1: Escrever teste**

`src/features/backup/__tests__/round-trip.test.ts`:

```ts
import { migrateBackup } from '../services/migrations';
import { parseBackup } from '../services/schema';
import { serializeBackup } from '../services/serialize';
import { CURRENT_BACKUP_SCHEMA } from '../types';
import type { TruckRow } from '../services/rows';

const truck: TruckRow = {
  id: 't1', nickname: 'X', plate: 'ABC1D23', initial_odometer: 50000,
  created_at: 1, updated_at: 1, deleted_at: null,
};

describe('round-trip', () => {
  test('serialize → JSON → parse → migrate retorna dados equivalentes', () => {
    const original = serializeBackup(
      { trucks: [truck], categories: [], transactions: [] },
      { exportedAt: 1234, appVersion: '1.0.0', platform: 'android' }
    );
    const json = JSON.stringify(original);
    const parsed = parseBackup(JSON.parse(json));
    const migrated = migrateBackup(parsed);
    expect(migrated.schemaVersion).toBe(CURRENT_BACKUP_SCHEMA);
    expect(migrated.data.trucks).toEqual([truck]);
    expect(migrated.exportedAt).toBe(1234);
  });

  test('JSON é estável (idempotente quando re-serializado)', () => {
    const file = serializeBackup(
      { trucks: [truck], categories: [], transactions: [] },
      { exportedAt: 1, appVersion: '1', platform: 'ios' }
    );
    const a = JSON.stringify(file);
    const b = JSON.stringify(parseBackup(JSON.parse(a)));
    expect(a).toBe(b);
  });
});
```

- [ ] **Step 2: Rodar**

```bash
npx jest src/features/backup/__tests__/round-trip.test.ts
```

Espera: 2 tests PASS.

- [ ] **Step 3: Rodar suite completa**

```bash
npm test -- --ci
```

Espera: todos verde.

- [ ] **Step 4: Commit**

```bash
git add src/features/backup/__tests__/round-trip.test.ts
git commit -m "test(backup): add round-trip serialize/parse/migrate test"
```

---

## Task 8: Exporter — leitura SQL

**Files:**
- Create: `src/features/backup/services/exporter.ts`

- [ ] **Step 1: Implementar**

`src/features/backup/services/exporter.ts`:

```ts
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { getDb } from '@/db/client';

import { serializeBackup } from './serialize';
import type { CategoryRow, TransactionRow, TruckRow } from './rows';
import type { BackupFile, BackupPlatform } from '../types';

const detectPlatform = (): BackupPlatform => {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
};

export const buildBackup = async (): Promise<BackupFile> => {
  const db = await getDb();
  const trucks = await db.getAllAsync<TruckRow>('SELECT * FROM trucks');
  const categories = await db.getAllAsync<CategoryRow>('SELECT * FROM categories');
  const transactions = await db.getAllAsync<TransactionRow>('SELECT * FROM transactions');
  const appVersion =
    (Constants.expoConfig?.version as string | undefined) ?? '0.0.0';
  return serializeBackup(
    { trucks, categories, transactions },
    { exportedAt: Date.now(), appVersion, platform: detectPlatform() }
  );
};
```

- [ ] **Step 2: TypeCheck**

```bash
npx tsc --noEmit
```

Espera: sem erros. Se reclamar de `expo-constants`, conferir se está nas deps (já está em `package.json`).

- [ ] **Step 3: Commit**

```bash
git add src/features/backup/services/exporter.ts
git commit -m "feat(backup): add buildBackup exporter reading from sqlite"
```

---

## Task 9: Importer — replace transacional

**Files:**
- Create: `src/features/backup/services/importer.ts`

- [ ] **Step 1: Implementar**

`src/features/backup/services/importer.ts`:

```ts
import { getDb } from '@/db/client';

import type { BackupFile } from '../types';
import type { CategoryRow, TransactionRow, TruckRow } from './rows';

const insertTruck = async (db: Awaited<ReturnType<typeof getDb>>, t: TruckRow) => {
  await db.runAsync(
    `INSERT INTO trucks
     (id, nickname, plate, initial_odometer, created_at, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [t.id, t.nickname, t.plate, t.initial_odometer, t.created_at, t.updated_at, t.deleted_at]
  );
};

const insertCategory = async (
  db: Awaited<ReturnType<typeof getDb>>,
  c: CategoryRow
) => {
  await db.runAsync(
    `INSERT INTO categories
     (id, name, kind, icon, color, is_system, created_at, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [c.id, c.name, c.kind, c.icon, c.color, c.is_system, c.created_at, c.updated_at, c.deleted_at]
  );
};

const insertTransaction = async (
  db: Awaited<ReturnType<typeof getDb>>,
  t: TransactionRow
) => {
  await db.runAsync(
    `INSERT INTO transactions
     (id, truck_id, category_id, kind, amount_cents, occurred_at,
      description, odometer, liters, price_per_liter_cents,
      created_at, updated_at, deleted_at, sync_status, server_id, server_updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      t.id, t.truck_id, t.category_id, t.kind, t.amount_cents, t.occurred_at,
      t.description, t.odometer, t.liters, t.price_per_liter_cents,
      t.created_at, t.updated_at, t.deleted_at, t.sync_status, t.server_id, t.server_updated_at,
    ]
  );
};

export const applyBackup = async (file: BackupFile): Promise<void> => {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM transactions; DELETE FROM categories; DELETE FROM trucks;');
    for (const t of file.data.trucks) await insertTruck(db, t);
    for (const c of file.data.categories) await insertCategory(db, c);
    for (const t of file.data.transactions) await insertTransaction(db, t);
  });
};
```

- [ ] **Step 2: TypeCheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/features/backup/services/importer.ts
git commit -m "feat(backup): add applyBackup transactional importer"
```

---

## Task 10: backup-meta (last-export timestamp)

**Files:**
- Create: `src/features/backup/services/backup-meta.ts`

- [ ] **Step 1: Implementar**

`src/features/backup/services/backup-meta.ts`:

```ts
import { getDb } from '@/db/client';

const KEY_LAST_EXPORT = 'last_export_at';

export const setLastExport = async (timestamp: number): Promise<void> => {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO _backup_meta (key, value_int, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value_int = excluded.value_int, updated_at = excluded.updated_at`,
    [KEY_LAST_EXPORT, timestamp, Date.now()]
  );
};

export const getLastExport = async (): Promise<number | null> => {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value_int: number | null }>(
    'SELECT value_int FROM _backup_meta WHERE key = ?',
    [KEY_LAST_EXPORT]
  );
  return row?.value_int ?? null;
};
```

- [ ] **Step 2: TypeCheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/features/backup/services/backup-meta.ts
git commit -m "feat(backup): persist last-export timestamp in _backup_meta"
```

---

## Task 11: file-io wrappers (FS + sharing + picker)

**Files:**
- Create: `src/features/backup/services/file-io.ts`

- [ ] **Step 1: Implementar**

`src/features/backup/services/file-io.ts`:

```ts
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const PRE_RESTORE_DIR = `${FileSystem.documentDirectory}pre-restore/`;
const MAX_PRE_RESTORE = 3;

export const writeJsonToCache = async (
  filename: string,
  json: string
): Promise<string> => {
  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return uri;
};

export const shareFile = async (uri: string): Promise<void> => {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Compartilhamento indisponível neste dispositivo');
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: 'Salvar backup',
  });
};

export const pickJsonFile = async (): Promise<string | null> => {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const asset = result.assets?.[0];
  if (!asset) return null;
  return FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
};

const ensurePreRestoreDir = async (): Promise<void> => {
  const info = await FileSystem.getInfoAsync(PRE_RESTORE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PRE_RESTORE_DIR, { intermediates: true });
  }
};

export const writePreRestore = async (json: string): Promise<string> => {
  await ensurePreRestoreDir();
  const filename = `pre-restore-${Date.now()}.json`;
  const uri = `${PRE_RESTORE_DIR}${filename}`;
  await FileSystem.writeAsStringAsync(uri, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  await rotatePreRestore();
  return uri;
};

const rotatePreRestore = async (): Promise<void> => {
  const files = await FileSystem.readDirectoryAsync(PRE_RESTORE_DIR);
  if (files.length <= MAX_PRE_RESTORE) return;
  const sorted = files.sort();
  const toDelete = sorted.slice(0, files.length - MAX_PRE_RESTORE);
  await Promise.all(
    toDelete.map((f) => FileSystem.deleteAsync(`${PRE_RESTORE_DIR}${f}`, { idempotent: true }))
  );
};
```

- [ ] **Step 2: TypeCheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/features/backup/services/file-io.ts
git commit -m "feat(backup): add file-io wrappers for FS, sharing, picker"
```

---

## Task 12: ExportButton component

**Files:**
- Create: `src/features/backup/components/ExportButton.tsx`

- [ ] **Step 1: Implementar**

`src/features/backup/components/ExportButton.tsx`:

```tsx
import { useState } from 'react';
import { Alert, Pressable, Text } from 'react-native';

import { setLastExport } from '../services/backup-meta';
import { buildBackup } from '../services/exporter';
import { shareFile, writeJsonToCache } from '../services/file-io';

const dateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;

type Props = {
  onExported?: () => void;
};

export const ExportButton = ({ onExported }: Props) => {
  const [busy, setBusy] = useState(false);

  const onPress = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const file = await buildBackup();
      const filename = `my-truck-backup-${dateStr(new Date(file.exportedAt))}.json`;
      const uri = await writeJsonToCache(filename, JSON.stringify(file, null, 2));
      await shareFile(uri);
      await setLastExport(file.exportedAt);
      onExported?.();
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha ao exportar');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      className="bg-primary rounded-2xl py-4 px-4 items-center"
    >
      <Text className="text-black font-semibold">
        {busy ? 'Exportando…' : 'Exportar dados'}
      </Text>
    </Pressable>
  );
};
```

- [ ] **Step 2: TypeCheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/features/backup/components/ExportButton.tsx
git commit -m "feat(backup): add ExportButton component"
```

---

## Task 13: ImportFlow component

**Files:**
- Create: `src/features/backup/components/ImportFlow.tsx`

- [ ] **Step 1: Implementar**

`src/features/backup/components/ImportFlow.tsx`:

```tsx
import { useState } from 'react';
import { Alert, Pressable, Text } from 'react-native';

import { useCategoriesStore } from '@/features/categories/store/categories.store';
import { useTransactionsStore } from '@/features/transactions/store/transactions.store';
import { useTruckStore } from '@/features/truck/store/truck.store';

import { buildBackup } from '../services/exporter';
import { applyBackup } from '../services/importer';
import {
  pickJsonFile,
  shareFile,
  writePreRestore,
} from '../services/file-io';
import { migrateBackup } from '../services/migrations';
import { parseBackup } from '../services/schema';
import { BackupTooNewError, BackupInvalidError, type BackupFile } from '../types';

const counts = (file: BackupFile) =>
  `${file.data.trucks.length} caminhão(ões), ${file.data.categories.length} categoria(s), ${file.data.transactions.length} transação(ões)`;

const confirmAsync = (title: string, message: string, confirmLabel: string) =>
  new Promise<boolean>((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });

export const ImportFlow = () => {
  const [busy, setBusy] = useState(false);
  const reloadTruck = useTruckStore((s) => s.load);
  const reloadCategories = useCategoriesStore((s) => s.load);
  const reloadTransactions = useTransactionsStore((s) => s.load);

  const onPress = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const json = await pickJsonFile();
      if (json === null) return;

      let file: BackupFile;
      try {
        const parsed = parseBackup(JSON.parse(json));
        file = migrateBackup(parsed);
      } catch (e) {
        if (e instanceof BackupTooNewError) {
          Alert.alert('Backup mais novo', 'Atualize o app antes de importar.');
          return;
        }
        if (e instanceof BackupInvalidError) {
          Alert.alert('Arquivo inválido', 'O arquivo selecionado não é um backup válido.');
          return;
        }
        throw e;
      }

      const ok1 = await confirmAsync(
        'Confirmar restauração',
        `Vai substituir TODOS os dados por: ${counts(file)}.\nEsta ação NÃO pode ser desfeita.`,
        'Continuar'
      );
      if (!ok1) return;

      const current = await buildBackup();
      const preUri = await writePreRestore(JSON.stringify(current, null, 2));
      await shareFile(preUri);

      const ok2 = await confirmAsync(
        'Aplicar restore',
        'Backup do estado atual salvo. Aplicar restore agora?',
        'Aplicar'
      );
      if (!ok2) return;

      await applyBackup(file);
      await Promise.all([reloadTruck(), reloadCategories(), reloadTransactions()]);
      Alert.alert('Sucesso', 'Dados restaurados.');
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha ao importar');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      className="bg-surface border border-border rounded-2xl py-4 px-4 items-center"
    >
      <Text className="text-white font-semibold">
        {busy ? 'Importando…' : 'Importar backup'}
      </Text>
    </Pressable>
  );
};
```

Nota: confirmar nomes exatos de stores antes de implementar — abrir `src/features/truck/store/truck.store.ts`, `categories.store.ts`, `transactions.store.ts` e ajustar import path/method `load` se necessário.

- [ ] **Step 2: Verificar paths e methods de store**

```bash
ls src/features/truck/store src/features/categories/store src/features/transactions/store
```

Inspecionar cada arquivo: confirmar que existe action `load()` no zustand store. Se nome for diferente (ex.: `hydrate`, `reload`), ajustar `ImportFlow.tsx` antes do TypeCheck.

- [ ] **Step 3: TypeCheck**

```bash
npx tsc --noEmit
```

Espera: sem erros. Se reclamar dos imports de store, corrigir.

- [ ] **Step 4: Commit**

```bash
git add src/features/backup/components/ImportFlow.tsx
git commit -m "feat(backup): add ImportFlow with double confirmation and pre-restore backup"
```

---

## Task 14: BackupCard (status "última export há X dias")

**Files:**
- Create: `src/features/backup/components/BackupCard.tsx`

- [ ] **Step 1: Implementar**

`src/features/backup/components/BackupCard.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { getLastExport } from '../services/backup-meta';

const formatAge = (last: number | null): string => {
  if (last === null) return 'Nenhuma exportação feita ainda';
  const days = Math.floor((Date.now() - last) / (24 * 60 * 60 * 1000));
  if (days === 0) return 'Última exportação: hoje';
  if (days === 1) return 'Última exportação: 1 dia atrás';
  return `Última exportação: ${days} dias atrás`;
};

type Props = { reloadKey?: number };

export const BackupCard = ({ reloadKey = 0 }: Props) => {
  const [last, setLast] = useState<number | null>(null);

  useEffect(() => {
    void getLastExport().then(setLast);
  }, [reloadKey]);

  const stale = last !== null && Date.now() - last > 30 * 24 * 60 * 60 * 1000;

  return (
    <View className={`rounded-2xl px-4 py-4 border ${stale ? 'border-amber-400 bg-amber-500/10' : 'border-border bg-surface'}`}>
      <Text className="text-white text-sm">{formatAge(last)}</Text>
      <Text className="text-muted text-xs mt-1">
        Sem backup, perda do dispositivo = perda dos dados.
      </Text>
    </View>
  );
};
```

- [ ] **Step 2: TypeCheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/features/backup/components/BackupCard.tsx
git commit -m "feat(backup): add BackupCard with last-export status"
```

---

## Task 15: Tela `app/settings/backup.tsx`

**Files:**
- Create: `app/settings/backup.tsx`

- [ ] **Step 1: Implementar**

`app/settings/backup.tsx`:

```tsx
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { BackupCard } from '@/features/backup/components/BackupCard';
import { ExportButton } from '@/features/backup/components/ExportButton';
import { ImportFlow } from '@/features/backup/components/ImportFlow';
import { Screen } from '@/shared/ui/Screen';

export default function BackupSettings() {
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <>
      <Stack.Screen options={{ title: 'Backup' }} />
      <Screen>
        <View className="mt-4 gap-4">
          <BackupCard reloadKey={reloadKey} />
          <ExportButton onExported={() => setReloadKey((k) => k + 1)} />
          <ImportFlow />
          <Text className="text-muted text-xs px-2">
            O arquivo gerado não é criptografado. Guarde em local seguro.
          </Text>
        </View>
      </Screen>
    </>
  );
}
```

- [ ] **Step 2: TypeCheck**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add app/settings/backup.tsx
git commit -m "feat(backup): add settings/backup screen"
```

---

## Task 16: Adicionar entrada "Backup" no settings hub

**Files:**
- Modify: `app/settings/index.tsx`

- [ ] **Step 1: Adicionar entry**

Editar `app/settings/index.tsx`. Adicionar item ao final do array `ENTRIES`:

```ts
{
  title: 'Backup',
  subtitle: 'Exportar e restaurar dados',
  icon: 'save',
  href: '/settings/backup',
},
```

Antes:
```ts
const ENTRIES: Entry[] = [
  {
    title: 'Caminhão',
    subtitle: 'Apelido, placa e odômetro inicial',
    icon: 'car',
    href: '/settings/truck',
  },
  {
    title: 'Categorias',
    subtitle: 'Criar e gerenciar categorias',
    icon: 'appstore',
    href: '/settings/categories',
  },
];
```

Depois:
```ts
const ENTRIES: Entry[] = [
  {
    title: 'Caminhão',
    subtitle: 'Apelido, placa e odômetro inicial',
    icon: 'car',
    href: '/settings/truck',
  },
  {
    title: 'Categorias',
    subtitle: 'Criar e gerenciar categorias',
    icon: 'appstore',
    href: '/settings/categories',
  },
  {
    title: 'Backup',
    subtitle: 'Exportar e restaurar dados',
    icon: 'save',
    href: '/settings/backup',
  },
];
```

- [ ] **Step 2: TypeCheck**

```bash
npx tsc --noEmit
```

Espera: sem erros. Se `'save'` não for um ícone válido de `AntDesign`, escolher outro (ex.: `'cloudo'`, `'download'`).

- [ ] **Step 3: Commit**

```bash
git add app/settings/index.tsx
git commit -m "feat(settings): add Backup entry to settings hub"
```

---

## Task 17: Atualizar CLAUDE.md com nota da exceção

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Adicionar nota na seção "Camadas"**

Localizar bloco `- src/features/<domínio>/` e, na seção logo abaixo (após enumerar `repository`/`store`/`services`/`components`), adicionar:

```markdown
- **Exceção:** `src/features/backup/services/exporter.ts` lê o banco direto via `getDb()` por necessidade (leitura crua de tabelas inteiras para o formato de backup). Toda outra feature continua passando por `repository/`.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: register backup exporter as exception to repository rule"
```

---

## Task 18: Validação final — testes, typecheck, smoke manual

**Files:** _(nenhum modificado)_

- [ ] **Step 1: Suite de testes completa**

```bash
npm test -- --ci
```

Espera: todos PASS, incluindo os novos:
- `src/features/backup/__tests__/schema.test.ts`
- `src/features/backup/__tests__/migrations.test.ts`
- `src/features/backup/__tests__/serialize.test.ts`
- `src/features/backup/__tests__/round-trip.test.ts`

- [ ] **Step 2: TypeCheck**

```bash
npx tsc --noEmit
```

Espera: sem erros.

- [ ] **Step 3: Smoke manual em dev client**

```bash
npm start
```

No app:
1. Settings → Backup → Exportar dados → share sheet abre → salvar arquivo.
2. Modificar dado (criar 1 transação nova).
3. Settings → Backup → Importar backup → selecionar arquivo do passo 1 → confirmar 1 → share sheet do auto-backup → salvar/dispensar → confirmar 2 → restore aplicado.
4. Verificar que a transação criada no passo 2 sumiu (replace funcionou).
5. Conferir badge "última exportação" mostra "hoje" após export.
6. Tentar importar arquivo JSON arbitrário (não-backup) → erro "Arquivo inválido".

- [ ] **Step 4: Branch limpo**

```bash
git status
```

Espera: `working tree clean`.

---

## Self-Review (preenchido)

**Spec coverage:**
- [x] Manual export — Task 12
- [x] Manual import — Task 13
- [x] Share sheet — Task 11/12
- [x] JSON puro versionado — Task 6 + 4
- [x] Replace + dupla confirmação — Task 13
- [x] Schema migrations — Task 5
- [x] Backup pré-restore com share + rotação 3 — Task 11/13
- [x] Sem auto, badge "X dias" — Task 14
- [x] Soft-deleted incluídos — Task 6 (test)
- [x] Aviso "não é criptografado" — Task 15
- [x] Validação zod previne lixo — Task 4

**Placeholder scan:** sem TBD/TODO. Nota explícita em Task 13 sobre verificar nomes de actions de store antes de TypeCheck (melhor que assumir).

**Type consistency:** `BackupFile`, `TruckRow`/`CategoryRow`/`TransactionRow`, `BackupTooNewError`, `BackupInvalidError`, `CURRENT_BACKUP_SCHEMA`, `parseBackup`, `migrateBackup`, `serializeBackup`, `buildBackup`, `applyBackup`, `setLastExport`, `getLastExport`, `writeJsonToCache`, `shareFile`, `pickJsonFile`, `writePreRestore` — todos consistentes entre tasks.

---

## Out of Scope (não implementar neste plano)

- Criptografia do JSON.
- Backup automático em background.
- Integração direta Google Drive (substituída por share sheet).
- Restore com merge por ID.
- Sync com servidor.
