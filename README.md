# 💰 Controle Financeiro & Life Tracking

Um ecossistema completo (SaaS) para gestão de patrimônio, controle de fluxo de caixa, rastreamento de hábitos e metas financeiras. Construído com arquitetura de Monólito Modular, foco em resiliência de dados e uma UX fluida e otimista.

![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

---

## 📌 Visão Geral

Diferente de gerenciadores financeiros convencionais, este projeto unifica a **saúde financeira** com o **desenvolvimento pessoal**. O sistema não apenas controla saldo bancário e faturas de cartão, mas também acompanha a execução de hábitos (inspirado na metodologia "Atomic Habits") e o progresso de metas de curto e longo prazo.

---

## 🛠️ Stack Tecnológica

### Backend (API)

**Linguagem & Framework**
- Java 21
- Spring Boot 3

**Banco de Dados**
- PostgreSQL 15 (via Docker)

**ORM & Segurança**
- Spring Data JPA (Hibernate)
- Spring Security (JWT)

**Gerenciamento de Crons**
- ShedLock (Prevenção de concorrência em microsserviços)

**Integrações**
- Brapi API (Cotações de mercado)
- JavaMailSender (Notificações)

---

### Frontend (Web)

**Framework**
- Next.js (App Router)
- React

**Linguagem & Estilização**
- TypeScript
- TailwindCSS

**Animações**
- Framer Motion (Micro-interações e Layout Animations)

**Gerenciamento de Estado**
- Context API
- Custom Hooks (Optimistic Updates)

---

## ✨ Principais Funcionalidades & Regras de Negócio

### 💳 Cartões de Crédito e Faturas Inteligentes

Lógica complexa de processamento de faturas:

- Fechamento dinâmico baseado em fusos horários
- Cálculo em tempo real de limites
- Suporte a rolagem de saldo devedor
- Adiantamento de faturas
- Compras parceladas vinculadas a Invoices futuros

---

### 🎯 Metas & Checklist Financeiro

As metas podem ser:

- Numéricas (ex: Ler X livros)
- Monetárias

Metas monetárias suportam um **Checklist de Compras**, onde o valor de itens adquiridos é deduzido automaticamente da meta principal.

O sistema conta com:

**Estorno Inteligente**
- Se uma meta ou item é deletado, o valor volta com segurança e rastreabilidade para a conta bancária original.

---

### ⚡ Hábitos (Modelo "Atomic Habits")

Rastreamento de hábitos com frequências flexíveis:

- Diário
- Meta semanal

O sistema possui uma **engine de CronJob** rodando de madrugada para avaliar o cumprimento.

Inclui também:

**Perdão Automático**
- Se o usuário esquecer um dia (mas cumpriu no anterior), a ofensiva é protegida para incentivar a consistência.

---

### 📈 Investimentos

Gestão de carteira de:

- Renda Fixa
- Renda Variável
- Ações
- FIIs
- Cripto

As cotações são atualizadas de forma **assíncrona** via integração com a **Brapi**.

Cálculos automáticos:

- Preço Médio
- Lucro
- Proventos

---

### 📊 Planejamento e Resumo Anual

Funcionalidades:

- Previsão de despesas e receitas do mês
- Status dinâmicos:
  - Pendente
  - Guardado
  - Pago

Também inclui:

- Visão consolidada do ano
- Comparativo de crescimento ano-a-ano do patrimônio
- Exportação de relatórios em Excel
- Bloco de notas anual para insights de vida

---

## 🗂️ Arquitetura e Padrões (Monólito Modular)

O backend segue princípios de **Domain-Driven Design (DDD)** focado na isolação de domínios.

Todas as operações financeiras utilizam controle transacional rigoroso com:

```
@Transactional
```

Garantindo propriedades **ACID**.

---

## 📂 Estrutura de Pastas

```
/ (Monorepo Root)
├── backend/
│   ├── src/main/java/com/controlefinanceiro/api
│   │   ├── controller     # Endpoints REST
│   │   ├── domain         # Entidades, DTOs e Regras de Negócio
│   │   │   ├── account
│   │   │   ├── card
│   │   │   ├── goal
│   │   │   ├── habit
│   │   │   ├── investment
│   │   │   └── transaction
│   │   ├── infra          # Configurações (Security, JWT, Mail, ShedLock)
│   │   └── service        # Casos de uso pesados e Cron Jobs
│
├── frontend/
│   ├── src/
│   │   ├── app            # Rotas do Next.js
│   │   ├── components     # UI Reutilizável
│   │   ├── contexts       # Contextos globais
│   │   ├── hooks          # Regras de apresentação
│   │   └── services       # Comunicação com API
│
└── docker-compose.yml
```

---

## 🛢️ Modelo de Dados (Schema Core)

As tabelas comunicam-se de maneira relacional e escalável.

**users, accounts, categories**
- Estrutura base de perfis e caixas

**transactions**
- Fluxo de caixa real (entradas e saídas)

**credit_cards, invoices, card_transactions**
- Ecossistema de compras no crédito

**monthly_plans, plan_items**
- Orçamentos fixos

**goals, goal_items, goal_history**
- Rastreio de metas e aquisições

**investments, invest_transactions**
- Carteira de ativos

**habits, habit_logs**
- Engine de repetição de hábitos

**shedlock**
- Controle de concorrência para cron jobs

---

## 🚀 Como Executar Localmente

### Pré-requisitos

- Docker
- Docker Compose
- Java 21+
- Maven
- Node.js 18+

---

### 1️⃣ Subir Infraestrutura (Banco de Dados)

Na raiz do projeto:

```bash
docker-compose up -d
```

O banco rodará em:

- PostgreSQL → `5432`
- PgAdmin → `5050` (opcional)

---

### 2️⃣ Rodar o Backend (API)

```bash
cd backend
./mvnw spring-boot:run
```

API disponível em:

```
http://localhost:8080
```

---

### 3️⃣ Rodar o Frontend (Web)

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Aplicação disponível em:

```
http://localhost:3000
```

---

## 📌 Roadmap Futuro

- Dashboard avançado com gráficos
- Sistema de notificações
- Aplicativo Mobile (React Native)
- Integração com Open Banking
- Exportação de relatórios avançados

---

## 📄 Licença

Projeto desenvolvido para fins de estudo e evolução técnica.
