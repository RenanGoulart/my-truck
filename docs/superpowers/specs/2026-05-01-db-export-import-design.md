# Backup/Restore — Export/Import do banco em JSON

**Data:** 2026-05-01
**Status:** Design aprovado, aguardando plano de implementação
**Origem:** Brainstorming (`/superpowers:brainstorming`) — solicitado por usuário como recurso de segurança/portabilidade dos dados locais.

## Contexto

O app é single-user, dados 100% locais em SQLite (`my-truck.db`). Não há backend nem sync. O DB **não é criptografado** (decisão documentada em `CLAUDE.md > Segurança`). Sem backup, perda do dispositivo = perda total dos dados. Esta feature dá ao usuário controle manual sobre backup e portabilidade.

## Decisões tomadas no brainstorming

| # | Decisão | Escolha |
|---|---------|---------|
| Q1 | Trigger | Manual export + manual import (restore) |
| Q2 | Destino do arquivo | Share sheet do SO (`expo-sharing`) — usuário escolhe destino (Drive, email, WhatsApp etc.) |
| Q3 | Formato | JSON puro com schema versionado |
| Q4 | Comportamento de restore | Replace destrutivo + dupla confirmação + backup automático pré-restore |
| Q5 | Schema migrations | `schemaVersion` no JSON; restore migra versões antigas para a atual; rejeita versões mais novas |
| Q6 | Backup pré-restore | Persiste em `documentDirectory/pre-restore/`, mantém últimos 3, força share sheet (usuário deve salvar fora antes de aplicar) |
| Q7 | Agendamento auto | Sem auto. Apenas badge "última export há X dias" no settings como lembrete |
| Q8 | Soft-deleted records | Incluídos no export (preserva histórico fielmente) |

## Arquitetura

Nova fatia vertical isolada em `src/features/backup/`, alinhada com a convenção de fatia por domínio do projeto.

```
src/features/backup/
  types.ts                    # BackupFile, BackupSchemaVersion
  services/
    exporter.ts               # buildBackup(): Promise<BackupFile>
    importer.ts               # applyBackup(file): replace transacional
    migrations.ts             # migrateBackup(file): upgrade até versão atual
    schema.ts                 # zod schemas versionados
    backup-meta.ts            # last-export timestamp persistente
  components/
    BackupCard.tsx            # mostra "última export há X dias"
    ExportButton.tsx          # gera JSON + share sheet
    ImportFlow.tsx            # picker → preview → confirm1 → backup auto → confirm2 → apply
app/settings/backup.tsx       # tela host
src/db/reset.ts               # dropAllData() consumido pelo importer
```

**Exceção arquitetural:** `exporter.ts` lê o banco diretamente via `getDb()`, fora de `repository/`. Justificativa: backup é leitura crua de tabelas inteiras; usar repos forçaria N chamadas e reconstrução de tipos. Esta exceção deve ser anotada em `CLAUDE.md` quando a feature for implementada.

## Formato JSON

```ts
type BackupFile = {
  app: 'my-truck';
  schemaVersion: number;        // espelha versão da migration do DB
  exportedAt: number;           // epoch ms
  exportedBy: { appVersion: string; platform: 'ios' | 'android' | 'web' };
  data: {
    trucks: TruckRow[];
    categories: CategoryRow[];
    transactions: TransactionRow[];
  };
};
```

- `*Row` = espelho 1:1 da tabela SQL (snake_case keys, ints/strings raw como vêm do `expo-sqlite`).
- Inclui registros com `deleted_at != NULL`.
- Inclui colunas preparadas para sync futuro: `sync_status`, `server_id`, `server_updated_at`.
- Validação via zod em `services/schema.ts` — schema versionado por arquivo: `backupSchemaV1`, `backupSchemaV2`, ...
- Nome do arquivo: `my-truck-backup-YYYY-MM-DD-HHmm.json`.
- Encoding UTF-8, JSON pretty (2 espaços) para inspeção humana.

## Fluxo de Export

1. Usuário toca "Exportar dados" em `app/settings/backup.tsx`.
2. `buildBackup()` executa `SELECT * FROM trucks/categories/transactions` e monta `BackupFile` com `schemaVersion = CURRENT_SCHEMA`.
3. `JSON.stringify(file, null, 2)` → `expo-file-system.writeAsStringAsync(cacheDirectory + filename, json)`.
4. `expo-sharing.shareAsync(uri, { mimeType: 'application/json', UTI: 'public.json' })`.
5. `backup-meta.setLastExport(now)` atualiza badge.

**Erros:**
- DB read fail → toast "Falha ao ler dados".
- Disk write fail → toast "Falha ao salvar arquivo".
- Share cancelado pelo usuário → silencioso.

Sem retry automático.

## Fluxo de Import (Restore)

1. Usuário toca "Importar backup".
2. `expo-document-picker.pickAsync({ type: 'application/json' })` → uri.
3. `readAsStringAsync(uri)` → `JSON.parse` → parse progressivo:
   - Detecta `schemaVersion`.
   - Se `schemaVersion > CURRENT_SCHEMA` → erro `BackupTooNewError` ("Backup mais novo que app, atualize o app").
   - Aplica zod schema correspondente à versão.
4. `migrateBackup(file)`: roda transformações sequenciais v1→v2→...→CURRENT_SCHEMA. Funções puras, espelhando `src/db/migrations/`.
5. **PreviewModal** mostra contagens (caminhões, categorias, transações) e range de datas.
6. **Confirm 1:** "Substituir TODOS os dados? Esta ação NÃO PODE ser desfeita." `[Cancelar | Continuar]`.
7. **Auto-backup pré-restore:**
   - `buildBackup()` do estado atual.
   - Salva em `documentDirectory/pre-restore/pre-restore-{timestamp}.json`.
   - Mantém últimos 3 (apaga mais antigos por mtime).
   - Share sheet automático bloqueia até usuário fechar (força salvar fora).
8. **Confirm 2:** "Backup do estado atual salvo. Aplicar restore agora?" `[Cancelar | Aplicar]`.
9. `applyBackup(file)` em transação SQL única:
   ```sql
   BEGIN;
     DELETE FROM transactions;
     DELETE FROM categories;
     DELETE FROM trucks;
     INSERT INTO trucks ...;
     INSERT INTO categories ...;
     INSERT INTO transactions ...;
   COMMIT;  -- rollback automático em qualquer erro
   ```
10. Hidrata stores: chama `load()` em `truckStore`, `categoriesStore`, `transactionsStore`.
11. Toast sucesso + navega para dashboard.

**Erros:**
- JSON inválido → "Arquivo não é backup válido".
- Schema versão > atual → "Atualize o app".
- Migration falha → "Não foi possível migrar backup vN→atual".
- SQL transaction falha → rollback + toast "Restore falhou, dados não alterados. Backup pré-restore preservado em [path]".

## Testes

Unit tests em `src/features/backup/__tests__/*.test.ts` (apenas `.ts` per CLAUDE.md).

- **`exporter.test.ts`**
  - DB com fixtures → `buildBackup()` retorna shape esperado.
  - Inclui registros soft-deleted.
  - `schemaVersion = CURRENT_SCHEMA`.
  - `exportedAt` é número recente.
- **`schema.test.ts`**
  - zod aceita backups válidos v1, v2, vCURRENT.
  - Rejeita JSON com campo faltando.
  - Rejeita `app != 'my-truck'`.
  - Rejeita `schemaVersion` não-numérico.
- **`migrations.test.ts`**
  - v1→vCURRENT roda transformações em ordem.
  - Backup já em vCURRENT passa intocado.
  - Versão > CURRENT lança `BackupTooNewError`.
- **`importer.test.ts`**
  - `applyBackup` substitui dados existentes.
  - Rollback em erro: dados originais preservados (mock de erro no meio do INSERT).
  - Round-trip: export → import → export gera JSON idêntico (módulo `exportedAt`).
- **`backup-meta.test.ts`**
  - `setLastExport` / `getLastExport` persistem.

Helpers:
- `createTestDb()` em memória — criar em `src/db/test-utils.ts` se ainda não existir.
- Fixtures de backup v1, v2 em `__fixtures__/`.

Sem testes E2E de UI nem do share sheet (requer device, fora de escopo).

## Dependências novas

- `expo-sharing` — share sheet do SO. **Nova dependência.**
- `expo-document-picker` — selecionar JSON para import. **Nova dependência.**
- `expo-file-system` — leitura/escrita de arquivos. **Nova dependência** (não está em `package.json`).

## Fora de escopo

- Criptografia do arquivo de backup (decisão de risco já documentada em `CLAUDE.md > Segurança`).
- Backup automático em background.
- Integração direta com Google Drive (substituída pelo share sheet).
- Restore com merge por ID (substituído por replace destrutivo).
- Sync com servidor (campos `sync_status` etc. já existem mas seguem inativos).

## Notas de segurança

- O JSON exportado contém todos os dados do usuário em texto claro. Avisar isso na tela de export ("O arquivo gerado não é criptografado").
- O backup pré-restore também é texto claro e fica em `documentDirectory` — limpá-lo por rotação (últimos 3) limita exposição.
- Validação zod no import bloqueia injeção via JSON malformado; mas como o restore executa SQL parametrizado a partir dos rows, não há vetor de injeção mesmo se o JSON for hostil.
