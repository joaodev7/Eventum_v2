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

#### 4. Atualizar Dados e Configurações do Evento
- **Endpoint:** `PUT /api/v1/events/:id`
- **Acesso:** Autenticado (Role `owner` ou `admin` no evento)
- **Request Body:**
```json
{
  "event_name": "Casamento Mariana & Rodrigo",
  "event_date": "2026-11-14",
  "event_time": "17:00",
  "venue_name": "Villa Vérico",
  "venue_address": "Rua Santa Justina, 329",
  "venue_maps_link": "https://maps.google.com/?q=Villa+Verico",
  "welcome_message": "Estamos ansiosos para celebrar este momento único com vocês!",
  "hero_image_url": "https://storage.eventum.com.br/wedding-images/hero.jpg",
  "invite_image_url": "https://storage.eventum.com.br/wedding-images/email.jpg",
  "gallery_images": [
    "https://storage.eventum.com.br/wedding-images/foto1.jpg",
    "https://storage.eventum.com.br/wedding-images/foto2.jpg"
  ],
  "theme_config": {
    "primaryColor": "#2D5A5A",
    "secondaryColor": "#8B7355",
    "accentColor": "#C17F59",
    "fontFamily": "Playfair Display"
  },
  "settings": {
    "showCountdown": true,
    "showGallery": true,
    "showGifts": true,
    "showLocation": true
  },
  "status": "active"
}
```

#### 5. Excluir Evento
- **Endpoint:** `DELETE /api/v1/events/:id`
- **Acesso:** Autenticado (`owner` do evento ou `superadmin`)

#### 6. Membros do Evento
- `GET /api/v1/events/:id/users` -> Lista membros.
- `POST /api/v1/events/:id/users` -> Convida membro (`user_id`, `role`).
- `DELETE /api/v1/events/:id/users/:userId` -> Remove membro.

---

### 7.3 Convidados e RSVP (`/api/v1/events/:eventId/guests`)

#### 1. Listar Convidados com Filtros
- **Endpoint:** `GET /api/v1/events/:eventId/guests`
- **Query Params:** `status=accepted|pending|declined`, `group=family|friends|work|other`, `search=nome`
- **Response (200 OK):** Array de convidados com dados da mesa e contagem de acompanhantes.

#### 2. Obter Métricas de Convidados do Evento
- **Endpoint:** `GET /api/v1/events/:eventId/guests/metrics`
- **Response (200 OK):**
```json
{
  "total": 180,
  "totalGuests": 100,
  "totalCompanions": 80,
  "accepted": 120,
  "acceptedGuests": 70,
  "acceptedCompanions": 50,
  "declined": 15,
  "declinedGuests": 10,
  "declinedCompanions": 5,
  "pending": 45,
  "pendingGuests": 20,
  "pendingCompanions": 25,
  "viewed": 18,
  "viewedGuests": 10,
  "viewedCompanions": 8
}
```

#### 3. Criar Convidado
- **Endpoint:** `POST /api/v1/events/:eventId/guests`
- **Request Body:**
```json
{
  "name": "Carlos Eduardo",
  "email": "carlos@exemplo.com",
  "phone": "(11) 98888-7777",
  "guest_group": "family",
  "table_id": "8c59367d-dbe1-4091-bfda-d90a6e5b0b6e",
  "notes": "Vegetariano",
  "companions": [
    { "name": "Juliana Santos" },
    { "name": "Lucas Santos" }
  ]
}
```

#### 4. Atualizar Convidado
- **Endpoint:** `PUT /api/v1/events/:eventId/guests/:id`

#### 5. Excluir Convidado
- **Endpoint:** `DELETE /api/v1/events/:eventId/guests/:id`

#### 6. Regenerar Token de Convite
- **Endpoint:** `POST /api/v1/events/:eventId/guests/:id/regenerate-token`

#### 7. Enviar Convite por E-mail (Disparo Resend)
- **Endpoint:** `POST /api/v1/events/:eventId/guests/send-emails`
- **Request Body:**
```json
{
  "guest_ids": ["uuid-1", "uuid-2"]
}
```
- **Ação:** O backend renderiza o template HTML do convite, envia via provedor de e-mail (Resend/SMTP), registra os logs na tabela `invite_emails` e atualiza `invite_email_sent_at`.

#### 8. Disparar Segunda Confirmação
- **Endpoint:** `POST /api/v1/events/:eventId/guests/send-second-confirmation`
- **Request Body:**
```json
{
  "all": true,
  "guest_id": null
}
```

---

### 7.4 Rotas Públicas do Convidado (Sem Autenticação)

#### 1. Buscar Convite por Token
- **Endpoint:** `GET /api/v1/public/invite/:token`
- **Ação:**
  1. Busca o convidado pelo `token`.
  2. Se `has_viewed` for `false`, atualiza para `true` e preenche `viewed_at = NOW()`.
  3. Retorna dados do convidado, acompanhantes cadastrados e informações básicas do evento (nome, data, local, cores do tema).
- **Response (200 OK):**
```json
{
  "guest": {
    "id": "uuid",
    "name": "Carlos Eduardo",
    "status": "pending",
    "companions": 2,
    "table": { "id": "uuid", "name": "Mesa 01", "capacity": 10 },
    "companions_list": [
      { "id": "uuid-c1", "name": "Juliana Santos", "will_attend": null },
      { "id": "uuid-c2", "name": "Lucas Santos", "will_attend": null }
    ]
  },
  "event": {
    "id": "uuid",
    "event_name": "Casamento Mariana & Rodrigo",
    "event_date": "2026-11-14",
    "event_time": "17:00",
    "venue_name": "Villa Vérico",
    "venue_address": "Rua Santa Justina, 329",
    "venue_maps_link": "https://maps.google.com/...",
    "hero_image_url": "https://...",
    "welcome_message": "...",
    "theme_config": { ... }
  }
}
```

#### 2. Responder ao Convite (RSVP)
- **Endpoint:** `POST /api/v1/public/invite/:token/respond`
- **Request Body:**
```json
{
  "status": "accepted",
  "companion_ids": ["uuid-c1"]
}
```
- **Ação:** Marca o convidado com `status = 'accepted'`, define os acompanhantes selecionados como `will_attend = true` e os não selecionados como `will_attend = false`, e grava `responded_at = NOW()`.

#### 3. Buscar e Responder Segunda Confirmação
- `GET /api/v1/public/reconfirmation/:token` -> Dados do convidado elegível.
- `POST /api/v1/public/reconfirmation/:token/respond` -> Resposta (`status`, `companion_ids`).

#### 4. Visualizar Evento Público pelo Slug
- **Endpoint:** `GET /api/v1/public/events/:slug`
- **Response (200 OK):** Detalhes completos da página pública do evento ativo (sem expor dados sensíveis).

#### 5. Visualizar Lista de Presentes Pública do Evento
- **Endpoint:** `GET /api/v1/public/events/:slug/gifts`
- **Response (200 OK):** Lista de itens disponíveis e dados do PIX (se ativo).

---

### 7.5 Mesas (`/api/v1/events/:eventId/tables`)
- `GET /api/v1/events/:eventId/tables` -> Listar mesas.
- `GET /api/v1/events/:eventId/tables/with-guests` -> Listar mesas com o array de convidados alocados em cada uma.
- `POST /api/v1/events/:eventId/tables` -> Criar mesa (`name`, `capacity`, `description`).
- `PUT /api/v1/events/:eventId/tables/:id` -> Atualizar mesa.
- `DELETE /api/v1/events/:eventId/tables/:id` -> Excluir mesa (convidados têm `table_id` definido para `NULL`).

---

### 7.6 Presentes, PIX e Mercado Pago (`/api/v1/events/:eventId/gifts`)

#### 1. CRUD de Presentes
- `GET /api/v1/events/:eventId/gifts` -> Lista todos os presentes.
- `POST /api/v1/events/:eventId/gifts` -> Cria item de presente.
- `PUT /api/v1/events/:eventId/gifts/:id` -> Edita item de presente.
- `DELETE /api/v1/events/:eventId/gifts/:id` -> Exclui item de presente.

#### 2. Reserva de Presente
- **Endpoint:** `POST /api/v1/public/gifts/:giftId/reserve`
- **Ação:** Atualiza status para `reserved` e `reserved_at = NOW()`.

#### 3. Configuração de PIX
- `GET /api/v1/events/:eventId/pix` -> Retorna chave e QR code.
- `PUT /api/v1/events/:eventId/pix` -> Salva chave, titular e URL do QR Code.

#### 4. Registro Manual de Pagamento de Presente (PIX)
- **Endpoint:** `POST /api/v1/public/gifts/:giftId/pay-pix`
- **Request Body:**
```json
{
  "guest_name": "Tia Laura",
  "message": "Parabéns aos noivos! Com muito carinho.",
  "event_id": "uuid-evento"
}
```

#### 5. Aprovação de Pagamento pelo Cerimonialista
- **Endpoint:** `POST /api/v1/events/:eventId/gift-payments/:paymentId/approve`
- **Ação:** Altera `gift_payments.status = 'confirmed'` e `gifts.status = 'received'`.

#### 6. Mercado Pago OAuth e Transações
- `GET /api/v1/events/:eventId/mercadopago/status` -> Verifica se a conta está conectada e retorna o e-mail conectado.
- `GET /api/v1/events/:eventId/mercadopago/oauth-start` -> Retorna a URL para redirecionamento ao Mercado Pago com `state` seguro.
- `POST /api/v1/events/:eventId/mercadopago/oauth-callback` -> Recebe `code` e `state`, troca pelos tokens na API do Mercado Pago e armazena criptografado.
- `POST /api/v1/events/:eventId/mercadopago/disconnect` -> Revoga e remove tokens do banco.
- `POST /api/v1/public/events/:eventId/mercadopago/create-payment` -> Cria Preference de Checkout no Mercado Pago usando o token do organizador:
```json
{
  "giftId": "uuid-gift",
  "giftName": "Fa在本 de Jantar",
  "giftValue": 250.00,
  "guestName": "Ricardo e Família",
  "message": "Felicidades sempre!",
  "eventId": "uuid-evento"
}
```

---

### 7.7 Finanças e Despesas (`/api/v1/events/:eventId/finances`)
- `GET /api/v1/events/:eventId/expense-categories` -> Categorias de despesas.
- `POST /api/v1/events/:eventId/expense-categories` -> Criar categoria (`name`, `color`, `icon`).
- `PUT /api/v1/events/:eventId/expense-categories/:id` -> Atualizar categoria.
- `DELETE /api/v1/events/:eventId/expense-categories/:id` -> Excluir categoria.
- `GET /api/v1/events/:eventId/expenses` -> Listar despesas.
- `POST /api/v1/events/:eventId/expenses` -> Criar despesa (`category_id`, `description`, `amount`, `paid_amount`, `status`, `due_date`, `vendor_name`, `notes`).
- `PUT /api/v1/events/:eventId/expenses/:id` -> Atualizar despesa.
- `DELETE /api/v1/events/:eventId/expenses/:id` -> Excluir despesa.
- `GET /api/v1/events/:eventId/finances/metrics` -> Resumo do orçamento:
```json
{
  "totalBudget": 45000.00,
  "totalPaid": 28000.00,
  "toPay": 17000.00,
  "expensesByCategory": [
    { "name": "Buffet", "value": 20000.00, "color": "#10B981" },
    { "name": "Decoração", "value": 15000.00, "color": "#F59E0B" }
  ],
  "paidVsPlanned": [
    { "name": "Buffet", "planned": 20000.00, "paid": 15000.00 },
    { "name": "Decoração", "planned": 15000.00, "paid": 8000.00 }
  ]
}
```

---

### 7.8 Fornecedores (`/api/v1/events/:eventId/suppliers`)
- `GET /api/v1/events/:eventId/suppliers` -> Lista fornecedores.
- `POST /api/v1/events/:eventId/suppliers` -> Cadastra fornecedor (`name`, `category`, `contact_name`, `phone`, `email`, `website`, `instagram`, `address`, `notes`, `contracted`, `contract_value`, `paid_amount`).
- `PUT /api/v1/events/:eventId/suppliers/:id` -> Atualiza fornecedor.
- `DELETE /api/v1/events/:eventId/suppliers/:id` -> Exclui fornecedor.

---

### 7.9 Assinaturas e Planos (`/api/v1/subscriptions`)
- `GET /api/v1/subscriptions/plans` -> Lista planos ativos (`Essentia`, `Atelier`, `Signature`).
- `GET /api/v1/subscriptions/current` -> Retorna dados da assinatura atual do usuário logado.
- `POST /api/v1/subscriptions/checkout-session` -> Cria sessão de checkout do Stripe (`planId`, `billingCycle`). Retorna `url` para redirecionamento.
- `POST /api/v1/subscriptions/customer-portal` -> Cria sessão do portal de autoatendimento do cliente no Stripe.

---

### 7.10 SuperAdmin (`/api/v1/superadmin`)
Requer role global `superadmin`.
- `GET /api/v1/superadmin/stats` -> Totais da plataforma: usuários, eventos ativos, assinaturas ativas e MRR.
- `GET /api/v1/superadmin/users` -> Lista todos os usuários, papéis e planos de assinatura.
- `GET /api/v1/superadmin/users/:id` -> Perfil completo, eventos criados e assinaturas do usuário.
- `PUT /api/v1/superadmin/users/:id/role` -> Altera cargo (`admin` ou `user`).
- `GET /api/v1/superadmin/events` -> Lista todos os eventos da plataforma com organizadores.
- `GET /api/v1/superadmin/subscriptions` -> Lista todas as assinaturas registradas.

---

### 7.11 Upload de Arquivos / Mídia (`/api/v1/upload`)
Substitui o Supabase Storage (`avatars` e `wedding-images`):
- `POST /api/v1/upload/avatar` -> Multipart form-data contendo o arquivo de imagem do perfil.
- `POST /api/v1/upload/event-image` -> Multipart form-data contendo imagem para o evento (hero, convite, galeria).
- `DELETE /api/v1/upload` -> Remove o arquivo do storage remoto.

---

### 7.12 Webhooks (`/api/v1/webhooks`)

#### 1. Webhook do Stripe
- **Endpoint:** `POST /api/v1/webhooks/stripe`
- **Validação:** Header `stripe-signature` validado com o segredo do webhook (`STRIPE_WEBHOOK_SECRET`).
- **Eventos Tratados:**
  - `checkout.session.completed`: Cria ou atualiza o registro na tabela `subscriptions`.
  - `customer.subscription.updated`: Atualiza status, vigência e cancel_at_period_end.
  - `customer.subscription.deleted`: Define `status = 'canceled'`.
  - `invoice.payment_failed`: Atualiza `status = 'past_due'`.
  - `invoice.paid`: Garante `status = 'active'`.

#### 2. Webhook do Mercado Pago
- **Endpoint:** `POST /api/v1/webhooks/mercadopago`
- **Validação:** Headers `x-signature` e `x-request-id` validados via HMAC SHA256 com `MERCADO_PAGO_WEBHOOK_SECRET`.
- **Ação:**
  - Identifica `body.type === 'payment'`.
  - Busca detalhes do pagamento na API do Mercado Pago (`/v1/payments/:id`).
  - Se `payment.status === 'approved'`, extrai `gift_id`, `event_id`, `guest_name` e `message` da `external_reference`.
  - Cria o pagamento em `gift_payments` com status `'confirmed'` e atualiza o presente em `gifts` para `'received'`.

---

## 8. Guia de Refatoração do Frontend (Removendo o Supabase)

### 8.1 Criação do Cliente HTTP Central (`src/services/api.ts`)
Substitui `src/integrations/supabase/client.ts`:

```typescript
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para injetar JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@eventum:token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para capturar 401 (token expirado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('@eventum:token');
      localStorage.removeItem('@eventum:user');
      if (window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/superadmin')) {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);
```

---

### 8.2 Refatoração do `useAuth.tsx`
O hook de autenticação deixa de usar `supabase.auth` e passa a consumir a API própria:

```typescript
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { api } from '@/services/api';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url?: string | null;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('@eventum:token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get<User>('/auth/me');
        setUser(data);
      } catch {
        localStorage.removeItem('@eventum:token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('@eventum:token', data.token);
      setUser(data.user);
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.response?.data?.message || 'Falha no login') };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data } = await api.post('/auth/register', { email, password, full_name: fullName });
      localStorage.setItem('@eventum:token', data.token);
      setUser(data.user);
      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.response?.data?.message || 'Falha no cadastro') };
    }
  };

  const signOut = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('@eventum:token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
```

---

### 8.3 Exemplo de Refatoração de Hook: `useGuests.ts`

#### Antes (Supabase):
```typescript
export function useGuests(eventId?: string) {
  return useQuery({
    queryKey: ['guests', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('*, table:tables(*)')
        .eq('event_id', eventId);
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });
}
```

#### Depois (API Própria com Axios):
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { GuestWithTable, DashboardMetrics, InviteStatus, GuestGroup } from '@/lib/types';

export function useGuests(eventId?: string, filters?: { status?: InviteStatus; group?: GuestGroup }) {
  return useQuery({
    queryKey: ['guests', eventId, filters],
    queryFn: async () => {
      const { data } = await api.get<GuestWithTable[]>(`/events/${eventId}/guests`, {
        params: filters,
      });
      return data;
    },
    enabled: !!eventId,
  });
}

export function useDashboardMetrics(eventId?: string) {
  return useQuery({
    queryKey: ['dashboard-metrics', eventId],
    queryFn: async () => {
      const { data } = await api.get<DashboardMetrics>(`/events/${eventId}/guests/metrics`);
      return data;
    },
    enabled: !!eventId,
  });
}

export function useCreateGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, ...guest }: any) => {
      const { data } = await api.post(`/events/${eventId}/guests`, guest);
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['guests', vars.eventId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics', vars.eventId] });
    },
  });
}
```

---

## 9. Dependências e Variáveis de Ambiente

### 9.1 Remoção do Supabase no Frontend
```bash
npm uninstall @supabase/supabase-js
npm install axios
```

### 9.2 Novas Variáveis de Ambiente no Frontend (`.env`)
```env
# URL Base do novo Backend próprio
VITE_API_URL=http://localhost:3000/api/v1
```

### 9.3 Variáveis de Ambiente no Backend Próprio
```env
# Configurações do Servidor
PORT=3000
NODE_ENV=production
APP_URL=https://eventum.com.br
CORS_ORIGIN=https://eventum.com.br

# Banco de Dados PostgreSQL
DATABASE_URL=postgresql://eventum_user:senha_segura@db.exemplo.com:5432/eventum_db

# Segurança e JWT
JWT_SECRET=super_segredo_jwt_longo_e_aleatorio
JWT_EXPIRATION=7d
ENCRYPTION_KEY=chave_32_bytes_para_tokens_oauth

# Stripe (Assinaturas da Plataforma)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Mercado Pago (Integração de Pagamentos de Presentes)
MERCADO_PAGO_CLIENT_ID=...
MERCADO_PAGO_CLIENT_SECRET=...
MERCADO_PAGO_WEBHOOK_SECRET=...

# Provedor de E-mail (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=Eventum <contato@eventum.com.br>

# Provedor de Armazenamento de Arquivos (AWS S3 ou Cloudflare R2)
STORAGE_DRIVER=s3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_BUCKET_NAME=eventum-media
AWS_ENDPOINT=https://...
```

---

## 10. Checklist de Execução da Migração

- [ ] **Fase 1: Banco de Dados**
  - [ ] Provisionar servidor PostgreSQL 15+.
  - [ ] Executar o script DDL com as 18 tabelas, enums e índices.
  - [ ] Inserir os planos padrão na tabela `subscription_plans`.
  - [ ] Criar o primeiro usuário `superadmin`.

- [ ] **Fase 2: Backend Core**
  - [ ] Inicializar o projeto backend com TypeScript.
  - [ ] Configurar conexão com o PostgreSQL (via Prisma, Drizzle ou TypeORM).
  - [ ] Implementar middleware de autenticação JWT e RBAC.
  - [ ] Implementar endpoints de autenticação (`login`, `register`, `me`).
  - [ ] Implementar endpoints de eventos e membros (`events`, `event_users`).

- [ ] **Fase 3: Módulos de Convidados e Operações**
  - [ ] Desenvolver endpoints de convidados, acompanhantes e mesas.
  - [ ] Desenvolver rotas públicas com validação de tokens (`/convite/:token` e `/reconfirmar/:token`).
  - [ ] Desenvolver motor de envio de e-mails com Resend/SMTP.
  - [ ] Desenvolver módulo financeiro (despesas, fornecedores e métricas).

- [ ] **Fase 4: Pagamentos e Storage**
  - [ ] Implementar upload de arquivos para S3 / Cloudflare R2.
  - [ ] Implementar fluxo OAuth do Mercado Pago (Start, Callback, Refresh, Disconnect).
  - [ ] Implementar criação de pagamento e Webhook do Mercado Pago.
  - [ ] Implementar Checkout e Webhook do Stripe para assinaturas.

- [ ] **Fase 5: Adaptação do Frontend**
  - [ ] Criar `src/services/api.ts` com Axios.
  - [ ] Atualizar `useAuth.tsx` para consumir `/api/v1/auth`.
  - [ ] Atualizar `EventContext.tsx` para consumir `/api/v1/events`.
  - [ ] Atualizar hooks de negócio (`useGuests`, `useGifts`, `useExpenses`, `useSuppliers`, `useTables`, `useSubscription`).
  - [ ] Substituir upload do Supabase Storage pelo endpoint `/api/v1/upload`.
  - [ ] Desinstalar `@supabase/supabase-js`.

- [ ] **Fase 6: Homologação e Testes**
  - [ ] Testar fluxo completo de RSVP e acompanhantes no celular.
  - [ ] Testar compra de presentes via PIX e Mercado Pago com webhook local (ngrok).
  - [ ] Testar fluxo de assinatura Stripe (Upgrade de plano e portal de cliente).
  - [ ] Validar telas do SuperAdmin e restrições por role.
