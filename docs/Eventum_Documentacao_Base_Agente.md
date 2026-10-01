# EVENTUM — DOCUMENTAÇÃO BASE PARA IMPLEMENTAÇÃO

> **Documento de referência para o agente de desenvolvimento.**
>
> Este documento consolida a especificação funcional/legada do Eventum e as diretrizes arquiteturais para a migração do projeto para uma estrutura própria, seguindo o mesmo padrão arquitetural adotado no PRAXIS.
>
> **Regra principal:** preserve as funcionalidades e regras de negócio documentadas abaixo, mas substitua a implementação baseada em Supabase por uma API própria em **ASP.NET Core 8 + Clean Architecture + Entity Framework Core + PostgreSQL**.

---

# 0. OBJETIVO DA IMPLEMENTAÇÃO

O agente deve transformar o Eventum atual, originalmente acoplado ao Supabase, em uma aplicação independente com:

- Frontend React + Vite + TypeScript;
- ASP.NET Core 8 Web API;
- Clean Architecture;
- PostgreSQL;
- Entity Framework Core;
- JWT + Refresh Token;
- RBAC global e autorização contextual por evento;
- Cloudflare R2/S3-compatible para arquivos;
- Resend/SMTP para e-mails;
- Mercado Pago para pagamentos de presentes;
- Stripe para assinaturas da plataforma;
- Swagger/OpenAPI;
- Docker;
- testes unitários e de integração;
- CI/CD compatível com a estratégia utilizada no PRAXIS.

O Supabase **não deve permanecer como dependência de runtime** da aplicação.

---

# 1. ARQUITETURA-ALVO

A solução deve seguir:

```text
Eventum
│
├── frontend/
│   └── React + Vite + TypeScript
│
├── src/
│   ├── Eventum.Api
│   ├── Eventum.Application
│   ├── Eventum.Domain
│   └── Eventum.Infrastructure
│
└── tests/
    ├── Eventum.UnitTests
    └── Eventum.IntegrationTests
```

Fluxo:

```text
React
   │
   │ HTTPS / REST / JSON
   ▼
Eventum.Api
   │
   ▼
Eventum.Application
   │
   ▼
Eventum.Domain
   ▲
   │
Eventum.Infrastructure
   │
   ├── PostgreSQL / EF Core
   ├── Cloudflare R2
   ├── Resend
   ├── Stripe
   └── Mercado Pago
```

## 1.1 Responsabilidades

### Eventum.Domain

Deve conter apenas regras e modelos do domínio:

- Entities;
- Enums;
- Value Objects;
- Domain Events, quando necessários;
- Interfaces de domínio;
- Domain Exceptions.

Não deve depender de:

- ASP.NET;
- EF Core;
- Stripe;
- Mercado Pago;
- R2;
- Resend.

### Eventum.Application

Deve conter:

- casos de uso;
- DTOs;
- Commands/Queries;
- validators;
- interfaces de infraestrutura;
- autorização contextual;
- regras de aplicação;
- serviços de aplicação.

Não deve conter detalhes de implementação de banco ou APIs externas.

### Eventum.Infrastructure

Deve conter:

- EF Core;
- DbContext;
- Entity Configurations;
- Migrations;
- repositórios;
- JWT;
- hashing;
- R2/S3;
- Resend;
- Stripe;
- Mercado Pago;
- serviços externos.

### Eventum.Api

Deve conter:

- Controllers;
- middleware;
- autenticação;
- configuração HTTP;
- Swagger;
- filtros;
- exception handling;
- rate limiting;
- CORS;
- dependency injection.

Controllers devem permanecer finos. Regras de negócio não devem ser implementadas diretamente nos Controllers.

---

# 2. ESTRUTURA RECOMENDADA

```text
Eventum/
│
├── src/
│   ├── Eventum.Api/
│   │   ├── Controllers/
│   │   ├── Middleware/
│   │   ├── Filters/
│   │   ├── Extensions/
│   │   ├── Configuration/
│   │   └── Program.cs
│   │
│   ├── Eventum.Application/
│   │   ├── Common/
│   │   │   ├── Interfaces/
│   │   │   ├── Models/
│   │   │   ├── Exceptions/
│   │   │   └── Behaviors/
│   │   ├── Auth/
│   │   ├── Users/
│   │   ├── Events/
│   │   ├── Guests/
│   │   ├── Tables/
│   │   ├── Gifts/
│   │   ├── Payments/
│   │   ├── Finance/
│   │   ├── Suppliers/
│   │   ├── Subscriptions/
│   │   ├── Storage/
│   │   └── SuperAdmin/
│   │
│   ├── Eventum.Domain/
│   │   ├── Entities/
│   │   ├── Enums/
│   │   ├── ValueObjects/
│   │   ├── Events/
│   │   ├── Interfaces/
│   │   └── Exceptions/
│   │
│   └── Eventum.Infrastructure/
│       ├── Persistence/
│       │   ├── Context/
│       │   ├── Configurations/
│       │   ├── Migrations/
│       │   └── Repositories/
│       ├── Authentication/
│       ├── Storage/
│       ├── Email/
│       ├── Payments/
│       │   ├── MercadoPago/
│       │   └── Stripe/
│       └── Services/
│
├── tests/
│   ├── Eventum.UnitTests/
│   └── Eventum.IntegrationTests/
│
├── docker-compose.yml
├── Dockerfile
├── Directory.Build.props
├── Directory.Packages.props
└── Eventum.sln
```

---

# 3. DECISÕES ARQUITETURAIS OBRIGATÓRIAS

## 3.1 Backend

Usar:

- .NET 8;
- ASP.NET Core Web API;
- C#;
- Entity Framework Core;
- PostgreSQL;
- JWT;
- Refresh Tokens;
- FluentValidation, se já utilizado no padrão do PRAXIS;
- Swagger/OpenAPI;
- xUnit para testes.

A documentação legada menciona Node.js/TypeScript/Prisma como possibilidades. **Essa parte está substituída por esta especificação. Não implementar Node.js, Prisma, Drizzle ou TypeORM.**

## 3.2 Banco

PostgreSQL será a fonte oficial de dados.

Não utilizar:

- `auth.users`;
- RLS do Supabase;
- RPCs do Supabase;
- triggers dependentes do Supabase;
- Supabase Storage.

Regras que antes estavam em RLS/RPC/Edge Functions devem migrar para:

- Domain;
- Application;
- EF Core;
- Controllers apenas quando for validação HTTP.

---

# 4. TENANT / ORGANIZATION

Não criar uma entidade `Tenant` ou `Organization` artificialmente nesta primeira migração.

O modelo atual é centrado em:

```text
User
  │
  ├── Event
  │      ├── Guests
  │      ├── Tables
  │      ├── Gifts
  │      ├── Expenses
  │      └── Suppliers
  │
  └── Subscription
```

O relacionamento entre usuários e eventos ocorre por `EventUser`.

Uma abstração `Organization` poderá ser introduzida futuramente caso o domínio realmente exija isso, principalmente para recursos de subcontas do plano Signature.

---

# 5. EVENT COMO CONTEXTO DE AUTORIZAÇÃO

O `Event` é o principal contexto de isolamento dos dados operacionais.

Qualquer consulta ou alteração envolvendo:

- Guest;
- GuestCompanion;
- Table;
- Gift;
- GiftPayment;
- Expense;
- ExpenseCategory;
- Supplier;
- PixConfig;
- MercadoPagoConnection;

deve validar o `EventId` e a autorização do usuário.

Nunca consultar um registro apenas por ID quando o recurso pertence a um evento.

Exemplo conceitual:

```csharp
var guest = await context.Guests
    .FirstOrDefaultAsync(x =>
        x.Id == guestId &&
        x.EventId == eventId);
```

A aplicação também deve verificar se o usuário possui acesso ao evento.

---

# 6. AUTORIZAÇÃO

## 6.1 Roles globais

```text
user
admin
superadmin
```

## 6.2 Roles do evento

```text
owner
admin
collaborator
viewer
```

Semântica:

### owner

- controle total;
- pode excluir evento;
- gerencia membros;
- configurações.

### admin

- gerenciamento completo do evento;
- convidados;
- mesas;
- presentes;
- finanças;
- configurações.

### collaborator

- consulta;
- atualização operacional;
- atividades como check-in/convidados.

### viewer

- somente leitura.

Não depender apenas de:

```csharp
[Authorize(Roles = "...")]
```

para regras específicas do evento.

Criar autorização contextual, por exemplo:

```csharp
await eventAuthorizationService
    .EnsureCanEditAsync(eventId, currentUserId);
```

---

# 7. AUTENTICAÇÃO

Implementar:

```text
Register
Login
Refresh
Logout
Me
Update Profile
Change Password
```

Modelo recomendado:

```text
Access Token
  └── curta duração

Refresh Token
  └── longa duração
  └── persistido no servidor
  └── rotacionado
  └── revogável
```

Não adotar o exemplo legado de JWT com duração de 7 dias como padrão.

O frontend não deve armazenar refresh token em `localStorage`.

Preferir:

- refresh token em cookie `HttpOnly`, `Secure`, `SameSite`;
- access token em memória quando possível.

---

# 8. SEGURANÇA

Implementar desde o início:

- CORS restritivo;
- HTTPS em produção;
- rate limiting;
- JWT validation;
- refresh token rotation;
- password hashing seguro;
- validação de entrada;
- autorização contextual;
- proteção contra IDOR;
- proteção de webhooks;
- validação de assinatura de Stripe;
- validação HMAC do Mercado Pago;
- criptografia dos tokens OAuth do Mercado Pago;
- logs sem dados sensíveis;
- tratamento global de exceções;
- não expor stack trace em produção.

---

# 9. WEBHOOKS E IDEMPOTÊNCIA

Criar uma infraestrutura de processamento idempotente para webhooks.

Recomendação:

```text
WebhookEvent
├── Id
├── Provider
├── ExternalEventId
├── EventType
├── Payload
├── ReceivedAt
├── ProcessedAt
├── Status
└── Error
```

Fluxo:

```text
Webhook
   ↓
Validar assinatura
   ↓
Registrar evento
   ↓
Verificar idempotência
   ↓
Processar
   ↓
Marcar processado
```

Um mesmo webhook recebido várias vezes não pode gerar pagamentos ou assinaturas duplicados.

---

# 10. PAGAMENTOS

Separar conceitualmente:

```text
Mercado Pago
└── pagamentos dos presentes

Stripe
└── assinatura do SaaS Eventum
```

Criar abstrações de provider na Application/Infrastructure.

Exemplo:

```csharp
public interface IGiftPaymentProvider
{
    Task<PaymentCheckoutResult> CreateCheckoutAsync(
        Gift gift,
        GuestPaymentData guest);
}
```

O Domain/Application não deve depender diretamente de SDK específico.

---

# 11. STORAGE

Usar Cloudflare R2 ou storage S3-compatible.

Estrutura sugerida:

```text
eventum/
├── users/
│   └── {userId}/
│       └── avatar/
│
└── events/
    └── {eventId}/
        ├── hero/
        ├── invitation/
        └── gallery/
```

O banco deve armazenar metadados/keys e não os bytes das imagens.

Preferir URLs pré-assinadas quando apropriado.

---

# 12. E-MAIL

Criar:

```csharp
public interface IEmailService
{
    Task SendAsync(
        string recipient,
        string subject,
        string html);
}
```

A infraestrutura poderá utilizar Resend.

Casos de uso específicos devem ficar na Application:

```text
InvitationEmailService
ReconfirmationEmailService
```

O caso de uso não deve conhecer a API do Resend.

---

# 13. TESTES

Criar testes unitários para:

- regras de domínio;
- autorização;
- RSVP;
- reconfirmação;
- capacidade das mesas;
- cálculo financeiro;
- limites dos planos;
- transições de pagamento.

Criar testes de integração para:

- autenticação;
- isolamento entre eventos;
- CRUD de eventos;
- convidados;
- RSVP;
- webhooks;
- assinaturas.

Teste obrigatório de isolamento:

```text
User A → Event A
User B → Event B

User A tenta acessar Guest de Event B
→ acesso negado
```

---

# 14. MIGRAÇÃO DO FRONTEND

O frontend deve deixar de utilizar:

```text
@supabase/supabase-js
```

e passar a utilizar um cliente HTTP central.

Estrutura:

```text
src/
├── api/
│   ├── client.ts
│   ├── auth.ts
│   ├── events.ts
│   ├── guests.ts
│   ├── tables.ts
│   ├── gifts.ts
│   ├── finance.ts
│   └── subscriptions.ts
│
├── features/
├── hooks/
├── pages/
├── components/
├── contexts/
├── types/
└── utils/
```

TanStack Query pode continuar sendo utilizado.

Fluxo:

```text
React
 ↓
TanStack Query
 ↓
API service
 ↓
Axios
 ↓
Eventum API
```

---

# 15. NÃO MIGRAR TUDO DE UMA VEZ

Implementar incrementalmente.

Ordem obrigatória sugerida:

```text
FASE 0
Foundation

FASE 1
Domain

FASE 2
Database

FASE 3
Authentication

FASE 4
Events

FASE 5
Guests + RSVP

FASE 6
Tables

FASE 7
Gifts + PIX + Mercado Pago

FASE 8
Finance + Suppliers

FASE 9
Subscriptions + Stripe

FASE 10
Storage + Email

FASE 11
SuperAdmin

FASE 12
Frontend migration

FASE 13
Integration tests + homologation
```

---

# 16. CRITÉRIO DE CONCLUSÃO

Uma fase só deve ser considerada concluída quando:

- código compilando;
- migrations funcionando;
- endpoints funcionando;
- validações implementadas;
- autorização implementada;
- testes relevantes passando;
- Swagger atualizado;
- sem dependência desnecessária do Supabase;
- nenhuma regra crítica implementada somente no frontend.

Não marcar uma tarefa como concluída apenas porque os arquivos foram criados.

---

# 17. COMPATIBILIDADE COM O PRAXIS

O Eventum deve seguir a mesma filosofia estrutural do PRAXIS sempre que isso não entrar em conflito com o domínio do Eventum.

Priorizar:

- Clean Architecture;
- .NET 8;
- PostgreSQL;
- EF Core;
- Docker;
- configuração por environment;
- serviços de infraestrutura isolados;
- DTOs;
- validação;
- tratamento global de exceções;
- Swagger;
- testes;
- integração por interfaces;
- deploy independente.

Não copiar regras de negócio do PRAXIS para o Eventum.

Copiar apenas padrões arquiteturais e de engenharia.

---

# 18. INSTRUÇÃO PARA O AGENTE

Antes de implementar qualquer alteração:

1. Inspecione o repositório atual.
2. Identifique frontend, Supabase, tabelas, hooks, contexts, Edge Functions e integrações.
3. Compare a implementação existente com esta documentação.
4. Não apague funcionalidades existentes sem verificar sua correspondência nesta especificação.
5. Não recrie funcionalidades que já existem.
6. Preserve o comportamento funcional atual.
7. Migre primeiro o backend/core e depois substitua o acesso do frontend.
8. Mantenha mudanças pequenas e verificáveis.
9. Rode build e testes após cada etapa relevante.
10. Documente decisões que divergirem desta especificação.

**Não iniciar criando todos os Controllers.**

A primeira implementação deve ser:

```text
Solution
↓
Projetos
↓
Referências
↓
Pacotes
↓
Domain
↓
Application
↓
Infrastructure
↓
Api
↓
DbContext
↓
Entity Configurations
↓
Migrations
↓
Auth
```

Somente depois iniciar os módulos funcionais.

---

# 19. ESPECIFICAÇÃO ORIGINAL DO EVENTUM

A seção abaixo é a documentação funcional e técnica existente do Eventum e deve ser tratada como fonte de verdade para funcionalidades, entidades, campos, endpoints, regras de negócio e comportamento legado.

> **Importante:** quando esta documentação original entrar em conflito com as decisões da seção 0–18, as seções 0–18 definem a arquitetura-alvo, enquanto esta seção preserva o comportamento funcional que precisa ser migrado.

---

# Documentação Técnica Completa: Eventum Platform
## Guia Definitivo de Arquitetura, Funcionalidades, Banco de Dados e Reestruturação para API Própria (Sem Supabase)

---

## 1. Visão Geral Executiva

O **Eventum** é uma plataforma SaaS multi-tenant voltada para cerimonialistas, anfitriões e empresas de organização de eventos (casamentos, aniversários, formaturas, festas corporativas, etc.). A aplicação oferece um ecossistema completo para:

1. **Gestão de Eventos:** Criação de múltiplos eventos com configurações visuais avançadas, páginas públicas personalizadas, cronogramas e checklists.
2. **Controle de Convidados e RSVP Digital:** Disparo de convites por e-mail com tokens de acesso únicos, confirmação de presença (RSVP) com controle de acompanhantes individuais e fluxo de 2ª confirmação (reconfirmação).
3. **Organização de Mesas:** Alocação visual e capacidade de assentos para convidados confirmados.
4. **Lista de Presentes Virtuais e Pagamentos:** Criação de itens de presentes monetizados, integração PIX direta (chave e QR Code) e integração transparente com o **Mercado Pago** via OAuth individual do organizador.
5. **Gestão Financeira & Fornecedores:** Controle de orçamento, custos por categoria, controle de pagamentos a fornecedores e balanço em tempo real.
6. **Planos de Assinatura:** Sistema de monetização por planos (**Essentia**, **Atelier**, **Signature**) integrados ao Stripe para faturamento mensal e anual.
7. **Painel SuperAdmin:** Gestão centralizada de usuários, eventos, assinaturas e métricas de faturamento (MRR).

### Situação Atual vs. Objetivo da Migração

- **Arquitetura Legada:** Frontend em React (Vite + TypeScript + Tailwind CSS + Shadcn UI + TanStack Query) acoplado diretamente ao BaaS **Supabase**, utilizando cliente JS para Auth, PostgreSQL com Row-Level Security (RLS), Triggers, Stored Procedures (RPCs), Storage Buckets e 10 Deno Edge Functions.
- **Objetivo da Reestruturação:** Remover completamente o cliente e a dependência do ecossistema Supabase, substituindo-o por um **Backend Próprio (API RESTful)** independente (Node.js/NestJS/Fastify/Express, Go, Python ou C#), utilizando banco relacional PostgreSQL nativo, autenticação JWT robusta, camada de serviços corporativa, webhooks seguros e provedor de armazenamento de arquivos compatível com S3.

---

## 2. Arquitetura da Nova Solução com API Própria

```
┌────────────────────────────────────────────────────────┐
│             Frontend SPA (React + Vite + TS)           │
│   - TanStack Query  - Axios / Fetch Client  - Shadcn   │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / REST API / JSON
                            │ (Bearer JWT Token)
┌───────────────────────────▼────────────────────────────┐
│                    API Gateway / Backend               │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Middlewares: CORS, RateLimit, JWT Auth, RBAC     │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌───────────────┬────────────────┬─────────────────┐  │
│  │ Auth & Users  │ Events & Tasks │ Guests & RSVP   │  │
│  ├───────────────┼────────────────┼─────────────────┤  │
│  │ Tables        │ Gifts & Pix    │ Finances & Supp │  │
│  ├───────────────┼────────────────┼─────────────────┤  │
│  │ Subscriptions │ SuperAdmin     │ Storage/Uploads │  │
│  └───────────────┴────────────────┴─────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Integrações Externas:                            │  │
│  │ - Stripe (Billing & Webhooks)                    │  │
│  │ - Mercado Pago (OAuth 2.0 & Payment Webhooks)    │  │
│  │ - Resend / Provedor SMTP (Envio de Convites)     │  │
│  │ - AWS S3 / Cloudflare R2 (Fotos e Galeria)       │  │
│  └──────────────────────────────────────────────────┘  │
└───────────────────────────┬────────────────────────────┘
                            │ SQL Queries / ORM (Prisma/Drizzle/TypeORM)
┌───────────────────────────▼────────────────────────────┐
│              Banco de Dados PostgreSQL Nativo          │
│   - Tabelas, Índices, Constraints, Foreign Keys        │
│   - Sem dependência de auth.users ou RLS do Supabase   │
└────────────────────────────────────────────────────────┘
```

---

## 3. Modelo de Autenticação e Autorização (RBAC)

No modelo Supabase, o sistema usava o schema interno `auth.users`, a tabela `public.profiles` e as funções `public.is_admin()` / `public.is_superadmin()`. Na API própria, a autenticação deve ser autônoma.

### 3.1 Níveis de Permissão Globais (`app_role`)
1. `superadmin`: Acesso irrestrito a toda a plataforma, painel `/superadmin`, dados de faturamento global, todos os usuários e eventos.
2. `admin` (Cerimonialista / Organizador): Cria e administra seus próprios eventos, convidados, mesas, presentes e finanças.
3. `user` (Usuário final / Cliente): Usuário com acesso limitado (ex.: anfitrião com acesso delegado).

### 3.2 Níveis de Permissão no Evento (`event_role`)
Cada evento possui múltiplos membros vinculados pela tabela `event_users`:
- `owner`: Criador do evento; tem controle total e pode deletar o evento ou gerenciar membros.
- `admin`: Pode gerenciar todas as funcionalidades do evento (convidados, mesas, presentes, configurações).
- `collaborator`: Pode visualizar e atualizar dados operacionais (ex: check-in de convidados).
- `viewer`: Apenas visualização do painel do evento.

### 3.3 Acesso Público sem Autenticação
Determinadas rotas operam via **Tokens Criptográficos Seguros (UUID v4)** ou **Slugs Públicos**:
- `/convite/:token` -> Visualização e resposta ao convite (RSVP).
- `/reconfirmar/:token` -> Segunda confirmação de presença.
- `/evento/:slug` -> Página pública de apresentação do evento.
- `/evento/:slug/presentes` -> Vitrine pública de presentes e checkout.

---

## 4. Dicionário de Dados Exaustivo (PostgreSQL)

Abaixo está o mapeamento detalhado de todas as 16 entidades que compõem o banco de dados da plataforma Eventum.

### 4.1 Enums do Sistema
```sql
CREATE TYPE app_role AS ENUM ('user', 'admin', 'superadmin');
CREATE TYPE event_role AS ENUM ('owner', 'admin', 'collaborator', 'viewer');
CREATE TYPE event_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE event_type AS ENUM ('wedding', 'birthday', 'graduation', 'party', 'corporate', 'other');
CREATE TYPE expense_status AS ENUM ('pending', 'partial', 'paid');
CREATE TYPE guest_group AS ENUM ('family', 'friends', 'work', 'other');
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'incomplete');
```

---

### 4.2 Tabela `users` (Substitui `auth.users` e unifica `profiles`)
Centraliza o cadastro dos organizadores e administradores da plataforma.

| Coluna | Tipo | Nulo? | Padrão | Descrição |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NÃO | `gen_random_uuid()` | Chave Primária |
| `email` | `VARCHAR(255)` | NÃO | - | E-mail de acesso (Único) |
| `password_hash` | `VARCHAR(255)` | NÃO | - | Hash Bcrypt/Argon2 da senha |
| `full_name` | `VARCHAR(255)` | SIM | `NULL` | Nome completo do usuário |
| `avatar_url` | `TEXT` | SIM | `NULL` | URL pública da foto de perfil |
| `stripe_customer_id` | `VARCHAR(100)` | SIM | `NULL` | ID do cliente no Stripe (`cus_...`) |
| `trial_ends_at` | `TIMESTAMPTZ` | SIM | `NULL` | Data de expiração do período de testes |
| `created_at` | `TIMESTAMPTZ` | NÃO | `NOW()` | Data de criação |
| `updated_at` | `TIMESTAMPTZ` | NÃO | `NOW()` | Data de atualização |

---

### 4.3 Tabela `user_roles`
Mapeia os papéis globais do usuário na aplicação.

| Coluna | Tipo | Nulo? | Padrão | Descrição |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NÃO | `gen_random_uuid()` | Chave Primária |
| `user_id` | `UUID` | NÃO | - | FK -> `users.id` (ON DELETE CASCADE) |
| `role` | `app_role` | NÃO | `'user'` | Papel atribuído (`admin`, `user`, `superadmin`) |
| `created_at` | `TIMESTAMPTZ` | NÃO | `NOW()` | Data de concessão do papel |
| **Constraint** | `UNIQUE(user_id, role)` | | | Impede duplicação de role |

---

### 4.4 Tabela `subscription_plans`
Catálogo de planos disponíveis para assinatura.

| Coluna | Tipo | Nulo? | Padrão | Descrição |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NÃO | `gen_random_uuid()` | Chave Primária |
| `name` | `VARCHAR(50)` | NÃO | - | Identificador único (`free`, `essentia`, `atelier`, `signature`) |
| `display_name` | `VARCHAR(100)` | NÃO | - | Nome amigável de exibição |
| `price_monthly` | `NUMERIC(10,2)`| NÃO | `0.00` | Preço da mensalidade em Reais (BRL) |
| `price_yearly` | `NUMERIC(10,2)`| NÃO | `0.00` | Preço da anuidade em Reais (BRL) |
| `stripe_price_id_monthly`| `VARCHAR(100)`| SIM | `NULL` | ID do preço mensal no Stripe (`price_...`) |
| `stripe_price_id_yearly` | `VARCHAR(100)`| SIM | `NULL` | ID do preço anual no Stripe (`price_...`) |
| `features` | `JSONB` | NÃO | `'[]'` | Lista de descrições das funcionalidades |
| `limits` | `JSONB` | NÃO | `'{}'` | Limites estruturados (`max_users`, `max_events`, etc.) |
| `platform_fee_percent` | `NUMERIC(5,2)` | NÃO | `5.00` | Taxa percentual da plataforma sobre presentes |
| `is_active` | `BOOLEAN` | NÃO | `true` | Se o plano está disponível para novas assinaturas |
| `sort_order` | `INTEGER` | NÃO | `0` | Ordem de exibição na página de preços |
| `created_at` | `TIMESTAMPTZ` | NÃO | `NOW()` | Data de cadastro |

---

### 4.5 Tabela `subscriptions`
Assinaturas ativas e histórico de cobrança dos organizadores.

| Coluna | Tipo | Nulo? | Padrão | Descrição |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NÃO | `gen_random_uuid()` | Chave Primária |
| `user_id` | `UUID` | NÃO | - | FK -> `users.id` (ON DELETE CASCADE) |
| `plan_id` | `UUID` | NÃO | - | FK -> `subscription_plans.id` |
| `stripe_customer_id` | `VARCHAR(100)` | SIM | `NULL` | ID do cliente Stripe |
| `stripe_subscription_id` | `VARCHAR(100)` | SIM | `NULL` | ID da assinatura Stripe (`sub_...`) |
| `status` | `subscription_status` | NÃO | `'trialing'` | Status atual da assinatura |
| `billing_cycle` | `VARCHAR(20)` | NÃO | `'monthly'` | Ciclo: `'monthly'` ou `'yearly'` |
| `current_period_start` | `TIMESTAMPTZ` | SIM | `NULL` | Início do período vigente de cobrança |
| `current_period_end` | `TIMESTAMPTZ` | SIM | `NULL` | Fim do período vigente de cobrança |
| `cancel_at_period_end` | `BOOLEAN` | NÃO | `false` | Se cancelará automaticamente no fim do ciclo |
| `created_at` | `TIMESTAMPTZ` | NÃO | `NOW()` | Data de criação |
| `updated_at` | `TIMESTAMPTZ` | NÃO | `NOW()` | Data da última atualização |

---

### 4.6 Tabela `feature_flags`
Configurações de liberação de funcionalidades por nível mínimo de plano.

| Coluna | Tipo | Nulo? | Padrão | Descrição |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NÃO | `gen_random_uuid()` | Chave Primária |
| `feature_key` | `VARCHAR(100)`| NÃO | - | Chave única da feature (ex: `relatorios_financeiros`) |
| `display_name`| `VARCHAR(150)`| NÃO | - | Nome amigável |
| `description` | `TEXT` | SIM | `NULL` | Detalhes do recurso |
| `min_plan` | `VARCHAR(50)` | NÃO | - | Plano mínimo exigido (`free`, `essentia`, `atelier`, `signature`) |
| `created_at` | `TIMESTAMPTZ` | NÃO | `NOW()` | Data de cadastro |

---

### 4.7 Tabela `events`
Registro principal de cada evento gerenciado.

| Coluna | Tipo | Nulo? | Padrão | Descrição |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NÃO | `gen_random_uuid()` | Chave Primária |
| `slug` | `VARCHAR(150)`| NÃO | - | URL amigável pública (Único) |
| `event_type` | `event_type` | NÃO | `'wedding'` | Tipo de celebração |
| `event_name` | `VARCHAR(255)`| NÃO | - | Nome do evento (ex: "Casamento Ana & Pedro") |
| `event_date` | `DATE` ou `TIMESTAMPTZ` | SIM | `NULL` | Data da realização |
| `event_time` | `VARCHAR(50)` | SIM | `NULL` | Horário (ex: "16:30" ou "18:00") |
| `venue_name` | `VARCHAR(255)`| SIM | `NULL` | Nome do local |
| `venue_address` | `TEXT` | SIM | `NULL` | Endereço físico completo |
| `venue_maps_link`| `TEXT` | SIM | `NULL` | Link para Google Maps / Waze |
| `hero_image_url` | `TEXT` | SIM | `NULL` | Imagem principal do cabeçalho da página pública |
| `invite_image_url`| `TEXT` | SIM | `NULL` | Imagem específica do cabeçalho do e-mail |
| `welcome_message`| `TEXT` | SIM | `NULL` | Texto de boas-vindas aos convidados |
| `gallery_images` | `TEXT[]` | SIM | `'{}'` | Lista de URLs das fotos da galeria |
| `theme_config` | `JSONB` | SIM | `'{...}'` | Cores, fontes, subtítulos e citação bíblica |
| `settings` | `JSONB` | SIM | `'{...}'` | Visibilidade de blocos (countdown, gallery, gifts, location) |
| `status` | `event_status` | NÃO | `'draft'` | Estado: `'draft'`, `'active'`, `'archived'` |
| `created_by` | `UUID` | SIM | `NULL` | FK -> `users.id` (ON DELETE SET NULL) |
| `created_at` | `TIMESTAMPTZ` | NÃO | `NOW()` | Data de criação |
| `updated_at` | `TIMESTAMPTZ` | NÃO | `NOW()` | Data da última alteração |

**Estrutura padrão de `theme_config` (JSONB):**
```json
{
  "primaryColor": "#2D5A5A",
  "secondaryColor": "#8B7355",
  "accentColor": "#C17F59",
  "backgroundColor": "#FAF8F5",
  "textColor": "#1F3D3D",
  "cardBackgroundColor": "#FFFFFF",
  "fontFamily": "Playfair Display",
  "heroSubtitle": "Celebração de Amor",
  "giftsTitle": "Lista de Presentes",
  "giftsDescription": "Sua presença é nosso maior presente! Mas se desejar nos presentear...",
  "giftsButtonText": "Ver Lista de Presentes",
  "biblicalQuote": "O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha.",
  "biblicalQuoteReference": "1 Coríntios 13:4"
}
```

**Estrutura padrão de `settings` (JSONB):**
```json
{
  "showCountdown": true,
  "showGallery": true,
  "showGifts": true,
  "showLocation": true
}
```

---

### 4.8 Tabela `event_users`
Controle de membros de equipe e permissões por evento.

| Coluna | Tipo | Nulo? | Padrão | Descrição |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NÃO | `gen_random_uuid()` | Chave Primária |
| `event_id` | `UUID` | NÃO | - | FK -> `events.id` (ON DELETE CASCADE) |
| `user_id` | `UUID` | NÃO | - | FK -> `users.id` (ON DELETE CASCADE) |
| `role` | `event_role` | NÃO | `'viewer'` | Nível de acesso: `owner`, `admin`, `collaborator`, `viewer` |
| `created_at` | `TIMESTAMPTZ` | NÃO | `NOW()` | Data de vinculação |
| **Constraint** | `UNIQUE(event_id, user_id)`| | | Impede duplicação do vínculo |

---

### 4.9 Tabela `tables`
Mesas do local para acomodação dos convidados.

| Coluna | Tipo | Nulo? | Padrão | Descrição |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NÃO | `gen_random_uuid()` | Chave Primária |
| `event_id` | `UUID` | NÃO | - | FK -> `events.id` (ON DELETE CASCADE) |
| `name` | `VARCHAR(100)`| NÃO | - | Nome/Número da mesa (ex: "Mesa 01 - Família") |
| `capacity` | `INTEGER` | SIM | `10` | Capacidade máxima de assentos |
| `description` | `TEXT` | SIM | `NULL` | Observações sobre posicionamento ou notas |
| `created_at` | `TIMESTAMPTZ` | NÃO | `NOW()` | Data de cadastro |

---

### 4.10 Tabela `guests`
Lista principal de convidados do evento.

| Coluna | Tipo | Nulo? | Padrão | Descrição |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NÃO | `gen_random_uuid()` | Chave Primária |
| `event_id` | `UUID` | NÃO | - | FK -> `events.id` (ON DELETE CASCADE) |
| `name` | `VARCHAR(255)`| NÃO | - | Nome completo do convidado principal |
| `email` | `VARCHAR(255)`| SIM | `NULL` | E-mail para recebimento do convite digital |
| `phone` | `VARCHAR(50)` | SIM | `NULL` | Telefone/WhatsApp |
| `guest_group` | `guest_group` | NÃO | `'other'` | Agrupamento (`family`, `friends`, `work`, `other`) |
| `table_id` | `UUID` | SIM | `NULL` | FK -> `tables.id` (ON DELETE SET NULL) |
| `token` | `VARCHAR(100)`| NÃO | `gen_random_uuid()` | Token único para link do convite público |
| `status` | `invite_status`| NÃO | `'pending'`| Status do RSVP (`pending`, `accepted`, `declined`) |
| `companions` | `INTEGER` | SIM | `0` | Quantidade total de acompanhantes confirmados |
| `has_viewed` | `BOOLEAN` | NÃO | `false` | Se o convidado abriu a página do convite |
| `viewed_at` | `TIMESTAMPTZ` | SIM | `NULL` | Data/hora do primeiro acesso |
| `responded_at` | `TIMESTAMPTZ` | SIM | `NULL` | Data/hora em que respondeu o RSVP |
| `notes` | `TEXT` | SIM | `NULL` | Restrições alimentares ou observações |
| `invite_email_sent_at`| `TIMESTAMPTZ` | SIM | `NULL` | Data/hora do último envio de convite por e-mail |
| `second_confirmation_sent` | `BOOLEAN` | SIM | `false` | Se foi enviado o link de 2ª confirmação |
| `second_confirmation_status` | `VARCHAR(50)` | SIM | `NULL` | Status da 2ª confirmação (`accepted`/`declined`) |
| `second_confirmation_responded_at`| `TIMESTAMPTZ` | SIM | `NULL` | Data de resposta da 2ª confirmação |
| `second_confirmation_companions` | `INTEGER` | SIM | `0` | Acompanhantes confirmados na 2ª rodada |
| `reconfirmation_token` | `VARCHAR(100)`| SIM | `NULL` | Token único para o link de 2ª confirmação |
| `created_at` | `TIMESTAMPTZ` | NÃO | `NOW()` | Data de criação |
| `updated_at` | `TIMESTAMPTZ` | NÃO | `NOW()` | Data da última alteração |

---

### 4.11 Tabela `guest_companions`
Lista nominal de acompanhantes vinculados a um convidado principal.

| Coluna | Tipo | Nulo? | Padrão | Descrição |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NÃO | `gen_random_uuid()` | Chave Primária |
| `event_id` | `UUID` | NÃO | - | FK -> `events.id` (ON DELETE CASCADE) |
| `guest_id` | `UUID` | NÃO | - | FK -> `guests.id` (ON DELETE CASCADE) |
| `name` | `VARCHAR(255)`| NÃO | - | Nome completo do acompanhante |
| `will_attend` | `BOOLEAN` | SIM | `NULL` | Presença confirmada: `true`, `false` ou `NULL` (pendente) |
| `created_at` | `TIMESTAMPTZ` | NÃO | `NOW()` | Data de criação |

---

### 4.12 Tabela `gifts`
Itens da lista de presentes virtuais.

| Coluna | Tipo | Nulo? | Padrão | Descrição |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NÃO | `gen_random_uuid()` | Chave Primária |
| `event_id` | `UUID` | NÃO | - | FK -> `events.id` (ON DELETE CASCADE) |
| `name` | `VARCHAR(255)`| NÃO | - | Título do presente (ex: "Jantar Romântico") |
| `description` | `TEXT` | SIM | `NULL` | Detalhes do item |
| `value` | `NUMERIC(10,2)`| NÃO | - | Valor monetário em Reais |
| `image_url` | `TEXT` | SIM | `NULL` | Imagem ilustrativa |
| `status` | `VARCHAR(50)` | NÃO | `'available'` | `'available'`, `'reserved'`, `'received'` |
| `is_flexible_value`| `BOOLEAN` | NÃO | `false` | Se permite ao convidado doar qualquer valor |
| `min_value` | `NUMERIC(10,2)`| SIM | `NULL` | Valor mínimo em caso de valor flexível |
| `reserved_at` | `TIMESTAMPTZ` | SIM | `NULL` | Data/hora em que foi temporariamente reservado |
| `created_at` | `TIMESTAMPTZ` | NÃO | `NOW()` | Data de criação |
| `updated_at` | `TIMESTAMPTZ` | NÃO | `NOW()` | Data de atualização |

---

### 4.13 Tabela `gift_payments`
Registros de presentes presenteados e transações financeiras.

| Coluna | Tipo | Nulo? | Padrão | Descrição |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NÃO | `gen_random_uuid()` | Chave Primária |
| `gift_id` | `UUID` | NÃO | - | FK -> `gifts.id` (ON DELETE CASCADE) |
| `event_id` | `UUID` | SIM | `NULL` | FK -> `events.id` (ON DELETE CASCADE) |
| `guest_name` | `VARCHAR(255)`| SIM | `NULL` | Nome de quem presenteou |
| `message` | `TEXT` | SIM | `NULL` | Mensagem de carinho aos anfitriões |
| `status` | `VARCHAR(50)` | NÃO | `'pending'` | `'pending'`, `'confirmed'` |
| `confirmed_at` | `TIMESTAMPTZ` | SIM | `NULL` | Data de aprovação do pagamento |
| `created_at` | `TIMESTAMPTZ` | NÃO | `NOW()` | Data do registro |

---

### 4.14 Tabela `pix_config`
Configuração de recebimento direto via PIX.

| Coluna | Tipo | Nulo? | Padrão | Descrição |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NÃO | `gen_random_uuid()` | Chave Primária |
| `event_id` | `UUID` | NÃO | - | FK -> `events.id` (ON DELETE CASCADE, 1:1) |
| `pix_key` | `VARCHAR(255)`| SIM | `NULL` | Chave PIX (CPF, CNPJ, E-mail, Telefone, EVP) |
| `recipient_name`| `VARCHAR(255)`| SIM | `NULL` | Nome do titular da conta |
| `qr_code_url` | `TEXT` | SIM | `NULL` | Imagem do QR Code estático gerado |
| `created_at` | `TIMESTAMPTZ` | NÃO | `NOW()` | Data de criação |
| `updated_at` | `TIMESTAMPTZ` | NÃO | `NOW()` | Data de atualização |

---

### 4.15 Tabela `mercadopago_connections`
Tokens OAuth criptografados para transações com a conta Mercado Pago do organizador.

| Coluna | Tipo | Nulo? | Padrão | Descrição |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NÃO | `gen_random_uuid()` | Chave Primária |
| `event_id` | `UUID` | NÃO | - | FK -> `events.id` (ON DELETE CASCADE, Único 1:1) |
| `mp_user_id` | `VARCHAR(100)`| NÃO | - | User ID no Mercado Pago |
| `mp_email` | `VARCHAR(255)`| SIM | `NULL` | E-mail da conta Mercado Pago conectada |
| `mp_public_key` | `TEXT` | SIM | `NULL` | Public Key da conta conectada |
| `access_token_encrypted` | `TEXT` | NÃO | - | Token de acesso criptografado em repouso |
| `refresh_token_encrypted`| `TEXT` | NÃO | - | Refresh Token criptografado em repouso |
| `token_expires_at` | `TIMESTAMPTZ` | NÃO | - | Timestamp de expiração do access token |
| `connected_at` | `TIMESTAMPTZ` | SIM | `NOW()` | Data da primeira conexão |
| `updated_at` | `TIMESTAMPTZ` | SIM | `NOW()` | Data da última renovação |

---

### 4.16 Tabela `expense_categories`
Categorias do controle orçamentário.

| Coluna | Tipo | Nulo? | Padrão | Descrição |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NÃO | `gen_random_uuid()` | Chave Primária |
| `event_id` | `UUID` | NÃO | - | FK -> `events.id` (ON DELETE CASCADE) |
| `name` | `VARCHAR(100)`| NÃO | - | Nome da categoria (ex: "Buffet", "Decoração") |
| `color` | `VARCHAR(30)` | NÃO | `'#6B7280'` | Código hexadecimal para gráficos |
| `icon` | `VARCHAR(50)` | SIM | `NULL` | Nome do ícone Lucide |
| `created_at` | `TIMESTAMPTZ` | NÃO | `NOW()` | Data de criação |

---

### 4.17 Tabela `expenses`
Lançamentos de despesas e custos do evento.

| Coluna | Tipo | Nulo? | Padrão | Descrição |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NÃO | `gen_random_uuid()` | Chave Primária |
| `event_id` | `UUID` | NÃO | - | FK -> `events.id` (ON DELETE CASCADE) |
| `category_id` | `UUID` | SIM | `NULL` | FK -> `expense_categories.id` (ON DELETE SET NULL) |
| `description` | `VARCHAR(255)`| NÃO | - | Descrição da despesa |
| `amount` | `NUMERIC(12,2)`| NÃO | `0.00` | Valor orçado / contratado |
| `paid_amount` | `NUMERIC(12,2)`| NÃO | `0.00` | Valor efetivamente pago até o momento |
| `status` | `expense_status`| NÃO | `'pending'`| `'pending'`, `'partial'`, `'paid'` |
| `due_date` | `DATE` | SIM | `NULL` | Data de vencimento |
| `paid_at` | `TIMESTAMPTZ` | SIM | `NULL` | Data da quitação total |
| `vendor_name` | `VARCHAR(255)`| SIM | `NULL` | Nome do fornecedor associado |
| `notes` | `TEXT` | SIM | `NULL` | Observações e comprovantes |
| `created_at` | `TIMESTAMPTZ` | NÃO | `NOW()` | Data de criação |
| `updated_at` | `TIMESTAMPTZ` | NÃO | `NOW()` | Data de atualização |

---

### 4.18 Tabela `suppliers`
Contatos e contratos de fornecedores de serviços.

| Coluna | Tipo | Nulo? | Padrão | Descrição |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NÃO | `gen_random_uuid()` | Chave Primária |
| `event_id` | `UUID` | NÃO | - | FK -> `events.id` (ON DELETE CASCADE) |
| `name` | `VARCHAR(255)`| NÃO | - | Razão Social ou Nome Fantasia |
| `category` | `VARCHAR(100)`| SIM | `NULL` | Categoria de serviço |
| `contact_name`| `VARCHAR(255)`| SIM | `NULL` | Pessoa de contato |
| `phone` | `VARCHAR(50)` | SIM | `NULL` | Telefone de contato |
| `email` | `VARCHAR(255)`| SIM | `NULL` | E-mail comercial |
| `website` | `TEXT` | SIM | `NULL` | Site oficial |
| `instagram` | `VARCHAR(100)`| SIM | `NULL` | Perfil do Instagram |
| `address` | `TEXT` | SIM | `NULL` | Endereço físico |
| `notes` | `TEXT` | SIM | `NULL` | Anotações adicionais |
| `contracted` | `BOOLEAN` | SIM | `false` | Se o contrato foi assinado |
| `contract_value`| `NUMERIC(12,2)`| SIM | `NULL` | Valor total do contrato |
| `paid_amount` | `NUMERIC(12,2)`| SIM | `0.00` | Valor pago |
| `created_at` | `TIMESTAMPTZ` | NÃO | `NOW()` | Data de criação |
| `updated_at` | `TIMESTAMPTZ` | NÃO | `NOW()` | Data de atualização |

---

### 4.19 Tabela `invite_emails`
Log e auditoria de envio de convites digitais via e-mail.

| Coluna | Tipo | Nulo? | Padrão | Descrição |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NÃO | `gen_random_uuid()` | Chave Primária |
| `event_id` | `UUID` | NÃO | - | FK -> `events.id` (ON DELETE CASCADE) |
| `guest_id` | `UUID` | NÃO | - | FK -> `guests.id` (ON DELETE CASCADE) |
| `status` | `VARCHAR(50)` | NÃO | - | `'sent'`, `'failed'`, `'delivered'` |
| `resend_id` | `VARCHAR(100)`| SIM | `NULL` | ID retornado pelo serviço de envio (Resend) |
| `error_message`| `TEXT` | SIM | `NULL` | Mensagem de erro caso tenha falhado |
| `sent_at` | `TIMESTAMPTZ` | NÃO | `NOW()` | Timestamp de disparo |
| `created_at` | `TIMESTAMPTZ` | NÃO | `NOW()` | Data de criação |

---

## 5. Script DDL Completo em PostgreSQL (Pronto para Execução)

```sql
-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CRIAÇÃO DE ENUMS
CREATE TYPE app_role AS ENUM ('user', 'admin', 'superadmin');
CREATE TYPE event_role AS ENUM ('owner', 'admin', 'collaborator', 'viewer');
CREATE TYPE event_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE event_type AS ENUM ('wedding', 'birthday', 'graduation', 'party', 'corporate', 'other');
CREATE TYPE expense_status AS ENUM ('pending', 'partial', 'paid');
CREATE TYPE guest_group AS ENUM ('family', 'friends', 'work', 'other');
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'incomplete');

-- 2. TABELA USERS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  stripe_customer_id VARCHAR(100),
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABELA USER_ROLES
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);

-- 4. TABELA SUBSCRIPTION_PLANS
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_yearly NUMERIC(10,2) NOT NULL DEFAULT 0,
  stripe_price_id_monthly VARCHAR(100),
  stripe_price_id_yearly VARCHAR(100),
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  platform_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABELA SUBSCRIPTIONS
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  stripe_customer_id VARCHAR(100),
  stripe_subscription_id VARCHAR(100),
  status subscription_status NOT NULL DEFAULT 'trialing',
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- 6. TABELA FEATURE_FLAGS
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(150) NOT NULL,
  description TEXT,
  min_plan VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABELA EVENTS
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(150) NOT NULL UNIQUE,
  event_type event_type NOT NULL DEFAULT 'wedding',
  event_name VARCHAR(255) NOT NULL,
  event_date DATE,
  event_time VARCHAR(50),
  venue_name VARCHAR(255),
  venue_address TEXT,
  venue_maps_link TEXT,
  hero_image_url TEXT,
  invite_image_url TEXT,
  welcome_message TEXT DEFAULT 'Estamos muito felizes em compartilhar este momento especial com você!',
  gallery_images TEXT[] DEFAULT '{}',
  theme_config JSONB DEFAULT '{"primaryColor": "#2D5A5A", "secondaryColor": "#8B7355", "accentColor": "#C17F59", "backgroundColor": "#FAF8F5", "textColor": "#1F3D3D", "cardBackgroundColor": "#FFFFFF", "fontFamily": "Playfair Display"}'::jsonb,
  settings JSONB DEFAULT '{"showCountdown": true, "showGallery": true, "showGifts": true, "showLocation": true}'::jsonb,
  status event_status NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_status ON events(status);

-- 8. TABELA EVENT_USERS
CREATE TABLE event_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role event_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);
CREATE INDEX idx_event_users_event ON event_users(event_id);
CREATE INDEX idx_event_users_user ON event_users(user_id);

-- 9. TABELA TABLES (MESAS)
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  capacity INTEGER DEFAULT 10,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tables_event ON tables(event_id);

-- 10. TABELA GUESTS
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  guest_group guest_group NOT NULL DEFAULT 'other',
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  token VARCHAR(100) NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  status invite_status NOT NULL DEFAULT 'pending',
  companions INTEGER DEFAULT 0,
  has_viewed BOOLEAN NOT NULL DEFAULT false,
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  notes TEXT,
  invite_email_sent_at TIMESTAMPTZ,
  second_confirmation_sent BOOLEAN DEFAULT false,
  second_confirmation_status VARCHAR(50),
  second_confirmation_responded_at TIMESTAMPTZ,
  second_confirmation_companions INTEGER DEFAULT 0,
  reconfirmation_token VARCHAR(100) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_guests_event ON guests(event_id);
CREATE INDEX idx_guests_token ON guests(token);
CREATE INDEX idx_guests_reconfirmation_token ON guests(reconfirmation_token);
CREATE INDEX idx_guests_status ON guests(status);
CREATE INDEX idx_guests_table ON guests(table_id);

-- 11. TABELA GUEST_COMPANIONS
CREATE TABLE guest_companions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  will_attend BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_companions_guest ON guest_companions(guest_id);
CREATE INDEX idx_companions_event ON guest_companions(event_id);

-- 12. TABELA GIFTS
CREATE TABLE gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  value NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'available',
  is_flexible_value BOOLEAN NOT NULL DEFAULT false,
  min_value NUMERIC(10,2),
  reserved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_gifts_event ON gifts(event_id);
CREATE INDEX idx_gifts_status ON gifts(status);

-- 13. TABELA GIFT_PAYMENTS
CREATE TABLE gift_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_id UUID NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  guest_name VARCHAR(255),
  message TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_gift_payments_event ON gift_payments(event_id);
CREATE INDEX idx_gift_payments_gift ON gift_payments(gift_id);

-- 14. TABELA PIX_CONFIG
CREATE TABLE pix_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
  pix_key VARCHAR(255),
  recipient_name VARCHAR(255),
  qr_code_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. TABELA MERCADOPAGO_CONNECTIONS
CREATE TABLE mercadopago_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
  mp_user_id VARCHAR(100) NOT NULL,
  mp_email VARCHAR(255),
  mp_public_key TEXT,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. TABELA EXPENSE_CATEGORIES
CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(30) NOT NULL DEFAULT '#6B7280',
  icon VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_expense_categories_event ON expense_categories(event_id);

-- 17. TABELA EXPENSES
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  description VARCHAR(255) NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status expense_status NOT NULL DEFAULT 'pending',
  due_date DATE,
  paid_at TIMESTAMPTZ,
  vendor_name VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_expenses_event ON expenses(event_id);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_status ON expenses(status);

-- 18. TABELA SUPPLIERS
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  contact_name VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  website TEXT,
  instagram VARCHAR(100),
  address TEXT,
  notes TEXT,
  contracted BOOLEAN DEFAULT false,
  contract_value NUMERIC(12,2),
  paid_amount NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_suppliers_event ON suppliers(event_id);

-- 19. TABELA INVITE_EMAILS
CREATE TABLE invite_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  resend_id VARCHAR(100),
  error_message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_invite_emails_guest ON invite_emails(guest_id);
CREATE INDEX idx_invite_emails_event ON invite_emails(event_id);

-- 20. SEED DE PLANOS INICIAIS
INSERT INTO subscription_plans (name, display_name, price_monthly, price_yearly, features, limits, sort_order, platform_fee_percent, is_active) VALUES
('free', 'Gratuito', 0, 0,
  '["Página do evento básica", "RSVP simples"]'::jsonb,
  '{"max_users": 1, "has_advanced_reports": false, "allow_data_export": false}'::jsonb,
  0, 10.0, true),
('essentia', 'Essentia', 147, 1470,
  '["Gestão ilimitada de eventos", "Checklist e cronograma avançado", "Lista de Convidados e RSVP", "Gestão de Mesas", "Gestão de Fornecedores", "Lista de Presentes Virtuais", "Integração com PIX e Mercado Pago", "Personalização Visual da Área do Cliente", "Suporte Padrão"]'::jsonb,
  '{"max_users": 1, "has_advanced_reports": false, "allow_data_export": false}'::jsonb,
  1, 5.0, true),
('atelier', 'Atelier', 297, 2970,
  '["Tudo do plano Essentia", "Até 5 Usuários", "Exportação de Dados (CSV/Excel)", "Relatórios Financeiros Avançados", "Prioridade no Suporte"]'::jsonb,
  '{"max_users": 5, "has_advanced_reports": true, "allow_data_export": true}'::jsonb,
  2, 3.0, true),
('signature', 'Signature', 597, 5970,
  '["Tudo do plano Atelier", "Usuários Ilimitados", "Criação de Subcontas para Clientes", "Onboarding Personalizado e Consultoria", "Suporte Dedicado", "Domínio Personalizado", "Acesso à API"]'::jsonb,
  '{"max_users": -1, "has_advanced_reports": true, "allow_data_export": true, "custom_domain": true, "api_access": true, "sub_accounts": true}'::jsonb,
  3, 1.5, true);
```

---

## 6. Mapeamento de Todas as Funcionalidades e Regras de Negócio

### 6.1 Módulo: Gestão de Eventos
- **Criação de Eventos:**
  - O usuário autenticado informa nome, tipo (`wedding`, `birthday`, etc.), data e endereço.
  - O sistema gera um slug normalizado e sanitizado: `[nome-do-evento]-[timestamp36]`.
  - Ao criar, é registrado o registro em `events` e inserido o registro em `event_users` com `role = 'owner'`.
  - O evento começa com status `'draft'`.
- **Alternador de Eventos (`EventSwitcher`):**
  - O organizador pode pertencer a vários eventos e alternar o contexto ativo no topo do painel.
- **Configuração de Tema e Identidade Visual:**
  - Cores: Primária, secundária, acento, background, texto, card background.
  - Tipografia: Suporte a Playfair Display, Montserrat, Roboto, Lora, Dancing Script, Great Vibes.
  - Hero image, imagem de convite de e-mail e galeria com múltiplas imagens.
  - Frases personalizadas de abertura e citação bíblica configurável.
- **Status do Evento:**
  - `draft`: Apenas visível para membros no painel administrativo.
  - `active`: Página pública `/evento/:slug` ativa, convidados podem ver e responder.
  - `archived`: Congelado para novas alterações e respostas, apenas consulta.

### 6.2 Módulo: Gestão de Convidados e RSVP Digital
- **Cadastro Individual ou Importação:**
  - Nome, e-mail, telefone, grupo (`family`, `friends`, `work`, `other`), mesa atribuída e notas.
  - Acompanhantes podem ser cadastrados nominalmente em `guest_companions`.
- **Token de Acesso Seguro:**
  - Ao criar o convidado, um UUID único (`token`) é gerado.
  - O link `/convite/:token` permite ao convidado abrir seu convite sem necessidade de login e senha.
  - No primeiro acesso, a flag `has_viewed` muda para `true` e `viewed_at` recebe o timestamp atual.
- **Fluxo de Confirmação (RSVP):**
  - O convidado marca se comparecerá (`accepted`) ou não (`declined`).
  - Caso possua acompanhantes cadastrados, ele pode marcar individualmente quais irão (`will_attend: true/false`).
  - O número de `companions` do convidado principal é atualizado para refletir o número exato de acompanhantes confirmados.
  - Atualiza `responded_at = NOW()`.
- **Métricas do Dashboard:**
  - `total`: Convidado principal + acompanhantes.
  - `accepted`: Total de confirmados (convidados + acompanhantes).
  - `declined`: Total de recusados.
  - `pending`: Pendentes de resposta.
  - `viewed`: Convites que foram visualizados mas ainda não respondidos.

### 6.3 Módulo: Segunda Confirmação (Reconfirmação)
- **Objetivo:** Garantir a precisão da lista dias antes do evento, recalculando buffet e assentos.
- **Disparo:**
  - Individual ou em lote (`send_second_confirmation_to_all`) para convidados com status `accepted`.
  - Gera um `reconfirmation_token` exclusivo para cada convidado e marca `second_confirmation_sent = true`.
- **Resposta:**
  - Acessada via `/reconfirmar/:token`.
  - Permite alterar o status para `accepted` ou `declined`, e ajustar os acompanhantes que de fato estarão presentes.
  - Grava `second_confirmation_status`, `second_confirmation_responded_at` e `second_confirmation_companions`.

### 6.4 Módulo: Gestão de Mesas
- **Organização Visual:**
  - Criação de mesas com nome e capacidade limite (ex: 8 a 12 pessoas).
  - Atribuição de convidados a mesas (`guests.table_id`).
  - Tela com visão das mesas e lista de convidados sem mesa alocada.
  - Cálculo de lotação: soma de convidados confirmados alocados na mesa vs. capacidade máxima.

### 6.5 Módulo: Lista de Presentes Virtuais e Pagamentos
- **Itens de Presente:**
  - Cadastro com título, descrição, valor e imagem ilustrativa.
  - Modalidade de valor fixo ou valor flexível com valor mínimo (`min_value`).
- **Fluxo de Reserva:**
  - Ao clicar em presentear, o item pode ser reservado temporariamente (`reserved`) para evitar compras concorrentes.
- **Recebimento via PIX Direto:**
  - O cerimonialista cadastra chave PIX, nome do titular e imagem do QR Code.
  - O convidado visualiza a chave e o QR Code, efetua a transferência no app do banco e envia o comprovante com seu nome e mensagem de felicitação.
  - O organizador aprova o pagamento manualmente no painel (`/admin/payments`), alterando o status para `confirmed` e o presente para `received`.
- **Recebimento via Mercado Pago (OAuth Integrado):**
  - O organizador clica em "Conectar Mercado Pago".
  - O backend inicia o fluxo OAuth 2.0 direcionando para `https://auth.mercadopago.com.br/authorization`.
  - No retorno do callback, o backend troca o `code` pelo `access_token` e `refresh_token`, criptografa-os e armazena na tabela `mercadopago_connections`.
  - Para cada presente comprado, a API gera uma Checkout Preference no Mercado Pago contendo metadata com `gift_id`, `event_id`, nome do convidado e mensagem.
  - O convidado pode pagar via PIX, Cartão de Crédito ou Boleto.
  - O webhook do Mercado Pago valida a assinatura HMAC-SHA256 e, quando `payment.status == 'approved'`, atualiza o presente para `received` e cria o registro em `gift_payments` com `status = 'confirmed'`.

### 6.6 Módulo: Gestão Financeira e Fornecedores
- **Categorias Orçamentárias:**
  - Personalizáveis com cor para gráficos e ícone.
- **Despesas:**
  - Lançamento com valor previsto (`amount`), valor pago (`paid_amount`), status (`pending`, `partial`, `paid`) e vencimento.
- **Fornecedores:**
  - Cadastro completo, categorização, status de contrato assinado, valor contratado e valor quitado.
- **Cálculo de Balanço do Evento:**
  - `Total Orçado`: Soma de todas as despesas previstas.
  - `Total Pago`: Soma de todos os pagamentos já realizados.
  - `Total a Pagar`: `Total Orçado - Total Pago`.
  - `Arrecadação em Presentes`: Soma de todos os pagamentos confirmados na lista de presentes.
  - `Balanço Geral`: `Arrecadação de Presentes - Total Orçado`.

### 6.7 Módulo: Assinaturas e Planos (Stripe)
- **Estrutura dos Planos:**
  - `Essentia` (R$ 147/mês ou R$ 1.470/ano): Eventos ilimitados, RSVP, mesas, presentes, 1 usuário.
  - `Atelier` (R$ 297/mês ou R$ 2.970/ano): Até 5 usuários, relatórios financeiros avançados, exportação CSV/Excel, suporte prioritário.
  - `Signature` (R$ 597/mês ou R$ 5.970/ano): Usuários ilimitados, subcontas, consultoria, suporte dedicado, domínio próprio, API.
- **Checkout e Portal Stripe:**
  - Integração via Stripe Checkout Sessions (modo subscription).
  - Stripe Customer Portal para gerenciamento de cartão, troca de ciclo ou cancelamento.
  - Webhooks Stripe para escutar `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`.

---

## 7. Especificação da API RESTful (Endpoints Completos)

Todas as rotas autenticadas exigem o cabeçalho:
`Authorization: Bearer <JWT_ACCESS_TOKEN>`

### 7.1 Autenticação e Perfil (`/api/v1/auth`)

#### 1. Registrar Novo Usuário
- **Endpoint:** `POST /api/v1/auth/register`
- **Acesso:** Público
- **Request Body:**
```json
{
  "email": "organizador@exemplo.com",
  "password": "SenhaSegura@123",
  "full_name": "Mariana Cerimonialista"
}
```
- **Response (201 Created):**
```json
{
  "user": {
    "id": "c1f7a4e2-8d9e-4b6a-9123-abcdef123456",
    "email": "organizador@exemplo.com",
    "full_name": "Mariana Cerimonialista",
    "roles": ["admin"]
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### 2. Efetuar Login
- **Endpoint:** `POST /api/v1/auth/login`
- **Acesso:** Público
- **Request Body:**
```json
{
  "email": "organizador@exemplo.com",
  "password": "SenhaSegura@123"
}
```
- **Response (200 OK):**
```json
{
  "user": {
    "id": "c1f7a4e2-8d9e-4b6a-9123-abcdef123456",
    "email": "organizador@exemplo.com",
    "full_name": "Mariana Cerimonialista",
    "avatar_url": "https://storage.eventum.com.br/avatars/user-id.jpg",
    "roles": ["admin"]
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### 3. Obter Dados do Usuário Atual
- **Endpoint:** `GET /api/v1/auth/me`
- **Acesso:** Autenticado
- **Response (200 OK):**
```json
{
  "id": "c1f7a4e2-8d9e-4b6a-9123-abcdef123456",
  "email": "organizador@exemplo.com",
  "full_name": "Mariana Cerimonialista",
  "avatar_url": null,
  "roles": ["admin"],
  "subscription": {
    "plan": "atelier",
    "status": "active",
    "current_period_end": "2026-10-22T00:00:00Z"
  }
}
```

#### 4. Atualizar Perfil e Senha
- **Endpoint:** `PUT /api/v1/auth/profile`
- **Acesso:** Autenticado
- **Request Body:**
```json
{
  "full_name": "Mariana Silva Cerimonial",
  "email": "novoemail@exemplo.com",
  "current_password": "SenhaAntiga@123",
  "new_password": "NovaSenha@123"
}
```

---

### 7.2 Gestão de Eventos (`/api/v1/events`)

#### 1. Listar Eventos do Usuário
- **Endpoint:** `GET /api/v1/events`
- **Acesso:** Autenticado
- **Response (200 OK):** Lista de eventos onde o usuário participa via `event_users`.

#### 2. Criar Novo Evento
- **Endpoint:** `POST /api/v1/events`
- **Acesso:** Autenticado (Role `admin` ou `superadmin`)
- **Request Body:**
```json
{
  "event_name": "Casamento Mariana & Rodrigo",
  "event_type": "wedding",
  "event_date": "2026-11-14",
  "event_time": "17:00",
  "venue_name": "Villa Vérico",
  "venue_address": "Rua Santa Justina, 329 - Vila Olímpia, São Paulo - SP"
}
```
- **Regra:** Gera slug automaticamente, cria evento e insere o usuário como `owner` na tabela `event_users`.

#### 3. Obter Detalhes do Evento
- **Endpoint:** `GET /api/v1/events/:id`
- **Acesso:** Autenticado (Membro do evento)