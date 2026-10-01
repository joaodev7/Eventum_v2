# Eventum v2 — Monorepo

Repositório unificado da plataforma de gestão de eventos **Eventum**.

```
Eventum/
├── backend/       # Web API corporativa em .NET 8 (Clean Architecture & Docker) -> Hospedagem: Render
├── frontend/      # Single Page Application em React 18 + Vite + Tailwind -> Hospedagem: Cloudflare Pages
└── docs/          # Especificações de produto, documentação de APIs e arquitetura
```

---

## 🎯 Arquitetura de Deploy

| Serviço | Diretório | Provedor de Nuvem | Tipo de Build |
| :--- | :--- | :--- | :--- |
| **Backend API** | `backend/` | [Render](https://render.com) | Dockerfile (`mcr.microsoft.com/dotnet/sdk:8.0` + `aspnet:8.0`) |
| **Frontend Web** | `frontend/` | [Cloudflare Pages](https://pages.cloudflare.com) | Vite SPA (`dist`) |
| **Banco de Dados** | Nuvem externa | [NeonDB](https://neon.tech) | PostgreSQL Serverless |

---

## 🚀 Como Executar em Desenvolvimento Local

### 1. Backend (.NET 8)
```bash
# Opção A: Via Docker Compose (com banco PostgreSQL local)
cd backend
docker-compose up --build

# Opção B: Via .NET CLI
cd backend
dotnet run --project src/Eventum.Api/Eventum.Api.csproj
```
- Endpoint da API: `http://localhost:5000`
- Documentação Swagger: `http://localhost:5000/`

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
- Interface do Usuário: `http://localhost:8080` (ou porta informada pelo Vite)
- Configure o `.env` do frontend apontando para `VITE_API_URL="http://localhost:5000/api/v1"`

---

## ☁️ Guia de Deploy em Produção

### 1. Backend no Render
1. No painel do [Render](https://dashboard.render.com), crie um novo **Web Service**.
2. Conecte o repositório `joaodev7/Eventum_v2`.
3. Configure:
   - **Root Directory:** `backend`
   - **Runtime:** `Docker`
   - **Dockerfile Path:** `./Dockerfile`
4. Defina as variáveis de ambiente essenciais (consulte `backend/.env.example`):
   - `ASPNETCORE_ENVIRONMENT`: `Production`
   - `ConnectionStrings__DefaultConnection`: String de conexão do NeonDB
   - `Jwt__Secret`: Chave secreta de no mínimo 32 caracteres
   - `Jwt__Issuer`: `EventumApi`
   - `Jwt__Audience`: `EventumClient`
   - `PORT`: `10000`

### 2. Frontend no Cloudflare Pages
1. No painel do [Cloudflare Pages](https://dash.cloudflare.com), selecione **Create a project** > **Connect to Git**.
2. Escolha o repositório `joaodev7/Eventum_v2`.
3. Configure os parâmetros de compilação:
   - **Root directory:** `frontend`
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Adicione a variável de ambiente:
   - `VITE_API_URL`: URL da sua API no Render com sufixo `/api/v1` (ex: `https://eventum-api.onrender.com/api/v1`)
5. Clique em **Save and Deploy**.

---

## 📚 Documentação Adicional

Consulte o diretório [`docs/`](./docs) para especificações detalhadas:
- [Documentação Base da Plataforma](./docs/Eventum_Documentacao_Base_Agente.md)
- [Funcionalidades](./docs/FEATURES.md)
- [Planos de Assinatura](./docs/SUBSCRIPTION_PLANS.md)
- [Migração da API](./docs/DOCUMENTACAO_MIGRACAO_API.md)
