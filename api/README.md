
# API - Projeto Base com Node.js, Express, TypeScript e Prisma

Este projeto é uma estrutura base para desenvolvimento de APIs REST utilizando Node.js, Express, TypeScript e Prisma ORM, seguindo uma arquitetura modular e limpa.

## 📁 Estrutura de Pastas

```
src/
├── config/         # Configurações globais (ex: database, middlewares)
├── domain/         # Entidades, tipos e regras de negócio puras
├── infra/          # Integrações externas, repositórios e Prisma
├── shared/         # Utilitários, middlewares, helpers reutilizáveis
├── use-cases/      # Casos de uso da aplicação (ex: autenticação)
└── server.ts       # Ponto de entrada da aplicação
```

## 🚀 Como Rodar o Projeto

### 1. Instale as dependências
```bash
npm install
```

### 2. Configure o arquivo `.env`
Crie um arquivo `.env` na raiz com suas variáveis de ambiente, por exemplo:
```
DATABASE_URL="mysql://usuario:senha@host:porta/nome_do_banco"
JWT_SECRET="sua_chave_secreta"
PORT=3333
```

### 3. Gere o cliente Prisma e aplique as migrações
```bash
npx prisma generate
npx prisma migrate dev
```

### 4. Rode o servidor em ambiente de desenvolvimento
```bash
npm run dev
```

## ✅ Próximo Passo: Implementar Login

Para criar uma rota de login segura, será usada autenticação com:

- 📧 E-mail e senha
- 🔐 Geração de token JWT
- 🔒 Verificação de senha com `bcrypt`

---

## 🛠 Tecnologias Utilizadas

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Prisma ORM](https://www.prisma.io/)
- [MySQL](https://www.mysql.com/)
- [JWT](https://jwt.io/)
- [Bcrypt](https://github.com/kelektiv/node.bcrypt.js)

---

## 📦 Scripts disponíveis

- `npm run dev` — roda o servidor com `ts-node-dev`
- `npm run build` — compila para JavaScript
- `npm run start` — roda o servidor em produção (build já feito)

---

## 🤝 Contribuição

Pull requests são bem-vindos. Para mudanças maiores, por favor abra uma issue primeiro para discutir o que você gostaria de mudar.

---

## 📝 Licença

Este projeto está sob a licença MIT.
