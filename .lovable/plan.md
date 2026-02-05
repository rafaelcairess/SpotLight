

# Sistema de Reviews e Rankings - SpotLight

## Visao Geral

Implementar um sistema completo de reviews onde usuarios podem escrever analises dos jogos, e expandir a secao de rankings na pagina inicial com abas para diferentes tipos de classificacao (Mais Vendidos, Mais Jogados, Mais Bem Avaliados).

---

## Funcionalidades a Implementar

### 1. Sistema de Reviews no Modal do Jogo

O modal de detalhes do jogo (`GameModal.tsx`) sera expandido para incluir:
- Secao de reviews de outros usuarios
- Formulario para escrever/editar sua propria review
- Indicador de recomendacao (positivo/negativo) estilo Steam
- Campo de horas jogadas

### 2. Rankings com Abas

A secao de rankings na pagina inicial tera 3 abas:
- **Mais Vendidos** - Lista atual (dados mockados)
- **Mais Jogados** - Ordenado por jogadores ativos
- **Melhores Avaliados** - Ordenado por avaliacao da comunidade

---

## Novos Componentes

| Componente | Descricao |
|------------|-----------|
| `ReviewForm.tsx` | Formulario para criar/editar reviews |
| `ReviewCard.tsx` | Card individual de review com avatar e conteudo |
| `ReviewList.tsx` | Lista de reviews de um jogo |
| `GameReviewsSection.tsx` | Secao completa de reviews para o modal |
| `RankingTabs.tsx` | Componente de abas para os rankings |

---

## Alteracoes em Arquivos Existentes

### GameModal.tsx
- Adicionar aba de "Reviews" com scroll area
- Integrar `GameReviewsSection`
- Usar Tabs do Radix UI para organizar conteudo

### Index.tsx
- Substituir a secao fixa de rankings por `RankingTabs`
- Adicionar estado para controlar aba ativa
- Logica de ordenacao dos jogos por tipo de ranking

---

## Fluxo do Usuario

```text
Usuario abre modal do jogo
         |
         v
Ve informacoes + reviews de outros
         |
         v
[Logado?] -- Nao --> Botao "Faca login para avaliar"
    |
    Sim
    |
    v
[Ja tem review?] -- Sim --> Pode editar/excluir
    |
    Nao
    |
    v
Clica em "Escrever Review"
         |
         v
Preenche: Recomenda? + Horas + Texto
         |
         v
Salva no banco (Supabase)
         |
         v
Review aparece na lista
```

---

## Estrutura dos Componentes de Review

### ReviewForm
```text
+------------------------------------------+
|  Voce recomenda este jogo?               |
|  [Sim (verde)]  [Nao (vermelho)]         |
|                                          |
|  Horas jogadas: [____] h                 |
|                                          |
|  Sua analise:                            |
|  +--------------------------------------+|
|  |                                      ||
|  |  (textarea)                          ||
|  |                                      ||
|  +--------------------------------------+|
|                                          |
|  [Cancelar]  [Publicar Review]           |
+------------------------------------------+
```

### ReviewCard
```text
+------------------------------------------+
|  [Avatar] Username           Recomendado |
|           12h jogadas    ha 2 dias       |
|  ----------------------------------------|
|  Texto da review do usuario...           |
+------------------------------------------+
```

---

## Estrutura dos Rankings com Abas

```text
+------------------------------------------+
|  [Mais Vendidos] [Mais Jogados] [Top]    |
|  ----------------------------------------|
|  Lista de jogos ordenada conforme aba    |
+------------------------------------------+
```

---

## Secao Tecnica

### Dependencias
- Ja instaladas: `@radix-ui/react-tabs`, `react-hook-form`, `zod`

### Arquivos a Criar
```text
src/components/reviews/
  - ReviewForm.tsx
  - ReviewCard.tsx
  - ReviewList.tsx
  - GameReviewsSection.tsx

src/components/rankings/
  - RankingTabs.tsx
```

### Hooks Utilizados
- `useReviewsByGame(appId)` - Reviews de um jogo
- `useUserReviewForGame(appId)` - Review do usuario logado
- `useCreateReview()` - Criar review
- `useUpdateReview()` - Atualizar review
- `useDeleteReview()` - Excluir review

### Integracao com Auth
- Verificar `user` do `AuthContext` antes de mostrar formulario
- Proteger operacoes de escrita com verificacao de autenticacao
- Exibir mensagem amigavel para usuarios nao logados

---

## Resumo de Mudancas

1. **Criar 4 componentes de review** para formulario, cards e listagem
2. **Criar componente RankingTabs** com 3 tipos de ordenacao
3. **Expandir GameModal** para incluir secao de reviews com abas
4. **Atualizar Index.tsx** para usar o novo sistema de abas nos rankings
5. **Integrar hooks existentes** para operacoes CRUD de reviews

