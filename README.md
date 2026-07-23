<div align="center">

# SpotLight

**Steam, Xbox, PlayStation. Tudo em um perfil só.**

[![Deploy](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)](https://spot-light-xi.vercel.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)

**[→ Acessar o site](https://spot-light-xi.vercel.app)**

</div>

---

## O problema

Você tem 150h no Steam, platinas no PSN e conquistas no Xbox. Três plataformas, três bibliotecas, três perfis que não conversam entre si. Para saber o que você já jogou, precisa abrir cada app separado. Para compartilhar sua história como gamer, não existe um lugar que conte tudo de uma vez.

O SpotLight nasceu para resolver exatamente isso.

---

## O que é o SpotLight

O SpotLight é o seu perfil gamer completo. Conecte Steam, Xbox e PlayStation — suas bibliotecas, horas jogadas, platinas e troféus são sincronizados automaticamente para um único lugar. Quando você platinar um jogo no PS5 e terminar outro no PC, ambos aparecem no mesmo perfil, com o mesmo histórico. Você para de precisar abrir cada plataforma separada para enxergar sua vida como jogador.

Além de centralizar o que você já tem, o SpotLight ajuda a descobrir o próximo jogo: catálogo curado, rankings, promoções em tempo real e recomendações baseadas na sua biblioteca real.

---

## Funcionalidades

### Biblioteca pessoal

- Horas jogadas sincronizadas via Steam ou inseridas manualmente
- Jogos privados ou ocultos por usuário
- Jogo favorito e até seis jogos platinados em vitrines do perfil
- Plataforma da platina identificada como Steam, Xbox ou PlayStation

### Integração com plataformas

- **Steam** — biblioteca completa e horas jogadas sincronizadas via Steam Web API
- **Xbox** — fluxo OAuth e sincronização em desenvolvimento
- **PlayStation** — fluxo OAuth e troféus em desenvolvimento

### Perfil e estatísticas

- Perfil público em `/u/:username` com avatar, bio e vitrine de platinas
- Nível próprio do SpotLight
- Amigos, presença, privacidade e comentários no perfil
- Escolha manual da plataforma e das horas jogadas

### Descoberta de jogos

- Catálogo dinâmico atualizado a cada 6 horas com dados da Steam
- Busca por nome com resultados em tempo real
- Rankings curados: **Mais Vendidos**, **Mais Jogados**, **Top Games**
- Coleções temáticas (co-op, indie, lançamentos…)
- Recomendações personalizadas com base na sua biblioteca

### Alertas de preço

- Configure um preço-alvo para qualquer jogo da sua wishlist
- Receba e-mail quando o preço cair abaixo do alvo

### Reviews e comunidade

- Escreva reviews com nota e texto para qualquer jogo
- Veja o que outros jogadores acharam antes de comprar
- Listas públicas e compartilháveis criadas pela comunidade

---

## Stack

| Camada              | Tecnologia                                   |
| ------------------- | -------------------------------------------- |
| Frontend            | React 18 + TypeScript + Vite 7               |
| UI                  | TailwindCSS 3 + shadcn/ui + Radix UI         |
| Estado / Dados      | TanStack Query (React Query)                 |
| Backend             | Supabase (PostgreSQL + Auth + RLS + Storage) |
| Edge Functions      | Supabase Edge Functions (Deno)               |
| Deploy              | Vercel                                       |
| CI/CD               | GitHub Actions                               |
| Internacionalização | react-i18next (PT, EN, ES)                   |
| Tratamento de erros | React Error Boundaries                       |

### Edge Functions (Deno)

| Função                                 | Descrição                                                           |
| -------------------------------------- | ------------------------------------------------------------------- |
| `steam-auth-start`                     | Inicia fluxo OpenID 2.0 da Steam                                    |
| `steam-auth-callback`                  | Valida retorno da Steam, cria/atualiza usuário e importa biblioteca |
| `sync-steam-playtime`                  | Atualiza horas jogadas via Steam Web API                            |
| `xbox-auth-start`                      | Inicia fluxo OAuth 2.0 da Microsoft para Xbox                       |
| `xbox-auth-callback`                   | Valida token Xbox e salva XUID/Gamertag                             |
| `sync-xbox-library`                    | Sincroniza biblioteca Xbox Live                                     |
| `psn-auth-start` / `psn-auth-callback` | Fluxo OAuth PSN (Sony)                                              |
| `sync-psn-trophies`                    | Sincroniza troféus PSN                                              |
| `fetch-steam-details`                  | Busca detalhes enriquecidos de um jogo na Steam Store API           |
| `search-steam`                         | Pesquisa jogos na Steam para o catálogo                             |
| `send-price-alert-email`               | Dispara e-mail de alerta de preço                                   |

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

```bash
cp .env.example .env
```

| Variável                        | Descrição                    |
| ------------------------------- | ---------------------------- |
| `VITE_SUPABASE_URL`             | URL do seu projeto Supabase  |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave publicável do Supabase |

> As variáveis das Edge Functions (Steam API Key, Xbox Client ID/Secret, etc.) são configuradas no painel do Supabase em _Settings → Edge Functions → Secrets_.

### 4. Configure o banco de dados

```bash
supabase db push
```

Ou aplique manualmente as migrations em `supabase/migrations/` no SQL Editor do Supabase.

### 5. Inicie o servidor

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
npm run sync:steam       # Sincroniza jogos populares da Steam
npm run check:alerts     # Verifica e dispara alertas de preço
npm run set:featured     # Define o jogo em destaque do dia
```

---

## Estrutura do projeto

Para saber onde alterar cada funcionalidade, como os dados percorrem o sistema e
quais regras seguir no backend, consulte o
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

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
├── lib/                 # Utilitários de domínio
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

---

<div align="center">

Um perfil para toda a sua vida nos games.

</div>
