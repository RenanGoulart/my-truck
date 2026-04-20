# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Diretrizes de código

- Todo código deve ser testável.
- Escrever comentários apenas quando o código for muito complexo e não puder ser entendido sem eles.

## Comandos

- `npm start` — inicia o Expo dev server (`npm run android` / `ios` / `web` para targets específicos).
- `npm test` — roda Jest. Testes ficam em `src/**/__tests__/*.test.ts` (apenas `.ts`, sem `.tsx`).
- Para um único teste: `npx jest caminho/do/arquivo.test.ts` ou `npx jest -t "nome do teste"`.
- Não há script de lint configurado; tipagem é validada via `npx tsc --noEmit`.

## Arquitetura

App Expo Router (React Native + NativeWind) com persistência local em SQLite (`expo-sqlite`) e estado em Zustand. Não há backend — tudo vive no dispositivo.

### Camadas

- `app/` — rotas Expo Router. `_layout.tsx` envolve tudo em `DbProvider` → `StoresHydrator`. `index.tsx` decide onboarding vs tabs.
- `src/db/` — singleton em `client.ts` (`getDb()` abre o banco, ativa foreign keys/WAL, e roda migrações). Migrações sequenciais em `migrations/` aplicadas via `runMigrations`. Toda query passa por `getDb()`.
- `src/app-providers/` — `DbProvider` garante inicialização do banco antes de renderizar filhos; `StoresHydrator` carrega truck/categorias/transações iniciais e propaga `truckId` para os outros stores.
- `src/features/<domínio>/` — fatia vertical por domínio (`truck`, `categories`, `transactions`, `dashboard`, `reports`). Padrão:
  - `types.ts` — tipos do domínio.
  - `repository/` — acesso SQL puro, única camada que fala com `getDb()`.
  - `store/` — Zustand store que orquestra o repositório e expõe ações para a UI. Stores dependem de `truckId` ser setado antes de `load()`.
  - `services/` — lógica pura (agregações, cálculos) usada por dashboard/reports. Devem ser puras e unit-testáveis sem banco.
  - `components/` — UI específica da feature.
- `src/shared/` — `ui/` (componentes reusáveis), `lib/` (helpers puros: datas, moeda, schemas de formulário em `lib/forms/`), `hooks/`, `theme/`.

### Fluxo de dados

UI → store (Zustand) → repository (SQL) → SQLite. Totais e derivações ficam no store (ex.: `incomeCents`/`expenseCents` em `transactions.store`) ou em `services/` puros quando reaproveitados entre telas. Valores monetários são armazenados e manipulados em **centavos** (inteiros).

### Formulários

- Todos os formulários usam **react-hook-form** + **zod** (via `@hookform/resolvers/zod`).
- Schemas compartilhados ficam em `src/shared/lib/forms/schemas.ts` (um schema por domínio: `truckFormSchema`, `transactionFormSchema`, `categoryFormSchema`).
- Componentes de UI do RN são integrados via `Controller` (inputs não-nativos como `MoneyInput`, `KindToggle`, `CategoryChips` e seletores de cor também são envolvidos em `Controller`).
- Campos numéricos com vírgula/ponto ficam como `string` no form e são convertidos via `parseDecimal()` dentro de `onSubmit`.
- Estado de submissão usa `formState.isSubmitting` em vez de `useState` local; erros de validação ficam em `formState.errors` e são passados via prop `error` para `Input`.
- Para telas de edição, carregar os dados e chamar `reset(valuesIniciais)` dentro de um `useEffect`.

### Convenções

- Alias de import: `@/*` → `src/*` (configurado em `tsconfig.json` e `jest.config.js`).
- Estilização via NativeWind/Tailwind (`global.css`, `tailwind.config.js`).
- Novos campos persistidos exigem nova migração em `src/db/migrations/` (não editar as existentes).
- Ao adicionar uma feature, siga a estrutura `types` / `repository` / `store` / `components` e registre hidratação em `StoresHydrator` se precisar carregar no boot.
- Ao adicionar um novo formulário, crie/estenda o schema zod em `src/shared/lib/forms/schemas.ts` antes de escrever a UI.
