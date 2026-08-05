<div align="center">

# Contribuindo com o SpotLight

Obrigado por dedicar seu tempo para melhorar o projeto.

[README](README.md) · [Arquitetura](docs/ARCHITECTURE.md) · [Segurança](SECURITY.md)

</div>

Este documento concentra a configuração local, os comandos de validação e os padrões usados no repositório. Para entender o produto antes de alterar o código, comece pelo [README](README.md).

## Pré-requisitos

### Frontend e Supabase

- [Node.js 20](https://nodejs.org/) e npm
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)
- Uma conta e um projeto no Supabase

### Backend C#

- [.NET SDK 8](https://dotnet.microsoft.com/download/dotnet/8.0)

O SDK .NET é necessário apenas para trabalhar na API localizada em `backend/`.

## Preparando o ambiente

### 1. Clone e instale as dependências

```bash
git clone https://github.com/rafaelcairess/SpotLight.git
cd SpotLight
npm ci
```

### 2. Crie o arquivo de ambiente

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

No Linux ou macOS:

```bash
cp .env.example .env
```

Preencha as variáveis públicas usadas pelo frontend:

| Variável                        | Uso                             |
| ------------------------------- | ------------------------------- |
| `VITE_SUPABASE_URL`             | URL pública do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave publicável do projeto     |

> [!WARNING]
> Nunca use o prefixo `VITE_` em segredos. Variáveis com esse prefixo podem ser incluídas no JavaScript enviado ao navegador.

Segredos das Edge Functions devem ser cadastrados no painel do Supabase em **Edge Functions → Secrets**. Para scripts administrativos locais, mantenha `SUPABASE_SERVICE_ROLE_KEY`, `STEAM_API_KEY` e outros valores privados somente no `.env`, que não é versionado.

### 3. Vincule o projeto Supabase

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

> [!IMPORTANT]
> Não edite migrations que já foram aplicadas. Toda alteração de schema deve ser registrada em uma nova migration.

### 4. Execute o frontend

```bash
npm run dev
```

O Vite exibe o endereço local no terminal, normalmente `http://localhost:5173`.

## Executando a API C#

Restaure as dependências e inicie a API:

```bash
dotnet restore backend/SpotLight.sln
dotnet run --project backend/SpotLight.Api --urls http://localhost:5080
```

| Recurso              | Endereço                                                             |
| -------------------- | -------------------------------------------------------------------- |
| Health check         | `http://localhost:5080/api/health`                                   |
| Swagger              | `http://localhost:5080/swagger`                                      |
| Guia de autenticação | [`backend/AUTHENTICATION_GUIDE.md`](backend/AUTHENTICATION_GUIDE.md) |

## Scripts do frontend

| Comando                    | Finalidade                             |
| -------------------------- | -------------------------------------- |
| `npm run dev`              | Inicia o servidor de desenvolvimento   |
| `npm run build`            | Gera o build de produção               |
| `npm run preview`          | Visualiza o build localmente           |
| `npm run format:check`     | Verifica a formatação com Prettier     |
| `npm run lint`             | Executa o ESLint                       |
| `npm run typecheck`        | Valida os tipos TypeScript             |
| `npm test`                 | Executa os testes com Vitest           |
| `npm run sync:steam`       | Atualiza os dados populares da Steam   |
| `npm run refresh:rankings` | Atualiza o ranking de jogadores ativos |
| `npm run check:alerts`     | Processa os alertas de preço           |
| `npm run set:featured`     | Define o jogo em destaque do dia       |

Os scripts administrativos dependem das variáveis privadas descritas em `.env.example`.

## Verificações antes do pull request

### Frontend

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

### Backend

```bash
dotnet format backend/SpotLight.sln --verify-no-changes
dotnet build backend/SpotLight.sln --configuration Release
dotnet test backend/SpotLight.sln --configuration Release
dotnet list backend/SpotLight.sln package --vulnerable --include-transitive
```

O workflow de [integração contínua](https://github.com/rafaelcairess/SpotLight/actions/workflows/ci.yml) repete essas verificações nos pushes e pull requests direcionados à branch `main`.

## Organização do código

- Mantenha componentes, páginas e hooks dentro do domínio correspondente em `src/features/`.
- Coloque o acesso compartilhado a dados em hooks e mantenha regras de negócio fora dos componentes visuais.
- Invalide as queries relacionadas depois de uma mutation.
- Use `getEffectiveHours()` ao trabalhar com horas importadas ou definidas manualmente.
- Crie uma nova migration para qualquer mudança no banco.
- Preserve as políticas RLS e valide operações com usuários diferentes.

O mapa completo de diretórios e fluxos de dados está em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Fluxo de contribuição

1. Atualize sua branch a partir de `main`.
2. Crie uma branch curta e descritiva, como `feat/profile-stats` ou `fix/private-library`.
3. Faça uma alteração pequena e focada.
4. Execute as verificações relacionadas ao que foi alterado.
5. Crie um commit que explique o resultado da mudança.
6. Abra um pull request para `main`.

Exemplos de mensagens de commit:

```text
feat(backend): adiciona consulta de perfil
fix(profile): respeita biblioteca privada
test(auth): cobre token expirado
docs: atualiza guia de contribuição
```

No pull request, inclua:

- o problema ou objetivo;
- a solução adotada;
- como a mudança foi testada;
- screenshots para alterações visuais;
- migrations ou novas variáveis de ambiente, quando existirem.

## Regras de segurança

- Nunca versione `.env`, tokens, senhas, dumps ou arquivos gerados.
- Não envie `service_role`, segredos de OAuth ou chaves da Steam para o navegador.
- Valide autenticação e autorização antes de confiar em um `user_id` recebido do cliente.
- Não divulgue vulnerabilidades em issues públicas.

Para relatar uma vulnerabilidade, siga as instruções do [`SECURITY.md`](SECURITY.md).
