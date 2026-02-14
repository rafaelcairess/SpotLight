# SpotLight

Uma plataforma de descoberta de jogos com curadoria, comunidade e reviews reais. O foco é facilitar a busca por bons jogos, acompanhar descontos e criar uma biblioteca pessoal com progresso e conquistas.

![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?logo=vercel&logoColor=white)

## O que é o SpotLight

SpotLight é uma plataforma de descoberta de jogos com curadoria, comunidade e reviews reais. O foco é facilitar a busca por bons jogos, acompanhar descontos e criar uma biblioteca pessoal com progresso e conquistas.

## Onde está no ar

https://spot-light-xi.vercel.app/

## O que o site oferece

- Catálogo dinâmico com dados da Steam
- Destaques, rankings e promoções
- Biblioteca pessoal (jogando, completados, abandonados)
- Reviews e avaliações da comunidade
- Perfis públicos, seguidores e vitrine de platinas
- Coleções temáticas (incluindo co-op)

## Tecnologias usadas

- **Frontend**: Vite + React + TypeScript
- **UI**: TailwindCSS + shadcn/ui
- **Dados**: Supabase (PostgreSQL, Auth, RLS, Storage)
- **Sync externo**: Steam Web API + Steam Store API
- **Deploy**: Vercel
- **CI**: GitHub Actions (sync automático)

## Roadmap

- IA para recomendações personalizadas
- Melhorias contínuas de catálogo e curadoria
- Mais recursos sociais (feeds, conquistas e rankings)
- Integração com novas fontes no futuro

---

Feito com foco em qualidade e evolução constante.

## Nota sobre o código aberto

Este repositório não inclui as migrations SQL do Supabase (schema/DDL), pois o projeto está publicado e não exige execução local.
Se você quiser rodar localmente, será necessário criar seu próprio schema.
