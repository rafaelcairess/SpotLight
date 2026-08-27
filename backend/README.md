# Backend do SpotLight

API ASP.NET Core usada na migração gradual do backend. O frontend e os serviços
existentes do Supabase continuam ativos durante a transição.

## Endpoints

- `GET /api/health`: verifica a disponibilidade da API.
- `GET /health`: endpoint de health check para infraestrutura.
- `GET /api/me`: retorna a identidade do usuário autenticado por token do Supabase.

## Desenvolvimento local

```powershell
dotnet restore backend\SpotLight.sln
dotnet run --project backend\SpotLight.Api --urls http://localhost:5080
```

O Swagger fica disponível em `http://localhost:5080/swagger` no ambiente de
desenvolvimento.

## Configuração

- `Cors:AllowedOrigins`: origens autorizadas a consumir a API.
- `SupabaseAuth:Issuer`: emissor esperado nos tokens.
- `SupabaseAuth:Audience`: audiência esperada nos tokens.

Chaves e tokens devem ser fornecidos por variáveis de ambiente ou user secrets,
nunca gravados nos arquivos de configuração versionados.

## Testes

```powershell
dotnet test backend\SpotLight.sln
```
