# Stage 1: Build & Publish
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copia arquivos de projeto para cache de restauração do NuGet
COPY ["src/Eventum.Domain/Eventum.Domain.csproj", "src/Eventum.Domain/"]
COPY ["src/Eventum.Application/Eventum.Application.csproj", "src/Eventum.Application/"]
COPY ["src/Eventum.Infrastructure/Eventum.Infrastructure.csproj", "src/Eventum.Infrastructure/"]
COPY ["src/Eventum.Api/Eventum.Api.csproj", "src/Eventum.Api/"]

RUN dotnet restore "src/Eventum.Api/Eventum.Api.csproj"

# Copia todo o código fonte
COPY ["src/", "src/"]

# Compilação otimizada em Release
WORKDIR "/app/src/Eventum.Api"
RUN dotnet publish "Eventum.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Cria diretório de uploads local caso o storage local seja usado
RUN mkdir -p /app/wwwroot/uploads

COPY --from=build /app/publish .

# Define variáveis padrão de ambiente
ENV ASPNETCORE_ENVIRONMENT=Production
ENV DOTNET_RUNNING_IN_CONTAINER=true
ENV PORT=10000

EXPOSE 10000

ENTRYPOINT ["dotnet", "Eventum.Api.dll"]
