<div align="center">

# SpotLight

**Toda a sua história gamer em um único perfil.**

[![SpotLight](https://img.shields.io/badge/Acessar_o_projeto-SpotLight-7c3aed?style=for-the-badge)](https://spot-light-xi.vercel.app)
[![CI](https://github.com/rafaelcairess/SpotLight/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/rafaelcairess/SpotLight/actions/workflows/ci.yml)

<a href="https://spot-light-xi.vercel.app">
  <img src="docs/screenshots/explorar.webp" alt="Tela Explorar do SpotLight" width="100%">
</a>

**[Acessar o SpotLight](https://spot-light-xi.vercel.app)**

</div>

## Por que criei o SpotLight

Minha história com jogos estava espalhada entre Steam, Xbox e PlayStation. Horas jogadas, conquistas e títulos favoritos ficavam presos em perfis que não conversavam entre si.

Criei o SpotLight para reunir tudo isso em uma única vitrine: um perfil que mostra quem você é como jogador e também ajuda a descobrir o que jogar depois.

O projeto nasceu de uma necessidade pessoal e evoluiu para uma aplicação full stack publicada e utilizada em um ambiente real.

## O que o produto oferece

- Importação da biblioteca e das horas jogadas pela Steam
- Perfil público com jogo favorito, biblioteca e vitrine de platinas
- Busca, promoções e rankings atualizados com dados da Steam
- Reviews, listas, amigos e comentários da comunidade
- Recomendações baseadas nos jogos do usuário
- Alertas por e-mail quando um jogo atinge o preço desejado
- Interface disponível em português, inglês e espanhol

<a href="https://spot-light-xi.vercel.app/u/aeb">
  <img src="docs/screenshots/perfil-publico.webp" alt="Perfil público com biblioteca, jogo favorito e platinas" width="100%">
</a>

## O que este projeto demonstra

- Desenvolvimento frontend com React e TypeScript
- Modelagem de dados e autenticação com PostgreSQL e Supabase
- Integração com APIs externas e fluxo OpenID da Steam
- Edge Functions para proteger chaves e regras executadas no servidor
- Segurança com Row Level Security, rate limiting e validação de redirects
- Testes automatizados, lint, type checking e CI com GitHub Actions
- Organização do código por domínio e documentação de arquitetura

## Como funciona

```text
React + TypeScript
        │
        ├── Supabase Auth
        ├── PostgreSQL + RLS
        └── Edge Functions ──→ Steam API / serviços externos
```

| Camada         | Tecnologias                                 |
| -------------- | ------------------------------------------- |
| Frontend       | React, TypeScript, Vite e Tailwind CSS      |
| Dados e estado | TanStack Query, Supabase e PostgreSQL       |
| Backend        | Supabase Edge Functions com Deno            |
| Qualidade      | Vitest, ESLint, TypeScript e GitHub Actions |
| Deploy         | Vercel e Supabase                           |

## Em evolução

A integração com a Steam está disponível. Xbox e PlayStation podem ser registrados manualmente enquanto as sincronizações oficiais continuam em desenvolvimento.

Também estou construindo uma API em ASP.NET Core 8 para estudar e aplicar uma migração gradual do backend. Ela já possui autenticação JWT/JWKS e testes, mas ainda não faz parte do ambiente de produção.

## Conheça o código

- [Como executar e contribuir](CONTRIBUTING.md)
- [Arquitetura do projeto](docs/ARCHITECTURE.md)
- [API ASP.NET Core](backend/README.md)
- [Política de segurança](SECURITY.md)

## Autor

Desenvolvido por **Rafael Caires Pires**.

[GitHub](https://github.com/rafaelcairess) · [LinkedIn](https://www.linkedin.com/in/rafael-caires-pires-58225b238)
