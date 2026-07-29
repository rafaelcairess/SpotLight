# Backend do SpotLight

Esta pasta inicia a migração gradual do backend para C# e ASP.NET Core.
O frontend e o Supabase continuam funcionando durante a transição.

## O que é uma API?

Uma API é o servidor que recebe pedidos do frontend, executa regras e devolve
respostas. Por exemplo:

```text
React -> GET /api/health -> API C# -> JSON
```

A rota inicial confirma que o servidor está funcionando:

```http
GET http://localhost:5080/api/health
```

Também existe uma primeira rota protegida:

```http
GET http://localhost:5080/api/me
Authorization: Bearer <access-token-do-usuário>
```

Ela valida o token emitido pelo Supabase e devolve somente a identidade do
usuário autenticado. Leia [`AUTHENTICATION_GUIDE.md`](AUTHENTICATION_GUIDE.md)
para acompanhar o caminho completo da requisição.

## Executar localmente

```powershell
cd D:\Projetos\SpotLight
dotnet restore backend\SpotLight.sln
dotnet run --project backend\SpotLight.Api --urls http://localhost:5080
```

Abra:

- API: http://localhost:5080/api/health
- Swagger: http://localhost:5080/swagger

Em outro terminal, execute os testes:

```powershell
dotnet test backend\SpotLight.sln
```

## Render

Render é um serviço que executa a API na internet. O `Dockerfile` descreve como
montar o ambiente C# de forma reproduzível. No plano gratuito, o servidor pode
dormir após um período sem tráfego e demora para responder ao primeiro acesso.

Nenhuma chave deve ser gravada em `appsettings.json`. Segredos serão cadastrados
como variáveis de ambiente no computador e, futuramente, no Render.
