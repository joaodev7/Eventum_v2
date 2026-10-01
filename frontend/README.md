# Eventum — Frontend (React + Vite + Tailwind CSS)

Interface web da plataforma de gestão de eventos **Eventum**, desenvolvida em React 18, TypeScript, Tailwind CSS e componentes shadcn/ui.

---

## 🛠️ Tecnologias

- **React 18** com **TypeScript**
- **Vite** para compilação ultrarrápida
- **Tailwind CSS** + **shadcn/ui** para estilização e componentes de UI
- **TanStack React Query** para cache e sincronização de dados de API
- **React Router** para navegação SPA

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js 18+ ou Bun

### Passos:
1. Acesse o diretório do frontend:
```bash
cd frontend
```
2. Instale as dependências:
```bash
npm install
```
3. Crie o arquivo `.env` baseado no `.env.example`:
```bash
cp .env.example .env
```
Defina a variável `VITE_API_URL` apontando para o backend local:
```env
VITE_API_URL="http://localhost:5000/api/v1"
```
4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

---

## ☁️ Guia de Deploy no Cloudflare Pages

O frontend está configurado para deploy contínuo via [Cloudflare Pages](https://pages.cloudflare.com).

### Passo a Passo no Cloudflare Pages:
1. No painel da Cloudflare, navegue até **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. Selecione o repositório `joaodev7/Eventum_v2`.
3. Defina as seguintes configurações de build:
   - **Project Name:** `eventum-frontend` (ou o que desejar)
   - **Production branch:** `main`
   - **Framework preset:** `Vite`
   - **Root directory:** `frontend` *(Obrigatório!)*
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Na seção **Environment variables**, adicione:
   - `VITE_API_URL`: URL da sua API no Render com o prefixo `/api/v1` (ex: `https://eventum-api.onrender.com/api/v1`)
5. Clique em **Save and Deploy**.

> [!NOTE]
> O arquivo `public/_redirects` já está configurado com `/* /index.html 200` para garantir que o roteamento de Single Page Application funcione sem erros 404 em recarregamentos de páginas e links diretos.
