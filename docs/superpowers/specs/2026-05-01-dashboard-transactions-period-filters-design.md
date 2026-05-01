# Dashboard and Transactions Period Filters

## Objetivo

Adicionar os filtros `Mes`, `12 meses` e `Ano atual` nas telas `app/(tabs)/dashboard.tsx` e `app/(tabs)/transactions.tsx`, usando a mesma semantica ja existente em `app/(tabs)/reports.tsx`. O filtro deve ser compartilhado entre as telas que consomem a lista global de transacoes, para que dashboard, lista de transacoes e reports mostrem dados do mesmo periodo ativo.

## Decisao de Produto

O periodo ativo sera global no `useTransactionsStore`. Essa escolha evita que o usuario veja um resumo de um periodo no dashboard e uma lista de outro periodo na aba de transacoes. Tambem reduz duplicacao, porque o controle de periodo hoje esta preso em `reports.tsx` e precisa virar uma experiencia reutilizavel.

Foram consideradas tres abordagens:

- Duplicar o controle em cada tela: rapido, mas cria tres pontos de manutencao e risco de labels divergentes.
- Manter estado local por tela: simples para UI, mas permite que cada aba mostre um periodo diferente sem sinal claro.
- Centralizar no store e compartilhar UI/helper: recomendado, porque segue o fluxo atual `UI -> store -> repository`, preserva totais globais do periodo e deixa reports/dashboard/transactions consistentes.

## Semantica dos Periodos

- `Mes`: primeiro ao ultimo dia do mes selecionado. O valor inicial e o mes atual. O usuario pode navegar para meses anteriores e posteriores.
- `12 meses`: janela movel dos ultimos 12 meses ate hoje, incluindo o mes atual como ultimo mes.
- `Ano atual`: ano calendario atual, de 1 de janeiro a 31 de dezembro.

O store deve armazenar a intencao do usuario com `periodMode` e `selectedMonth`, derivar o `period` atual e recarregar transacoes quando esses valores mudarem. Helpers puros devem produzir o `Period` e as labels, mantendo essa regra testavel fora da UI.

## Interface

As tres telas devem usar um mesmo componente de filtro visual:

- controle segmentado com `Mes`, `12 meses` e `Ano atual`;
- navegacao de mes anterior/proximo apenas quando `Mes` estiver ativo;
- label resumida do periodo em todos os modos.

As labels da UI precisam refletir o filtro ativo:

- `Mes`: labels com o mes selecionado, por exemplo `Maio 2026` e estados vazios como `Sem lancamentos em maio de 2026`;
- `12 meses`: labels como `Jun 2025 - Mai 2026` e textos como `Sem lancamentos nos ultimos 12 meses`;
- `Ano atual`: label `2026` e textos como `Sem lancamentos em 2026`.

No dashboard, o bloco `Ultimas transacoes` deve deixar claro que a lista vem do periodo ativo. Na tela de transacoes, os estados vazios e qualquer titulo de lista devem abandonar textos fixos como `neste mes` quando o modo nao for mensal.

## Arquitetura

Criar um helper compartilhado para a selecao de periodo, provavelmente em `src/shared/lib/periodFilter.ts`, com:

- `PeriodMode = 'month' | 'last12' | 'year'`;
- opcoes de label para o controle segmentado;
- `periodForSelection(mode, selectedMonth, today): Period`;
- `periodDisplayLabel(mode, selectedMonth, today): string`;
- `emptyTransactionsTitle(mode, selectedMonth, today): string`;
- `recentTransactionsTitle(mode): string`.

Criar um componente compartilhado, provavelmente `src/shared/ui/PeriodFilterCard.tsx`, responsavel apenas pela renderizacao do controle. Ele recebe `mode`, `selectedMonth`, callbacks para trocar modo e navegar meses, e as labels prontas ou derivadas via helper. Ele nao deve acessar o store diretamente para continuar testavel e reutilizavel.

Estender `src/features/transactions/store/transactions.store.ts` para manter:

- `periodMode`;
- `selectedMonth`;
- `period`;
- `setPeriodMode(mode)`;
- `setSelectedMonth(date)`;
- `goToPreviousMonth()`;
- `goToNextMonth()`.

As actions devem atualizar o `period` derivado e chamar `load()`. As actions de `add`, `update` e `remove` continuam recarregando o periodo ativo, como ja fazem hoje.

`reports.tsx` deve migrar do estado local para o mesmo store compartilhado. Seus graficos continuam usando `reportRows` local, porque ele busca rows por periodo para agregacoes de reports; porem o periodo, modo e mes selecionado passam a vir do store. Assim, trocar o filtro em reports tambem troca dashboard e transacoes.

## Data Flow

O fluxo fica:

1. Usuario altera o modo ou mes no `PeriodFilterCard`.
2. A tela chama uma action do `useTransactionsStore`.
3. O store deriva o novo `period`, executa `load()` e atualiza `items`, `incomeCents` e `expenseCents`.
4. Dashboard e transactions renderizam diretamente os dados do store.
5. Reports observa `period`, `periodMode`, `selectedMonth` e `items`; quando mudam, busca `transactionsRepo.listByPeriod(truckId, period)` para alimentar seus graficos.

## Estados e Erros

Se nao houver `truckId`, as telas nao devem disparar busca. O estado atual sem transacoes deve continuar usando `EmptyState`, mas com titulo e descricao coerentes com o filtro ativo. Durante carregamento inicial da lista de transacoes, os skeletons continuam aparecendo. Period switches devem evitar labels antigas, porque a label sera derivada do estado do store antes da busca terminar.

## Testes

Adicionar testes unitarios para os helpers de periodo/labels:

- `periodForSelection('month')` retorna o mes selecionado;
- `periodForSelection('last12')` retorna a janela movel de 12 meses;
- `periodForSelection('year')` retorna o ano calendario atual;
- `periodDisplayLabel` gera labels corretas para os tres modos;
- `emptyTransactionsTitle` troca `neste mes` por texto especifico para `12 meses` e `Ano atual`.

Adicionar testes do store quando viavel sem banco direto. Se o store atual for dificil de isolar por depender do repositorio real, manter a cobertura em helpers puros e validar a integracao com `npx tsc --noEmit`.

## Fora de Escopo

- Persistir a ultima selecao de periodo entre aberturas do app;
- Criar filtros por categoria, tipo ou texto;
- Alterar schema SQLite;
- Mudar os graficos dos reports alem de usar o periodo compartilhado;
- Criar navegacao de ano para o modo `Ano atual`.
