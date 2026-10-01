# Eventum — Backend API (.NET 8)

API RESTful corporativa para a plataforma de gestão de eventos **Eventum**, construída sobre arquitetura limpa (Clean Architecture), EF Core 8 e PostgreSQL (NeonDB).

---

## 🏗️ Arquitetura

O backend está modularizado nas seguintes camadas:

```
backend/
├── src/
│   ├── Eventum.Domain/          # Entidades de domínio, Enums, Regras de negócio puras
│   ├── Eventum.Application/     # Casos de uso, DTOs, Interfaces, Serviços de aplicação
│   ├── Eventum.Infrastructure/  # EF Core, Migrations, Repositórios, JWT, Gateways externos
│   └── Eventum.Api/             # Controllers, Middlewares, Filtros, Program.cs
├── tests/
│   ├── Eventum.UnitTests/       # Testes unitários de regras de negócio
│   └── Eventum.IntegrationTests/# Testes de integração de endpoints e fluxo
├── Dockerfile                   # Build multi-stage otimizado para deploy em contêiner
├── docker-compose.yml           # Ambiente local com PostgreSQL
├── Eventum.slnx                 # Solução .NET
└── .env.example                 # Modelo de variáveis de ambiente
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- .NET 8 SDK instalado
- Docker e Docker Compose (opcional para banco local)

### Opção 1: Executando com Docker Compose (Banco + API)
```bash
cd backend
docker-compose up --build
```
A API estará acessível em: `http://localhost:5000` (Swagger em `http://localhost:5000/`)

### Opção 2: Executando diretamente com .NET CLI
1. Configure as variáveis de ambiente ou utilize o `appsettings.Development.json`.
2. Restaure e execute:
```bash
cd backend
dotnet restore
dotnet run --project src/Eventum.Api/Eventum.Api.csproj
```

---

## ☁️ Guia de Deploy no Render

Este backend está pronto para deploy como **Web Service** conteinerizado no [Render](https://render.com).

### Passo a Passo no Render:
1. No painel do Render, clique em **New +** > **Web Service**.
2. Conecte o repositório GitHub: `joaodev7/Eventum_v2`.
3. Configure os seguintes campos:
   - **Name:** `eventum-api` (ou o nome que preferir)
   - **Region:** Selecione a região mais próxima (ex: `Ohio (US East)` ou similar ao seu banco Neon)
   - **Branch:** `main`
   - **Root Directory:** `backend` *(Obrigatório!)*
   - **Runtime:** `Docker`
   - **Dockerfile Path:** `./Dockerfile`
   - **Instance Type:** `Free` ou superior
4. Em **Environment Variables**, cadastre:
   - `ASPNETCORE_ENVIRONMENT`: `Production`
   - `ConnectionStrings__DefaultConnection`: String de conexão do seu NeonDB / PostgreSQL (com `SSL Mode=Require;Trust Server Certificate=true`)
   - `Jwt__Secret`: Sua chave secreta com no mínimo 32 caracteres
   - `Jwt__Issuer`: `EventumApi`
   - `Jwt__Audience`: `EventumClient`
   - `Jwt__ExpiryMinutes`: `120`
   - `Jwt__RefreshTokenExpiryDays`: `30`
   - `PORT`: `10000` *(O Program.cs e o Dockerfile já estão configurados para escutar na porta definida pelo Render)*
5. Clique em **Create Web Service**.
6. Ao finalizar o deploy, copie a URL gerada (ex: `https://eventum-api.onrender.com`). Ela será utilizada no frontend.
