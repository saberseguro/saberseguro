# Importação Modelo 1

A tela fica em **Gestão → Importar Dados** (`/gestao/importar`). É obrigatório entrar em uma empresa existente antes de começar. O fluxo seleciona o modelo, envia o XLSX e apresenta a prévia das unidades, setores, cargos e funcionários da empresa selecionada. Nenhuma empresa é criada ou atualizada. Nada é gravado antes da confirmação.

## Preparação do ambiente

Antes de usar a funcionalidade, aplique as migrações no ambiente desejado e regenere o cliente:

```sh
npx prisma migrate deploy
npx prisma generate
npm run build
```

A migração `20261006120000_importacao_cadastro_sem_acesso` permite e-mail e Firebase ID nulos para cadastros sem acesso e amplia razão social/nome fantasia para 255 caracteres. Não aplica alterações de dados a cadastros existentes. No Windows, se o engine Prisma estiver em uso, encerre a instância local da API antes de regenerar o cliente e reinicie depois.

## Identificação e atualização

- Empresa de destino: ID da empresa selecionada, validado na API; somente leitura.
- Unidade: documento dentro da empresa.
- Setor: nome normalizado dentro da unidade.
- Cargo: nome normalizado dentro do setor.
- Funcionário: CPF global, com conferência de conflitos de e-mail. Não transfere pessoas entre empresas.

O Modelo 1 é identificado pelos cabeçalhos, mesmo com título antes da tabela ou colunas reordenadas. Apenas uma aba compatível é aceita. Limites: 10 MB e 10.000 linhas. Linhas idênticas de funcionários são agrupadas; CPF com dados/lotações divergentes, cadastros ambíguos e valores acima dos limites bloqueiam o lote.

As colunas CNPJ e Razão Social da empresa são ignoradas. Todas as unidades, mesmo com CNPJs e razões sociais distintos, são vinculadas à empresa selecionada. CNPJ Unidade/CAEPF Unidade e Razão Social Unid. alimentam exclusivamente o cadastro da unidade. O nome e o endereço da empresa de destino não são alterados.

Importa nomes, documentos, endereço da unidade, descrição detalhada do cargo e nome/CPF/e-mail/telefone do funcionário. Os códigos externos não são persistidos. Renomear setor ou cargo na origem sem atualizar o cadastro local cria uma nova entrada, pois a identificação desses níveis é pelo nome. Colunas sem equivalente no cadastro, como matrícula, nascimento, CBO e situação da origem, não são persistidas. Campos vazios não apagam valores existentes. Estado ativo, horários, perfis, assinatura, treinamentos e progresso existentes são preservados.

## Acesso por CPF e e-mail

Na confirmação, informe a senha inicial (8 a 128 caracteres) e a faixa de horários. Funcionários sem Firebase ID recebem uma conta, incluindo cadastros antigos ainda pendentes. Com e-mail, a conta usa esse endereço; sem e-mail, usa um identificador aleatório no domínio reservado `cpf.saberseguro.invalid`. Esse identificador fica somente no Firebase; `usuario.email` continua nulo e o funcionário entra pelo CPF. A conta exige troca de senha no primeiro login.

O perfil `funcionario` deve existir no sistema. Esse perfil e horários para todos os dias da semana são adicionados apenas quando o cadastro não possui essas configurações. Contas já existentes mantêm senha, perfis e horários. Um e-mail diferente do acesso existente bloqueia a importação para não dessincronizar o login. Não são enviados convites.

O login por CPF depende de `FIREBASE_WEB_API_KEY` na API, com a chave web do mesmo projeto Firebase usada em `VITE_FIREBASE_API_KEY` no frontend. Reinicie a API após configurar. O servidor resolve a conta pelo CPF, verifica a senha no Firebase e aplica as mesmas regras do login por e-mail antes de liberar a sessão. O e-mail interno nunca é apresentado como contato. Recuperação por CPF não faz parte desta alteração.

## Segurança e consistência

Os endpoints `/api/importacao/previa` e `/api/importacao/confirmar` exigem `empresaId` numérico, correspondente a uma empresa ativa, além de ver_empresas, ver_usuarios e editar_empresas. A prévia verifica criar/editar_empresas para unidades, setores e cargos e criar/editar_usuarios para funcionários. Usuários sem papel admin ficam restritos à própria empresa. Ausência de seleção bloqueia inclusive administradores. A assinatura da prévia inclui a empresa de destino; trocar a seleção exige nova prévia. Na tela, sair ou trocar de empresa descarta o arquivo e a confirmação anteriores.

A confirmação reprocessa o arquivo no servidor e compara a prévia assinada, vinculada ao usuário e válida por 30 minutos. As contas Firebase são provisionadas após essa validação; os dados são revalidados dentro da transação antes da gravação. Gravação e log de resumo ocorrem juntos em uma transação serializável. Em caso de falha, somente as contas criadas nesta tentativa e não vinculadas no banco são removidas. Se o banco ou Firebase estiver indisponível durante a compensação, o UID é registrado no log da API para conciliação; contas antigas nunca são apagadas. Senhas não são gravadas no banco nem em logs.

## Lotes grandes e acompanhamento

A confirmação retorna HTTP 202 com um identificador de processo. A tela consulta `/api/importacao/processos/:id?empresaId=...` para exibir validação, criação de acessos, gravação no banco e eventual reversão. A consulta é restrita ao usuário que iniciou o processo e à empresa de destino. Atualizar a página retoma o acompanhamento pelo identificador guardado na sessão do navegador; apenas esse identificador é armazenado, nunca a senha ou a planilha.

A criação de contas Firebase usa no máximo 8 chamadas simultâneas. Se houver falha, aguarda as chamadas já iniciadas antes de compensar, para evitar criar contas depois da limpeza. O banco recebe inserções em lotes de até 300 registros, por nível da hierarquia, e horários em lotes de até 700. As relações são resolvidas pelos registros gravados, sem supor sequência de IDs. Conflitos continuam revertendo toda a transação SQL; registros existentes sem alteração não geram UPDATE.

O registro de processos fica em memória na instância da API por até duas horas após terminar. Uma empresa só pode ter uma importação ativa por instância; repetir a mesma confirmação devolve o mesmo processo. Atualizar/fechar o navegador não interrompe o trabalho, mas reiniciar a API interrompe processos ativos e perde o acompanhamento. Não reinicie durante uma importação. Para executar múltiplas réplicas da API, é necessário substituir esse registro por uma fila persistente compartilhada. Estas melhorias não recuperam processos iniciados pela versão anterior.

Referências de implementação: [inserções em lote no Prisma 6](https://docs.prisma.io/docs/orm/v6/prisma-client/queries/crud) e [limites do Firebase Authentication](https://firebase.google.com/docs/auth/limits).

## Testes

`npm run test:importacao` compila a API e testa parser, agrupamento, conflitos, reaproveitamento da hierarquia, idempotência, preservação de dados, assinatura da prévia e compensação de contas. `npm run test:auth` verifica normalização do CPF, senha, vínculo do UID, contas inativas e bloqueio por horários. Os testes usam banco e Firebase simulados. A transação real e a criação de acesso devem ser validadas em homologação.

Referências: [autenticação REST do Firebase](https://firebase.google.com/docs/reference/rest/auth) e [sessão com custom token](https://firebase.google.com/docs/auth/web/custom-auth).
