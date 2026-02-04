
# SpotLight 2.0 - Plataforma Social para Gamers

## Visão Geral

Transformar o SpotLight em uma plataforma social completa inspirada no Steam, com perfis de usuário, sistema de reviews, recomendações por IA e recursos sociais.

---

## Novas Funcionalidades

### 1. Rankings Expandidos
- **Mais Jogados**: Lista dos jogos com mais jogadores ativos
- **Mais Bem Avaliados**: Lista baseada nas avaliações da Steam
- Navegação por abas na página inicial

### 2. Sistema de Perfil de Usuário
- Foto de perfil personalizável
- Nome único (username) para busca por outros usuários
- Estatísticas do perfil (jogos na biblioteca, reviews escritas)
- Listas personalizadas:
  - **Favoritos**: Jogos que mais gostou
  - **Platinados**: Jogos 100% completados
  - **Jogando**: Jogos em andamento
  - **Lista de Desejos**: Jogos para comprar

### 3. Sistema de Reviews
- Usuários podem escrever análises dos jogos
- Avaliação positiva/negativa (estilo Steam)
- Horas jogadas (input manual)
- Reviews aparecem na página do jogo e no perfil do usuário

### 4. Descoberta Social
- Buscar outros usuários pelo username
- Ver perfis públicos de outros jogadores
- Visualizar reviews e listas de outros usuários

### 5. IA de Recomendações "O que jogar hoje?"
Um assistente inteligente que pergunta:
- **Sozinho ou acompanhado?**
- **Local ou online?**
  - Mesmo sofá (split-screen/couch co-op)
  - Online com amigos
- **Quantos jogadores?** (2, 3, 4+)
- **Gênero preferido?**
- **Quanto tempo disponível?**

A IA analisa as reviews do usuário para refinar recomendações.

---

## Arquitetura de Dados (Supabase)

### Tabelas Necessárias

```text
+------------------+     +------------------+     +------------------+
|     profiles     |     |   user_games     |     |     reviews      |
+------------------+     +------------------+     +------------------+
| id (FK auth)     |     | id               |     | id               |
| username (único) |     | user_id (FK)     |     | user_id (FK)     |
| display_name     |     | app_id           |     | app_id           |
| avatar_url       |     | status           |     | content          |
| bio              |     | hours_played     |     | is_positive      |
| created_at       |     | is_favorite      |     | hours_at_review  |
+------------------+     | is_platinumed    |     | created_at       |
                         | added_at         |     +------------------+
                         +------------------+
```

### Status de Jogos
- `wishlist` - Lista de desejos
- `playing` - Jogando atualmente
- `completed` - Finalizado
- `dropped` - Abandonado

---

## Novas Páginas

| Rota | Descrição |
|------|-----------|
| `/auth` | Login/Cadastro |
| `/profile` | Perfil do usuário logado |
| `/profile/:username` | Perfil público de outro usuário |
| `/profile/edit` | Editar perfil |
| `/game/:appId` | Página do jogo com reviews |
| `/game/:appId/review` | Escrever/editar review |
| `/users/search` | Buscar usuários |
| `/recommend` | Assistente "O que jogar hoje?" |
| `/rankings` | Página dedicada com abas |

---

## Novos Componentes

### Perfil
- `UserAvatar` - Foto de perfil com fallback
- `ProfileHeader` - Cabeçalho do perfil
- `ProfileStats` - Estatísticas do usuário
- `GameLibrary` - Grid de jogos do usuário
- `GameStatusBadge` - Badge de status (Platinado, Favorito, etc)

### Reviews
- `ReviewCard` - Card de review
- `ReviewForm` - Formulário de nova review
- `ReviewList` - Lista de reviews de um jogo

### Recomendações
- `RecommendationWizard` - Wizard interativo de perguntas
- `RecommendationResults` - Resultados da IA

### Rankings
- `RankingTabs` - Abas (Mais Vendidos, Mais Jogados, Mais Bem Avaliados)
- `RankingList` - Lista reutilizável

---

## Fluxo do Usuário

```text
1. Usuário acessa o app
         │
         ▼
2. Cria conta / Faz login
         │
         ▼
3. Configura perfil (username, foto)
         │
         ▼
4. Explora jogos e adiciona à biblioteca
         │
         ▼
5. Escreve reviews dos jogos
         │
         ▼
6. IA aprende preferências e recomenda
         │
         ▼
7. Usa "O que jogar hoje?" para descobrir
         │
         ▼
8. Busca amigos e vê seus perfis
```

---

## Plano de Implementação

### Fase 1: Infraestrutura (Primeiro)
1. Habilitar Supabase/Cloud no projeto
2. Criar schema do banco de dados (tabelas + RLS)
3. Configurar autenticação (email/senha)

### Fase 2: Sistema de Autenticação
1. Página de login/cadastro
2. Contexto de autenticação (AuthContext)
3. Proteção de rotas privadas
4. Hook `useAuth` para acesso ao usuário

### Fase 3: Perfil de Usuário
1. Criação automática de perfil após cadastro
2. Página de edição de perfil
3. Upload de foto de perfil (Supabase Storage)
4. Validação de username único

### Fase 4: Biblioteca de Jogos
1. Adicionar jogos à biblioteca pessoal
2. Marcar como favorito/platinado
3. Gerenciar status (jogando, completado, etc)
4. Exibir biblioteca no perfil

### Fase 5: Sistema de Reviews
1. Formulário de review no modal do jogo
2. Listagem de reviews na página do jogo
3. Reviews do usuário em seu perfil
4. Editar/excluir próprias reviews

### Fase 6: Rankings Expandidos
1. Nova página `/rankings` com abas
2. Integração com API para "Mais Jogados"
3. Integração com API para "Mais Bem Avaliados"

### Fase 7: Descoberta Social
1. Busca de usuários por username
2. Visualização de perfis públicos
3. Ver reviews e biblioteca de outros

### Fase 8: IA de Recomendações
1. Wizard interativo de perguntas
2. Lógica de filtragem baseada em respostas
3. Integração com OpenAI para análise de reviews
4. Histórico de recomendações

---

## Seção Técnica

### Dependências Novas
- `@supabase/supabase-js` - Cliente Supabase
- `openai` (via Edge Function) - Recomendações por IA

### Estrutura de Pastas Proposta
```text
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── SignupForm.tsx
│   ├── profile/
│   │   ├── UserAvatar.tsx
│   │   ├── ProfileHeader.tsx
│   │   ├── ProfileStats.tsx
│   │   └── GameLibrary.tsx
│   ├── reviews/
│   │   ├── ReviewCard.tsx
│   │   ├── ReviewForm.tsx
│   │   └── ReviewList.tsx
│   ├── recommendations/
│   │   ├── RecommendationWizard.tsx
│   │   └── WizardStep.tsx
│   └── rankings/
│       └── RankingTabs.tsx
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useProfile.ts
│   ├── useUserGames.ts
│   └── useReviews.ts
├── pages/
│   ├── Auth.tsx
│   ├── Profile.tsx
│   ├── ProfileEdit.tsx
│   ├── PublicProfile.tsx
│   ├── GamePage.tsx
│   ├── Rankings.tsx
│   ├── Recommend.tsx
│   └── UserSearch.tsx
└── lib/
    └── supabase.ts
```

### Segurança (RLS)
- Perfis: Leitura pública, escrita apenas pelo dono
- Reviews: Leitura pública, escrita/edição pelo autor
- Biblioteca: Leitura pública, escrita pelo dono
- Usernames únicos com constraint no banco

### Edge Functions
- `recommend-games` - Processa perguntas e retorna sugestões via IA
- Usa OpenAI para analisar reviews do usuário e refinar recomendações

---

## Próximo Passo

Aprovar este plano para iniciar pela **Fase 1**: habilitar o Cloud/Supabase e criar a arquitetura do banco de dados com todas as tabelas e políticas de segurança necessárias.
