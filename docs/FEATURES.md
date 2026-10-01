# Documentação de Funcionalidades da Plataforma Eventum

Este documento descreve as principais funcionalidades disponíveis na plataforma Eventum, projetada para ser a solução completa em gestão de eventos.

## Módulos Principais

A plataforma está organizada em módulos que cobrem todo o ciclo de vida de um evento, desde o planejamento até a análise pós-evento.

---

## 1. Gestão de Eventos

O coração da plataforma, onde os cerimonialistas e suas equipes podem criar, organizar e supervisionar todos os seus eventos.

- **Criação de Eventos:** Crie novos eventos fornecendo informações básicas como nome, data, local e uma breve descrição. A plataforma gera um `slug` (URL amigável) único para cada evento.
- **Múltiplos Eventos:** Gerencie um número ilimitado de eventos simultaneamente, alternando entre eles facilmente através do `EventSwitcher`.
- **Área Pública do Evento:** Cada evento possui uma página pública (`/evento/:slug`) que pode ser compartilhada com os convidados, contendo informações gerais, galeria de fotos e lista de presentes.

---

## 2. Dashboard do Admin (`/admin`)

O painel de controle central para cada evento, oferecendo uma visão geral e acesso rápido a todas as ferramentas de gestão.

- **Visão Geral:** Apresenta estatísticas rápidas como número de convidados, confirmações de presença, e um resumo financeiro.
- **Navegação Principal:** A `AdminSidebar` permite o acesso rápido a todos os submódulos de gestão.

---

## 3. Gestão de Convidados (`/admin/guests`)

Funcionalidades completas para gerenciar todos os aspectos relacionados aos convidados do evento.

- **Adição e Importação:** Adicione convidados manualmente ou importe uma lista completa a partir de uma planilha.
- **Envio de Convites:** Envie convites digitais por e-mail diretamente da plataforma. Cada convite contém um link único para RSVP.
- **Controle de RSVP:** Acompanhe em tempo real as confirmações de presença (`/reconfirmar/:token`). Os convidados podem confirmar ou recusar o convite através do link recebido.
- **Gestão de Acompanhantes:** Permita que os convidados informem se levarão acompanhantes.
- **Segunda Confirmação:** Envie um segundo lembrete ou pedido de confirmação para garantir a precisão da lista de presentes.

---

## 4. Gestão de Mesas (`/admin/tables`)

Organize a disposição dos convidados no evento de forma simples e visual.

- **Criação de Mesas:** Defina o número de mesas e a capacidade de cada uma.
- **Alocação de Convidados:** Arraste e solte os convidados confirmados para as mesas, facilitando a organização dos assentos.

---

## 5. Gestão Financeira

Um conjunto de ferramentas para controlar o orçamento e as finanças do evento.

- **Presentes Virtuais e Lista de Casamento (`/admin/gifts`):**
    - Crie listas de presentes virtuais onde os convidados podem "comprar" itens, com o valor sendo revertido para os noivos/organizadores.
    - A página pública de presentes (`/evento/:slug/presentes`) exibe as opções para os convidados.
- **Controle de Despesas e Fornecedores (`/admin/suppliers`):**
    - Cadastre fornecedores e as despesas associadas a cada um.
    - Mantenha um registro de todos os custos do evento.
- **Relatórios Financeiros (`/admin/finances`):** (Plano Atelier e Signature)
    - Visualize dashboards com o total de presentes recebidos, despesas totais e o balanço financeiro do evento.
- **Configuração de Pagamentos:**
    - **PIX (`/admin/pix`):** Configure uma chave PIX para receber os valores dos presentes virtuais diretamente.
    - **Mercado Pago (`/admin/mercadopago`):** Conecte uma conta Mercado Pago para processar pagamentos de forma segura, utilizando OAuth para autenticação.

---

## 6. Configurações e Personalização (`/admin/settings`)

Ajuste os detalhes e a aparência do seu evento.

- **Configurações do Evento:** Altere informações básicas do evento, como data, local, etc.
- **Personalização Visual:** (Plano Atelier e Signature)
    - Altere o tema visual da página pública do evento, incluindo cores, imagens e fontes, para que combine com a identidade do evento.
    - Faça o upload de uma imagem de herói (`hero image`) para a página do evento.

---

## 7. Perfil e Assinatura do Usuário

- **Gestão de Perfil (`/profile`):**
    - **Dados Pessoais:** O usuário pode alterar seu nome, e-mail e senha.
    - **Foto de Perfil:** Faça o upload de uma foto (avatar) para personalizar a conta.
- **Gestão de Assinatura (`/profile`):**
    - **Plano Atual:** Visualize o plano de assinatura atual, status e data de renovação.
    - **Gerenciar Assinatura:** Acesse o portal do cliente (Stripe/MercadoPago) para alterar o plano, atualizar o método de pagamento ou cancelar a assinatura.
    - **Ver Planos (`/pricing`):** Página pública onde novos usuários podem ver e assinar os planos.

---

## 8. Módulo Super Admin (`/superadmin`)

Uma área restrita para os administradores da plataforma Eventum, permitindo o gerenciamento de toda a base de usuários e eventos.

- **Dashboard Geral:** Visão geral de novos usuários, eventos criados e assinaturas ativas.
- **Gerenciamento de Usuários (`/superadmin/users`):** Liste, visualize e gerencie todos os usuários da plataforma.
- **Gerenciamento de Eventos (`/superadmin/events`):** Monitore todos os eventos criados na plataforma.
- **Gerenciamento de Assinaturas (`/superadmin/subscriptions`):** Visualize todas as assinaturas ativas, canceladas e seus respectivos planos.

---
Este documento reflete o estado atual das funcionalidades da plataforma. Novas funcionalidades e melhorias são constantemente adicionadas. Para dúvidas, sugestões ou suporte, entre em contato.
