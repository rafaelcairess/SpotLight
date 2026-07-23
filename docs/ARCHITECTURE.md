# Guia de arquitetura do SpotLight

Este documento é o mapa de manutenção do projeto. Comece por ele quando precisar
alterar uma funcionalidade e atualize-o quando criar uma nova área.

## Visão geral

O SpotLight não é apenas um frontend. Ele tem três partes:

1. `src/`: aplicação React publicada na Vercel.
2. `supabase/migrations/`: estrutura, funções SQL, permissões e políticas RLS.
3. `supabase/functions/`: backend Deno executado como Edge Functions do Supabase.

O navegador nunca deve receber chaves privadas. A aplicação React usa somente
`VITE_SUPABASE_URL` e a chave publicável. Steam, Xbox, PlayStation e operações
administrativas ficam nas Edge Functions.

## Onde alterar cada parte

| Necessidade                        | Arquivo ou diretório principal                                  |
| ---------------------------------- | --------------------------------------------------------------- |
| Rotas e carregamento das páginas   | `src/App.tsx`                                                   |
| Menu superior                      | `src/components/Header.tsx`                                     |
| Cores e estilos globais            | `src/index.css` e `tailwind.config.ts`                          |
| Login e sessão                     | `src/contexts/AuthContext.tsx` e `src/features/auth/`           |
| Perfil do próprio usuário          | `src/features/profile/pages/Profile.tsx`                        |
| Perfil visto por outras pessoas    | `src/features/profile/pages/PublicProfile.tsx`                  |
| Página “Editar perfil”             | `src/features/profile/pages/ProfileEdit.tsx`                    |
| Biblioteca e horas dos jogos       | `src/features/profile/components/GameLibrary.tsx`               |
| Jogo favorito                      | `src/features/profile/components/FavoriteGameShowcase.tsx`      |
| Vitrine de platinados              | `src/features/profile/components/PlatinumShowcase.tsx`          |
| Consulta e alteração da biblioteca | `src/hooks/useUserGames.ts`                                     |
| Catálogo e busca de jogos          | `src/hooks/useGames.ts`                                         |
| Página Explorar                    | `src/features/explore/pages/Explore.tsx`                        |
| Modal de detalhes de um jogo       | `src/features/games/components/GameModal.tsx`                   |
| Traduções                          | `src/i18n/resources.ts`                                         |
| Tipos do Supabase                  | `src/integrations/supabase/types.ts` (gerado; não editar à mão) |
| Integração Steam                   | `supabase/functions/steam-*` e `sync-steam-playtime/`           |
| Banco e segurança RLS              | `supabase/migrations/`                                          |

## Fluxo de dados

```text
Componente React
    ↓ usa
Hook em src/hooks/
    ↓ consulta ou altera
Supabase (tabela/RPC) ou Edge Function
    ↓ retorna
TanStack Query mantém o cache
    ↓
Componente renderiza o estado atualizado
```

Os componentes não devem consultar o Supabase diretamente, salvo operações muito
locais, como upload de avatar. Quando uma consulta for compartilhada ou possuir
regra de negócio, ela deve ficar em um hook.

### Horas jogadas

Há dois valores no banco:

- `hours_played`: valor importado da plataforma.
- `hours_played_manual`: valor informado pelo usuário.

`hours_override` decide qual deles aparece. Use sempre
`getEffectiveHours()` de `src/lib/playtime.ts`; ler apenas `hours_played` faz a
interface ignorar a edição manual.

### Cache

Toda mutation precisa invalidar as queries que exibem o dado alterado. As chaves
relacionadas à biblioteca estão centralizadas conceitualmente em
`src/hooks/useUserGames.ts`. Se uma nova vitrine usar dados de `user_games`,
adicione a invalidação correspondente ao salvar.

## Organização de arquivos

- `features/<área>/pages`: páginas ligadas às rotas.
- `features/<área>/components`: componentes exclusivos daquela área.
- `components/ui`: componentes visuais genéricos; não coloque regra de negócio.
- `hooks`: acesso a dados e mutations.
- `lib`: funções puras e reutilizáveis.
- `types`: tipos de domínio usados por várias áreas.
- `contexts`: estado global de sessão, idioma ou preferências realmente globais.

Um arquivo deve ter uma responsabilidade principal. Quando uma página começar a
misturar formulários, consultas e muitos blocos visuais, extraia componentes da
própria feature antes de criar outro hook.

## Comentários

Comente decisões e regras que não são óbvias. Exemplos úteis:

- por que existe um fallback;
- por que determinada chave de cache é invalidada;
- diferença entre dado importado e manual;
- restrição de segurança ou de API.

Não adicione comentários que apenas repetem o nome do arquivo, como “componente da
feature profile”. Nomes claros e tipos TypeScript devem explicar o código comum.

## Backend e segurança

- Toda tabela com dados de usuário deve ter RLS.
- Uma migration nova deve ser criada; migrations antigas não devem ser reescritas
  depois de aplicadas em produção.
- `service_role`, secret keys e chaves das plataformas só podem existir nos
  Secrets das Edge Functions.
- Variáveis começando com `VITE_` são públicas e vão para o navegador.
- Antes de aceitar `user_id` vindo do cliente, confirme a sessão ou aplique uma
  política RLS que limite o acesso.

## Checklist antes de publicar

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Também confira:

- `git diff --check`
- `git status --short`
- ausência de `.env`, tokens, dumps e arquivos temporários no commit
- migration aplicada antes de publicar código que dependa de uma coluna nova
