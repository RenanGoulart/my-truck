# Reports por periodo

## Objetivo

Permitir que a tela de reports mostre resultados por mes, pelos ultimos 12 meses e pelo ano atual. A experiencia deve abrir no mes atual por padrao, permitir navegar por todos os meses no modo mensal e deixar claras as duas visoes agregadas: janela movel de 12 meses e ano calendario atual.

## Semantica dos periodos

- `Mes`: periodo do primeiro ao ultimo dia do mes selecionado. O valor inicial e o mes atual.
- `12 meses`: janela movel dos ultimos 12 meses ate hoje, incluindo o mes atual como ultimo bucket.
- `Ano atual`: ano calendario atual, de 1 de janeiro a 31 de dezembro. Em 2026, isso significa `01/01/2026` ate `31/12/2026`.

As datas devem ser calculadas por helpers puros e testaveis, usando `date-fns` como o restante do projeto. O estado da UI deve guardar a intencao do usuario (`viewMode` e `selectedMonth`) e derivar o `Period` antes de consultar o repositorio.

## Interface

A tela `app/(tabs)/reports.tsx` tera um controle segmentado no topo com tres opcoes:

- `Mes`
- `12 meses`
- `Ano atual`

No modo `Mes`, abaixo do controle aparece uma navegacao compacta com anterior, rotulo do mes/ano e proximo. Exemplo: `< Maio 2026 >`. Essa navegacao deve permitir ver qualquer mes, inclusive meses sem transacoes, mantendo graficos e estados vazios coerentes.

No modo `12 meses`, a tela mostra um subtitulo de intervalo, por exemplo `Jun 2025 - Mai 2026`. No modo `Ano atual`, mostra o ano, por exemplo `2026`. Nessas duas visoes, a navegacao mensal fica oculta para evitar controles que nao se aplicam.

## Conteudo dos reports

Os cards atuais continuam sendo a base:

- grafico de barras de ganhos e gastos por mes;
- grafico de gastos por categoria;
- estado vazio quando nao houver gastos.

O grafico de barras deve ajustar o numero de buckets conforme a visao:

- `Mes`: um bucket do mes selecionado, mantendo o mesmo componente e a mesma legenda dos demais modos;
- `12 meses`: 12 buckets, terminando no mes atual;
- `Ano atual`: 12 buckets, de janeiro a dezembro do ano atual.

O grafico de categorias deve sempre usar somente as transacoes do periodo ativo. Assim, no modo `Mes` ele mostra categorias daquele mes; em `12 meses`, categorias da janela movel; em `Ano atual`, categorias do ano calendario.

## Arquitetura

Criar ou estender helpers puros para periodos e buckets. A localizacao preferida e `src/shared/lib/date.ts` para periodos genericos, mantendo agregacoes especificas em `src/features/reports/services/aggregations.ts`.

Helpers esperados:

- `monthPeriod(ref: Date): Period`
- `lastTwelveMonthsPeriod(ref: Date): Period`
- `currentYearPeriod(ref: Date): Period`
- helper de rotulo para `Mes`, `12 meses` e `Ano atual`
- helper de buckets mensais que aceite explicitamente a estrategia: meses anteriores ate a referencia ou ano calendario

A tela de reports fica responsavel por:

- armazenar `viewMode`;
- armazenar `selectedMonth` para o modo mensal;
- derivar `period` e configuracao de buckets;
- buscar `transactionsRepo.listByPeriod(truckId, period)` quando `truckId`, `items`, `viewMode` ou `selectedMonth` mudarem;
- renderizar os controles e cards com base no periodo ativo.

O repositorio SQL nao precisa mudar, porque `transactionsRepo.listByPeriod` ja aceita qualquer `Period`.

## Estados e erros

Se nao houver `truckId`, a tela nao deve buscar dados. Se o periodo ativo nao tiver transacoes, os componentes existentes de estado vazio devem aparecer sem erro. Ao trocar o periodo, a tela deve limpar a lista local de reports antes da nova busca e usar um estado `isLoading` local para evitar mostrar dados antigos como se fossem do novo filtro.

## Testes

Adicionar testes unitarios para os helpers de periodo e agregacao:

- mes atual usa inicio e fim do mes selecionado;
- `12 meses` cobre os ultimos 12 meses ate a referencia;
- `Ano atual` cobre janeiro a dezembro do ano da referencia;
- buckets mensais ficam em ordem cronologica;
- transacoes fora do periodo ativo nao entram nos totais;
- categorias sao calculadas usando apenas as transacoes ja filtradas do periodo.

Os testes devem ficar em `src/**/__tests__/*.test.ts`, seguindo a convencao do projeto.

## Fora de escopo

- Criar exportacao de relatorios;
- Persistir a ultima visao escolhida;
- Adicionar comparacao entre periodos;
- Mudar o schema SQLite;
- Alterar dashboard ou lista de transacoes.
