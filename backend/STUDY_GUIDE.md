# Guia de estudo dos arquivos de configuração

Os arquivos `.cs` e `.csproj` possuem comentários diretamente no código.
Este documento explica os formatos que não aceitam comentários ou que são
gerados por ferramentas.

## `SpotLight.Api/appsettings.json`

JSON tradicional não aceita comentários. Adicionar `//` ou `/* */` faria a API
falhar ao carregar a configuração.

```json
{
  "Cors": {
    "AllowedOrigins": ["http://localhost:5173", "https://spot-light-xi.vercel.app"]
  }
}
```

- `Cors` agrupa configurações de acesso pelo navegador.
- `AllowedOrigins` é a lista de sites autorizados.
- `localhost:5173` é o frontend Vite durante o desenvolvimento.
- `spot-light-xi.vercel.app` é o frontend publicado.
- Essa lista não autentica usuários; apenas bloqueia outros sites no navegador.

```json
"Logging": {
  "LogLevel": {
    "Default": "Information",
    "Microsoft.AspNetCore": "Warning"
  }
}
```

- `Logging` configura mensagens produzidas pela aplicação.
- `Default: Information` mostra informações, alertas e erros do nosso código.
- `Microsoft.AspNetCore: Warning` reduz mensagens internas repetitivas do framework.

```json
"AllowedHosts": "*"
```

- Controla os valores aceitos no cabeçalho HTTP `Host`.
- `*` aceita qualquer host. Antes de produção podemos restringir aos domínios reais.
- Isso é diferente de CORS: `AllowedHosts` protege o servidor; CORS orienta o navegador.

Segredos nunca devem entrar neste arquivo versionado. Senhas, tokens e chaves
serão armazenados com `dotnet user-secrets` localmente e variáveis de ambiente
no serviço de hospedagem.

## `SpotLight.Api/appsettings.Development.json`

Sobrescreve configurações somente quando o ambiente é `Development`. O ASP.NET
combina primeiro `appsettings.json` e depois este arquivo. Valores repetidos no
arquivo de desenvolvimento vencem.

## `SpotLight.Api/Properties/launchSettings.json`

É criado pelo template do .NET e descreve como Visual Studio e `dotnet run`
iniciam o projeto localmente:

- `commandName: Project` executa diretamente o projeto;
- `launchBrowser: true` permite abrir o navegador;
- `launchUrl: swagger` escolhe a página inicial;
- `applicationUrl` define a porta local;
- `ASPNETCORE_ENVIRONMENT: Development` ativa Swagger e configuração de desenvolvimento.

Ele não controla a publicação no Render; o Dockerfile controla o container.

## `SpotLight.Api.http`

É um arquivo de exemplos de requisições. Visual Studio e extensões REST Client
conseguem executar as chamadas diretamente pelo editor. Ele não participa da
compilação da API.

## `SpotLight.sln`

A solution é um índice dos projetos. O comando `dotnet new sln` gerou esse
arquivo e `dotnet sln add` registrou:

- `SpotLight.Api`: aplicação executável;
- `SpotLight.Api.Tests`: testes automatizados.

Não editamos a solution manualmente porque a CLI mantém identificadores e
configurações de compilação consistentes.
