# Etapa 1: imagem com o SDK completo, necessário para compilar C#.
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

# Define /src como a pasta atual dentro do container.
WORKDIR /src

# Copia primeiro o projeto para aproveitar o cache das dependências.
COPY ["SpotLight.Api.csproj", "."]

# Baixa os pacotes NuGet declarados no projeto.
RUN dotnet restore "SpotLight.Api.csproj"

# Copia todo o código-fonte restante.
COPY . .

# Compila em Release e grava o resultado em /app/publish.
RUN dotnet publish "SpotLight.Api.csproj" -c Release -o /app/publish --no-restore

# Etapa 2: imagem menor, apenas com o necessário para executar ASP.NET.
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

# Define /app como a pasta de execução.
WORKDIR /app

# Copia somente o programa compilado da etapa build.
COPY --from=build /app/publish .

# Faz o servidor escutar todas as interfaces na porta 8080.
ENV ASPNETCORE_URLS=http://+:8080

# Documenta a porta utilizada pelo container.
EXPOSE 8080

# Comando iniciado quando o container for executado.
ENTRYPOINT ["dotnet", "SpotLight.Api.dll"]
