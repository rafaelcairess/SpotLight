# Contribuindo com o SpotLight

Obrigado pelo interesse em contribuir. Este documento concentra a configuração
local e os padrões técnicos para manter o README principal focado no produto.

## Pré-requisitos

- Node.js 20 e npm
- .NET SDK 8
- Supabase CLI
- Uma conta e um projeto no Supabase

## Preparação do projeto

```bash
git clone https://github.com/rafaelcairess/SpotLight.git
cd SpotLight
npm ci
```

Copie o modelo de variáveis de ambiente.

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

No Linux ou macOS:

```bash
cp .env.example .env
```

Preencha as variáveis públicas do frontend:

| Variável                        | Uso                             |
| ------------------------------- | ------------------------------- |
| `VITE_SUPABASE_URL`             | URL pública do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave publicável do projeto     |

> Nunca coloque `SUPABASE_SERVICE_ROLE_KEY`, chaves Steam ou outros segredos em
> variáveis com prefixo `VITE_`. Tudo que começa com `VITE_` pode ser incluído
> no JavaScript enviado ao navegador.

Segredos das Edge Functions devem ser cadastrados no painel do Supabase em
_Edge Functions → Secrets_. Para scripts administrativos locais, mantenha os
valores somente no arquivo `.env`, que não é versionado.

## Banco de dados

Faça login e vincule a CLI ao seu projeto antes de aplicar migrations:

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

Nunca altere migrations antigas que já foram aplicadas. Para uma mudança de
schema, crie uma nova migration.

## Executando o frontend

```bash
npm run dev
```

O Vite informa no terminal o endereço local, normalmente
`http://localhost:5173`.

## Executando a API C#

```bash
dotnet restore backend/SpotLight.sln
dotnet run --project backend/SpotLight.Api --urls http://localhost:5080
```

- Health check: `http://localhost:5080/api/health`
- Swagger: `http://localhost:5080/swagger`
- Autenticação: [`backend/AUTHENTICATION_GUIDE.md`](backend/AUTHENTICATION_GUIDE.md)

## Verificações antes de enviar

Frontend:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

Backend:

```bash
dotnet format backend/SpotLight.sln --verify-no-changes
dotnet build backend/SpotLight.sln --configuration Release
dotnet test backend/SpotLight.sln --configuration Release
dotnet list backend/SpotLight.sln package --vulnerable --include-transitive
```

O GitHub Actions repete essas verificações para cada push e pull request.

## Organização das mudanças

- Faça alterações pequenas e focadas.
- Não misture refatoração, funcionalidade e documentação sem necessidade.
- Preserve as políticas RLS e valide operações com usuários diferentes.
- Nunca versione `.env`, tokens, senhas, dumps ou arquivos gerados.
- Explique no pull request o problema, a solução e como a mudança foi testada.

Mensagens de commit podem seguir estes exemplos:

```text
feat(backend): adiciona consulta de perfil
fix(profile): respeita biblioteca privada
test(auth): cobre token expirado
docs: atualiza roadmap
```
