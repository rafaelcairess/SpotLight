<div align="center">

# SpotLight

### Sua biblioteca, suas conquistas e sua história gamer em um só perfil.

<p>
  <a href="https://spot-light-xi.vercel.app">
    <img alt="SpotLight online" src="https://img.shields.io/badge/PROJETO-ONLINE-22c55e?style=for-the-badge&logo=vercel&logoColor=white">
  </a>
  <a href="https://github.com/rafaelcairess/SpotLight/actions/workflows/ci.yml">
    <img alt="Status da CI" src="https://img.shields.io/github/actions/workflow/status/rafaelcairess/SpotLight/ci.yml?branch=main&style=for-the-badge&logo=githubactions&logoColor=white&label=CI">
  </a>
  <a href="https://github.com/rafaelcairess/SpotLight/commits/main">
    <img alt="Último commit" src="https://img.shields.io/github/last-commit/rafaelcairess/SpotLight?style=for-the-badge&logo=github&label=LAST%20COMMIT">
  </a>
</p>

<p>
  <img alt="React 18" src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black">
  <img alt="TypeScript 5" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="Vite 7" src="https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white">
  <img alt="Tailwind CSS 3" src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white">
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=flat-square&logo=supabase&logoColor=white">
  <img alt=".NET 8" src="https://img.shields.io/badge/.NET-8-512BD4?style=flat-square&logo=dotnet&logoColor=white">
</p>

[Acessar o projeto](https://spot-light-xi.vercel.app) ·
[Ver funcionalidades](#principais-funcionalidades) ·
[Conhecer a arquitetura](#arquitetura) ·

<br>

<a href="https://spot-light-xi.vercel.app">
  <img src="docs/screenshots/explorar.webp" alt="Página Explorar do SpotLight com jogos em destaque, coleções e rankings" width="100%">
</a>

</div>

## Sobre o projeto

Steam, Xbox e PlayStation guardam partes diferentes da nossa vida nos games. Para lembrar o que jogou, quanto tempo investiu ou quais jogos completou, normalmente é preciso consultar vários perfis.

Eu criei o **SpotLight** para reunir essa história em um só lugar. A aplicação importa a biblioteca da Steam, organiza jogos de diferentes plataformas e transforma esses dados em um perfil gamer público e compartilhável.

Além da biblioteca pessoal, o SpotLight oferece busca, rankings, promoções, reviews e recomendações para ajudar o usuário a escolher o próximo jogo.

> [!NOTE]
> A sincronização automática da Steam está disponível. Jogos e platinas de Xbox e PlayStation podem ser cadastrados manualmente enquanto as integrações oficiais continuam em desenvolvimento.

## Principais funcionalidades

| Área               | O que o SpotLight oferece                                                  |
| ------------------ | -------------------------------------------------------------------------- |
| **Biblioteca**     | Importação da Steam, horas jogadas, status, favoritos e jogos platinados   |
| **Perfil**         | Página pública com avatar, bio, jogo favorito, biblioteca e vitrines       |
| **Descoberta**     | Busca, coleções, promoções e rankings atualizados com dados da Steam       |
| **Comunidade**     | Amigos, comentários, reviews e listas públicas compartilháveis             |
| **Personalização** | Privacidade por perfil e jogo, horas manuais e identificação da plataforma |
| **Alertas**        | Notificação por e-mail quando um jogo atinge o preço desejado              |
| **Idiomas**        | Interface em português, inglês e espanhol                                  |

## Demonstração

<table>
  <tr>
    <td width="50%">
      <a href="https://spot-light-xi.vercel.app/u/aeb">
        <img src="docs/screenshots/perfil-publico.webp" alt="Perfil público do SpotLight">
      </a>
    </td>
    <td width="50%">
      <a href="https://spot-light-xi.vercel.app/top">
        <img src="docs/screenshots/top-games.webp" alt="Ranking Top Games do SpotLight">
      </a>
    </td>
  </tr>
  <tr>
    <td align="center"><strong>Perfil público</strong></td>
    <td align="center"><strong>Top Games</strong></td>
  </tr>
</table>

## Arquitetura

```text
Usuário
   │
   ▼
React + TypeScript (Vercel)
   │
   ├── Supabase Auth
   ├── PostgreSQL + Row Level Security
   ├── Storage
   └── Edge Functions (Deno)
              │
              └── Steam Web API e serviços externos
```

O frontend é organizado por domínios de negócio. O acesso a dados fica em hooks reutilizáveis e o TanStack Query cuida de cache, mutations e invalidações. Operações que dependem de segredos são executadas nas Edge Functions, nunca no navegador.

| Camada        | Tecnologias                               |
| ------------- | ----------------------------------------- |
| **Frontend**  | React 18, TypeScript, Vite e React Router |
| **Interface** | Tailwind CSS, shadcn/ui e Radix UI        |
| **Dados**     | TanStack Query, Supabase e PostgreSQL     |
| **Backend**   | Supabase Edge Functions com Deno          |
| **Qualidade** | Vitest, ESLint, Prettier e TypeScript     |
| **Entrega**   | Vercel e GitHub Actions                   |

Uma API em **ASP.NET Core 8** também está sendo desenvolvida como base para uma migração gradual do backend. Ela já possui health check, autenticação JWT/JWKS e testes automatizados, mas ainda não faz parte do ambiente de produção.

Mais detalhes estão no [guia de arquitetura](docs/ARCHITECTURE.md).

## Qualidade e segurança

- **Row Level Security:** políticas de acesso protegem os dados de cada usuário.
- **Segredos no servidor:** tokens administrativos e chaves de integração ficam fora do bundle do frontend.
- **Proteção dos fluxos de autenticação:** nonce, cookies HttpOnly e validação explícita de redirects.
- **Rate limiting:** operações de escrita possuem limites persistentes.
- **Integração contínua:** cada push e pull request valida formatação, lint, tipos, testes, build e dependências vulneráveis.

Consulte a [política de segurança](SECURITY.md) para conhecer as versões suportadas e o processo de reporte de vulnerabilidades.


O frontend estará disponível em `http://localhost:5173`. Configuração do banco, segredos, API C# e comandos de validação estão no [guia de contribuição](CONTRIBUTING.md).

## Documentação

- [Guia de contribuição](CONTRIBUTING.md)
- [Arquitetura e organização do código](docs/ARCHITECTURE.md)
- [API ASP.NET Core](backend/README.md)
- [Autenticação da API C#](backend/AUTHENTICATION_GUIDE.md)
- [Política de segurança](SECURITY.md)

## Contribuindo

Contribuições são bem-vindas. Antes de abrir um pull request, leia o [CONTRIBUTING.md](CONTRIBUTING.md) e execute as verificações do frontend e do backend relacionadas à sua alteração.

## Autor

Desenvolvido por **Rafael Caires Pires**.

[GitHub](https://github.com/rafaelcairess) · [LinkedIn](https://www.linkedin.com/in/rafael-caires-pires-58225b238)

<div align="center">

Se o SpotLight chamou sua atenção, deixe uma estrela. ⭐

</div>
