<div align="center">

# 🎮 SpotLight

**Descubra, acompanhe e compartilhe sua jornada nos games.**

Uma plataforma completa de descoberta de jogos com curadoria, biblioteca pessoal, reviews da comunidade e integração nativa com Steam e Xbox.

[![Deploy](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)](https://spot-light-xi.vercel.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)

**[→ Acessar o site](https://spot-light-xi.vercel.app)**

</div>

---

## O que é o SpotLight

O SpotLight nasceu da necessidade de ter um lugar centralizado para acompanhar jogos — sem depender de planilhas ou notas espalhadas. É uma plataforma focada em **qualidade de descoberta**: catálogo curado, reviews reais, alertas de preço e integração direta com as plataformas onde você já joga.

---

## Funcionalidades

### 🎮 Biblioteca pessoal
- Organize seus jogos por status: **Jogando**, **Completado**, **Abandonado**, **Wishlist**
- Acompanhe horas jogadas (sincronizado via Steam ou inserido manualmente)
- Marque favoritos e platinas com vitrine no perfil

### 🔗 Integração com plataformas
- **Login com Steam** — importa sua biblioteca automaticamente via Steam Web API
- **Login com Xbox** — conecta com Xbox Live e sincroniza biblioteca
- **Login com Google** — autenticação rápida via OAuth
- Sincronização manual com botão "Atualizar Steam" no perfil

### 📊 Perfil e estatísticas
- Perfil público com avatar, bio e vitrine de platinas
- **Insights**: total de horas, taxa de conclusão, top gêneros (gráfico), jogos por mês
- **Conquistas SpotLight**: badges desbloqueados por milestones (colecionador, crítico, maratonista…)
- Sistema de seguidores e seguindo

### 🏆 Listas personalizadas
- Crie coleções temáticas ("Pra jogar nas férias", "Melhores de 2024")
- Torne listas públicas e compartilhe com a comunidade
- Adicione qualquer jogo do catálogo a uma lista direto do modal de detalhes

### 🔍 Descoberta de jogos
- Catálogo dinâmico com dados da Steam
- Busca por nome com resultados em tempo real
- Rankings curados: **Top Jogos**, **Mais Jogados**, **Promoções**
- Coleções temáticas (co-op, lançamentos, indie…)
- Recomendações baseadas na sua biblioteca

### 📝 Reviews e comunidade
- Escreva reviews com nota e texto para qualquer jogo
- Veja reviews de outros jogadores no perfil e na página do jogo
- Página pública de cada usuário em `/u/:username`

### 🔔 Alertas de preço
- Configure alertas de preço para jogos da sua wishlist
- Receba e-mail quando o preço cair abaixo do seu alvo

---

## Stack tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite 7 |
| UI | TailwindCSS 3 + shadcn/ui + Radix UI |
| Estado / Dados | TanStack Query (React Query) |
| Gráficos | Recharts |
| Backend | Supabase (PostgreSQL + Auth + RLS + Storage) |
| Edge Functions | Supabase Edge Functions (Deno) |
| Deploy | Vercel |
| CI/CD | GitHub Actions |
| Internacionalização | react-i18next (PT, EN, ES) |
| Monitoramento | Sentry |

### Edge Functions (Deno)

| Função | Descrição |
|--------|-----------|
| `steam-auth-start` | Inicia fluxo OpenID 2.0 da Steam |
| `steam-auth-callback` | Valida retorno da Steam, cria/atualiza usuário e importa biblioteca |
| `sync-steam-playtime` | Atualiza horas jogadas via Steam Web API |
| `xbox-auth-start` | Inicia fluxo OAuth 2.0 da Microsoft para Xbox |
| `xbox-auth-callback` | Valida token Xbox e salva XUID/Gamertag |
| `sync-xbox-library` | Sincroniza biblioteca Xbox Live |
| `psn-auth-start` / `psn-auth-callback` | Fluxo OAuth PSN (Sony) |
| `sync-psn-trophies` | Sincroniza troféus PSN |
| `fetch-steam-details` | Busca detalhes enriquecidos de um jogo na Steam Store API |
| `search-steam` | Pesquisa jogos na Steam para o catálogo |
| `send-price-alert-email` | Dispara e-mail de alerta de preço |

---

## Rodando localmente

### Pré-requisitos

- Node.js 18+
- npm
- Conta no [Supabase](https://supabase.com) com projeto criado

### 1. Clone o repositório

```bash
git clone https://github.com/rafaelcairess/SpotLight.git
cd SpotLight
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas chaves:

```bash
cp .env.example .env
```

| Variável | Descrição |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL do seu projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave anon/public do Supabase |

> **Nota:** As variáveis de ambiente das Edge Functions (Steam API Key, Xbox Client ID/Secret, etc.) são configuradas diretamente no painel do Supabase em *Settings → Edge Functions → Secrets*.

### 4. Configure o banco de dados

O projeto usa migrations versionadas em `supabase/migrations/`. Aplique-as via [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase db push
```

Ou aplique manualmente no SQL Editor do painel do Supabase.

### 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse em `http://localhost:5173`.

---

## Scripts disponíveis

```bash
npm run dev              # Servidor de desenvolvimento
npm run build            # Build de produção
npm run preview          # Preview do build localmente
npm run lint             # Lint com ESLint
npm test                 # Testes com Vitest
npm run sync:steam       # Sincroniza jogos populares da Steam (script CI)
npm run check:alerts     # Verifica e dispara alertas de preço
npm run set:featured     # Define jogo em destaque do dia
```

---

## Estrutura do projeto

```
src/
├── components/          # Componentes globais (Header, ErrorBoundary…)
├── config/              # Constantes e chaves de configuração
├── contexts/            # React contexts (Auth, Language)
├── features/
│   ├── alerts/          # Alertas de preço
│   ├── auth/            # Login, cadastro, OAuth
│   ├── collections/     # Coleções temáticas
│   ├── community/       # Feed da comunidade
│   ├── explore/         # Página inicial / descoberta
│   ├── games/           # Modal, página e componentes de jogo
│   ├── lists/           # Listas personalizadas
│   ├── most-played/     # Ranking de mais jogados
│   ├── onboarding/      # Onboarding e WhatsNew modal
│   ├── profile/         # Perfil próprio e público
│   ├── promotions/      # Promoções e descontos
│   ├── reviews/         # Formulário de review
│   ├── search/          # Busca de jogos
│   └── top/             # Ranking top jogos
├── hooks/               # Hooks de dados (React Query)
├── i18n/                # Traduções PT/EN/ES
├── integrations/        # Cliente Supabase e tipos gerados
├── lib/                 # Utilitários (playtime, Sentry…)
└── types/               # Types globais TypeScript

supabase/
├── functions/           # Edge Functions (Deno)
└── migrations/          # Migrations SQL versionadas
```

---

## Segurança

- **RLS (Row Level Security)** ativo em todas as tabelas — usuários só acessam seus próprios dados
- **CSRF protection** com nonce em cookie HttpOnly nos fluxos Steam OpenID e Xbox OAuth
- **JWT verification** configurado por função nas Edge Functions
- Origens de redirect validadas contra lista de domínios permitidos explícita

---

## Roadmap

- [ ] Recomendações por IA com base na biblioteca
- [ ] Feed de atividade de amigos
- [ ] Integração completa com PSN (Trophy API)
- [ ] Sincronização automática via pg_cron (playtime periódico)
- [ ] App mobile (PWA)

---

<div align="center">

Feito com foco em qualidade e evolução constante.

</div>
