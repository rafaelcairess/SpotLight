# Guia de Manutencao do SpotLight

## Estrutura do projeto
- `src/features`: UI por feature (paginas + componentes da feature).
- `src/components`: componentes compartilhados (Header, SectionHeader, LayoutToggle, UI kit).
- `src/hooks`: hooks de dados e estados locais.
- `src/lib`: helpers reutilizaveis (texto, filtros, ordenacao, URLs da Steam).
- `src/config`: constantes centralizadas (chaves de localStorage, flags).
- `src/i18n`: traducoes e setup de idioma.
- `supabase/functions`: edge functions.
- `scripts`: scripts Node/TS para syncs e rotinas.

## Padroes comuns
- **Chaves do LocalStorage** em `src/config/storageKeys.ts`.
- **Normalizacao e match de texto** em `src/lib/text.ts`.
- **URLs e imagens da Steam** em `src/lib/steam.ts`.
- **Filtro de nao-jogos** em `src/lib/gameFilters.ts`.
- **Ordenacao por popularidade** em `src/lib/sort.ts`.

## Onde alterar coisas
- **Ordem do Top Games**: `src/features/top/data/topGamesSeriesCurated.ts`.
- **Preferencia de layout no Explore**: `src/hooks/useLayoutPreference.ts` e `STORAGE_KEYS`.
- **Toggle de conteudo adulto**: `src/hooks/useMaturePreference.ts` + `ProfileEditDialog`.
- **Comportamento de busca**: `src/hooks/useGames.ts` (`useSearchCatalog`).
- **Sync da Steam**: `scripts/steam-sync-popular.mjs`.

## Dicas
- Prefira helpers em `src/lib` em vez de duplicar logica.
- Evite versionar SQL (migrations sao locais).
- Mantenha strings da UI em `src/i18n/resources.ts`.

## Checklist
- Nova feature: crie `src/features/<feature>/` com `pages/`, `components/`, `data/` se precisar.
- Novo UI compartilhado: coloque em `src/components` (nao dentro de features).
- Novo helper: coloque em `src/lib` e reutilize.
- Nova chave de localStorage: adicione em `src/config/storageKeys.ts`.
- Novas traducoes: atualize `src/i18n/resources.ts` (pt/en/es).
- Novos campos da Steam: atualize a tabela do `supabase` + mapeamento em `useGames`.
- Novas rotas: atualize `src/App.tsx`.
