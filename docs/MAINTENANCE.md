# SpotLight Maintenance Guide

## Project structure
- `src/features`: feature-first UI (pages + feature components).
- `src/components`: shared UI pieces (Header, SectionHeader, LayoutToggle, UI kit).
- `src/hooks`: data hooks and local state helpers.
- `src/lib`: reusable helpers (text, filters, sorting, steam URLs).
- `src/config`: centralized constants (localStorage keys, feature flags).
- `src/i18n`: translations and language setup.
- `supabase/functions`: edge functions.
- `scripts`: Node/TS scripts for sync jobs.

## Common patterns
- **LocalStorage keys** live in `src/config/storageKeys.ts`.
- **Text normalization** and matching live in `src/lib/text.ts`.
- **Steam URLs and images** live in `src/lib/steam.ts`.
- **Filtering non-game content** lives in `src/lib/gameFilters.ts`.
- **Popularity sorting** lives in `src/lib/sort.ts`.

## Where to change things
- **Top Games order**: `src/features/top/data/topGamesSeriesCurated.ts`.
- **Explore layout preference**: `src/hooks/useLayoutPreference.ts` and `STORAGE_KEYS`.
- **Mature content toggle**: `src/hooks/useMaturePreference.ts` + `ProfileEditDialog`.
- **Search behavior**: `src/hooks/useGames.ts` (`useSearchCatalog`).
- **Steam sync**: `scripts/steam-sync-popular.mjs`.

## Tips
- Prefer helpers in `src/lib` over duplicating logic.
- Keep SQL out of git (migrations are local only).
- Keep UI strings in `src/i18n/resources.ts`.

## Checklist
- New feature: create `src/features/<feature>/` with `pages/`, `components/`, `data/` if needed.
- New shared UI: place in `src/components` (not inside features).
- New helper: place in `src/lib` and reuse it from features.
- New localStorage key: add to `src/config/storageKeys.ts`.
- New translations: update `src/i18n/resources.ts` (pt/en/es).
- New Steam data fields: update `supabase` table + `useGames` mapping.
- New routes: update `src/App.tsx`.
