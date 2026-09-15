# Documentação — Saber Seguro Treinamentos

Sistema de cursos/treinamentos de SST (Segurança e Saúde no Trabalho), com emissão de certificados, gestão de empresas/funcionários e medidas de segurança.

## Arquitetura

Monorepo com duas pastas independentes:

- **`api/`** — backend Node.js + Express + TypeScript + Prisma ORM (MySQL).
- **`view/`** — frontend React 19 + TypeScript + Vite + Tailwind v4.

## Backend (`api/`)

**Stack:** Express 5, Prisma 6 (MySQL), JWT (`jsonwebtoken`) + `bcrypt` para auth, `firebase-admin` (storage de arquivos), `node-cron` (agendamentos), `nodemailer` (e-mail), `exceljs`/`puppeteer` (geração de relatórios Excel/PDF e certificados).

**Estrutura (`src/`):**
- `server.ts` — bootstrap do Express, registro de todas as rotas sob `/api/*`, CORS liberado para o domínio de produção e localhost.
- `config/` — variáveis de ambiente (`env.ts`) e client do Prisma.
- `controllers/`, `models/`, `routes/` — organizados por domínio: `curso/`, `empresa/`, `relatorio/`, além de usuário, medida e dashboard.
- `infra/database/prisma/` — `schema.prisma` e migrations.
- `infra/firebase/` — integração com Firebase (armazenamento de mídia/materiais).
- `middlewares/authorize.ts` — autenticação JWT + checagem de permissões + horário de acesso liberado por usuário.
- `services/email/`, `services/whatsapp/` — envio de certificado por e-mail e notificações via WhatsApp (Evolution API).
- `schedulers/` — job semanal (toda segunda 9h) que notifica cursos pendentes via WhatsApp.

**Autenticação e permissões:**
- Login gera um JWT contendo `roles` e `permissoes` do usuário.
- `authOnly` valida apenas o token (+ janela de horário permitido, salvo admin).
- `authorize([...permissoes])` exige permissões específicas por rota, além da mesma checagem de horário.
- Horário de acesso é configurável por usuário (`usuariohorario`), com exceção para role `admin`.

**Principais rotas (`/api/...`):** `usuario`, `empresa`, `unidade`, `setor`, `cargo`, `categoria`, `curso` (+ `modulo`, `aula`, `aula/aulavideo`, `aula/materialcomplementar`, `aula/steps`, `aulausuario`), `certificados`, `responsaveltecnico`, `avaliacao`, `medida`, `dashboard`, `relatorios`.

**Modelo de dados (Prisma — principais entidades):**
- **Empresa/RH:** `empresa`, `unidade`, `setor`, `cargo`, `cnae`/`cnaevinculo`, `responsaveltecnico`.
- **Usuários e acesso:** `usuario`, `role`, `permissao`, `rolepermissao`, `usuariorole`, `usuariohorario`, `logevento`.
- **Cursos:** `curso`, `categoria`/`categoriacurso`, `modulo`, `aula`, `aulastep`, `aulavideo`, `aulavideoprogresso`, `aulausuario`, `materialcomplementar`/`materialacesso`, `cursoacesso`.
- **Avaliação:** `avaliacao`, `pergunta`, `alternativa`, `resposta`, `avaliacaousuario`.
- **Certificados:** `certificado`, `certificadomodelo`, `certificadoempresa`.
- **Medidas de segurança:** `medida`, `medidacurso`, `medidavinculo`.

## Frontend (`view/`)

**Stack:** React 19 + React Router 7, Tailwind v4, `react-select`, `@dnd-kit` (arrastar/soltar módulos e avaliações), `react-quill-new` (editor rich text), `react-signature-canvas` (assinatura digital), `recharts` (gráficos), `react-player`, Firebase SDK (client), SweetAlert2 e `react-hot-toast` para feedback.

**Estrutura (`src/`):**
- `contexts/` — `AuthContext` (sessão/usuário), `CompanyContext` (empresa selecionada), `CertificadosContext`.
- `routes/index.tsx` — rotas privadas (exigem login) e pública (`/login`); force redireciona para `/ajustes` se o usuário precisa trocar senha ou cadastrar assinatura.
- `pages/` — telas por domínio: `Auth`, `Home`, `Empresa`, `Curso` (gestão de curso, módulos, aulas, avaliações, player do aluno, certificados, editor de certificado), `Medida`, `RelatoriosPage`, `ConfigPage`, `Ajustes`.
- `components/` — `Formularios/` (forms de cadastro), `Tabelas/`, `Modais/`, `Sortable*` (reordenação via dnd-kit), `Sidebar`, `Layout`.
- `services/` — camada de chamadas HTTP (`apiFetch.ts` + um arquivo por domínio: curso, empresa, medida, relatório, etc.) e `firebase.ts`/`upload.ts` para upload de arquivos.

**Principais rotas do app:** `/login`, `/` (home/dashboard), `/empresa`, `/cursos/gerenciar`, `/cursos/:id/*`, `/cursos/meuscursos`, `/cursos/playcurso/:idCurso`, `/cursos/certificados`, `/certificado/preview/:idCertificado`, `/certificados/novo`, `/certificados/:id/editar`, `/medida`, `/configuracoes`, `/gestao/relatorios`, `/ajustes`.

## Integrações externas

- **MySQL** (Hostinger, produção) via Prisma.
- **Firebase** — armazenamento de arquivos/materiais das aulas.
- **Evolution API (WhatsApp)** — notificação automática de cursos pendentes (job semanal).
- **SMTP (Hostinger)** — envio de certificado por e-mail.
- **Puppeteer** — geração de PDFs (lista de presença, relatório de pendências).
- **ExcelJS** — relatório de funcionários em Excel.

## Variáveis de ambiente

`api/.env`: `DATABASE_URL`, `PORT`, `JWT_SECRET`, Firebase (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `PRIVATE_KEY_ID`), `LOCATION_BROWSER` (config do Chrome p/ Puppeteer), SMTP (`SMTP_HOST`, `SMTP_PORT`, `SSL_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`), WhatsApp (`EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE`, `WHATSAPP_NOTIFICACOES_ATIVO`).

> ⚠️ O arquivo `api/.env` atual contém credenciais reais (senha do banco, JWT secret, chave privada do Firebase, senha SMTP). Vale confirmar que ele está no `.gitignore` e nunca é commitado.

## Como rodar localmente

**API:**
```bash
cd api
npm install
npx prisma generate && npx prisma migrate dev
npm run dev        # http://localhost:8800 (ou porta do .env)
```

**Frontend:**
```bash
cd view
npm install
npm run dev         # http://localhost:5173
```
