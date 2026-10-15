const { test } = require('node:test');
const assert = require('node:assert/strict');
const ExcelJS = require('exceljs');
const { lerModelo1, listar } = require('../dist/models/importacao/modelo1');
const { prepararImportacao, gravarImportacao: gravarReal, assinaturaImportacao, validarAssinatura, validarEmpresaSelecionada } = require('../dist/models/importacao/importacao');
const { comNovosAcessos, validarOpcoesAcesso } = require('../dist/models/importacao/acessosImportacao');
const gravarImportacao = (db, modelo, contexto) => gravarReal(db, modelo, contexto, {
  contas: new Map(listar(modelo.empresas).filter(i => i.configurarAcesso).map(i => [i.chave, `firebase-${i.chave}`])),
  idRole: 3, horarioInicio: '08:00', horarioFim: '18:00',
});

const cabecalhos = ['Nome Unidade', 'Nome Setor', 'Nome Cargo', 'Nome Funcionário', 'CPF', 'CNPJ Unidade', 'Razão Social Unid.', 'E-mail', 'CNPJ', 'Razão Social'];
const linha = ['Unidade A', 'Setor A', 'Cargo A', 'Pessoa Teste', '012.345.678-90', '12.345.678/0001-90', 'Empresa Teste', '', '', ''];
const contexto = { idUsuario: 99, roles: ['admin'], empresaSelecionadaId: 1, permissoes: ['criar_empresas', 'editar_empresas', 'criar_usuarios', 'editar_usuarios'] };
async function planilha(linhas = [linha]) {
  const w = new ExcelJS.Workbook(); const s = w.addWorksheet('Modelo1');
  s.addRow(['Modelo 1']); s.addRow(cabecalhos); linhas.forEach(l => s.addRow(l));
  return lerModelo1(Buffer.from(await w.xlsx.writeBuffer()));
}
function banco() {
  const dados = { empresa: [{ idEmpresa: 1, ativo: 1, nomeFantasia: 'Empresa selecionada', razaoSocial: 'Empresa selecionada LTDA', documento: '99999999000199' }], unidade: [], setor: [], cargo: [], usuario: [], logevento: [], usuariorole: [], usuariohorario: [] };
  const ids = { empresa: 'idEmpresa', unidade: 'idUnidade', setor: 'idSetor', cargo: 'idCargo', usuario: 'idUsuario', logevento: 'idLogEvento', usuariorole: 'id', usuariohorario: 'id' };
  const db = {};
  const operacoes = { leituras: 0, insercoes: 0, atualizacoes: 0 };
  const corresponde = (r, where) => Object.entries(where).every(([k, v]) => k === 'OR'
    ? v.some(condicao => corresponde(r, condicao)) : typeof v === 'object' && v !== null ? v.in.includes(r[k]) : r[k] === v);
  for (const tabela of Object.keys(dados)) db[tabela] = {
    findMany: async ({ where = {} } = {}) => { operacoes.leituras++; return structuredClone(dados[tabela].filter(r => corresponde(r, where)).map(r => tabela === 'usuario' ? { ...r, usuariorole: dados.usuariorole.filter(x => x.fkUsuarioId === r.idUsuario), usuariohorario: dados.usuariohorario.filter(x => x.fkUsuarioId === r.idUsuario) } : r)); },
    createMany: async ({ data }) => { operacoes.insercoes++; for (const row of data) dados[tabela].push({ [ids[tabela]]: dados[tabela].length + 1, ativo: 1, ...structuredClone(row) }); return { count: data.length }; },
    create: async ({ data }) => {
      if (tabela === 'empresa') assert.fail('Importação não pode criar empresa');
      const registro = { [ids[tabela]]: dados[tabela].length + 1, ativo: 1, ...structuredClone(data) };
      dados[tabela].push(registro); return structuredClone(registro);
    },
    update: async ({ where, data }) => {
      operacoes.atualizacoes++;
      if (tabela === 'empresa') assert.fail('Importação não pode atualizar empresa');
      const registro = dados[tabela].find(r => r[ids[tabela]] === where[ids[tabela]]);
      assert.ok(registro); Object.assign(registro, structuredClone(data)); return structuredClone(registro);
    },
  };
  return { db, dados, operacoes };
}

test('Modelo 1: normaliza documentos, agrupa repetições e mantém hierarquia', async () => {
  const dados = await planilha([linha, linha]);
  assert.deepEqual(dados.erros, []); assert.equal(dados.duplicadas, 1);
  assert.equal(listar(dados.empresas).length, 5);
  assert.equal(listar(dados.empresas).at(-1).dados.cpf, '01234567890');
  assert.equal(listar(dados.empresas).at(-1).dados.email, undefined);
});
test('CPF duplicado em lotações diferentes bloqueia o lote', async () => {
  const outra = [...linha]; outra[1] = 'Outro setor';
  const dados = await planilha([linha, outra]);
  assert.ok(dados.erros.some(e => e.includes('lotação')));
});
test('nomes repetidos em unidades diferentes não misturam setores ou cargos', async () => {
  const a = [...linha]; a[8] = '12345678000190'; a[9] = 'Empresa Teste';
  const b = [...a]; b[0] = 'Unidade B'; b[5] = '12345678000270'; b[4] = '98765432100';
  const modelo = await planilha([a, b]);
  assert.deepEqual(modelo.erros, []); assert.equal(modelo.empresas.length, 1);
  assert.equal(modelo.empresas[0].filhos.length, 2);
  assert.equal(listar(modelo.empresas).filter(i => i.tipo === 'setor').length, 2);
});
test('cria estrutura completa, reimporta sem duplicar e preserva campos vazios e ativo', async () => {
  const { db, dados } = banco();
  const primeira = await prepararImportacao(db, await planilha(), contexto);
  assert.deepEqual(primeira.erros, []); assert.equal(primeira.resumo.funcionario.criar, 1);
  await gravarImportacao(db, primeira, contexto);
  assert.equal(dados.usuario[0].fkEmpresaId, dados.empresa[0].idEmpresa);
  assert.equal(dados.usuario[0].fkCargoId, dados.cargo[0].idCargo);
  assert.equal(dados.usuario[0].email, null); assert.equal(dados.usuario[0].firebaseId, 'firebase-01234567890');
  assert.equal(dados.usuario[0].trocarsenha, true);
  assert.equal(dados.usuariorole.length, 1); assert.equal(dados.usuariohorario.length, 7);
  dados.usuario[0].email = 'existente@example.com'; dados.usuario[0].ativo = 0;
  dados.setor[0].descricao = 'Descrição existente';
  const segunda = await prepararImportacao(db, await planilha(), contexto);
  assert.equal(segunda.resumo.funcionario.atualizar, 1);
  assert.equal(segunda.acessosNovos, 0);
  await gravarImportacao(db, segunda, contexto);
  for (const t of ['empresa', 'unidade', 'setor', 'cargo', 'usuario']) assert.equal(dados[t].length, 1);
  assert.equal(dados.usuario[0].email, 'existente@example.com'); assert.equal(dados.usuario[0].ativo, 0);
  assert.equal(dados.setor[0].descricao, 'Descrição existente');
  assert.equal(dados.usuariorole.length, 1); assert.equal(dados.usuariohorario.length, 7);
});

test('reimportar cadastro pendente cria acesso e preserva perfil e horários existentes', async () => {
  const { db, dados } = banco();
  await gravarImportacao(db, await prepararImportacao(db, await planilha(), contexto), contexto);
  dados.usuario[0].firebaseId = null;
  dados.usuariorole[0].fkRoleId = 9;
  dados.usuariohorario[0].horarioInicio = '10:00';
  const previa = await prepararImportacao(db, await planilha(), contexto);
  assert.equal(previa.acessosNovos, 1);
  await gravarImportacao(db, previa, contexto);
  assert.equal(dados.usuario.length, 1); assert.ok(dados.usuario[0].firebaseId);
  assert.equal(dados.usuariorole[0].fkRoleId, 9); assert.equal(dados.usuariohorario[0].horarioInicio, '10:00');
});

test('sem e-mail usa identificador interno no Firebase, sem persistir como contato', async () => {
  const { db } = banco(); const modelo = await prepararImportacao(db, await planilha(), contexto);
  let enviada;
  await comNovosAcessos(modelo, 'SenhaTeste123!', { createUser: async data => { enviada = data; }, deleteUser: async () => assert.fail('Não deve apagar após sucesso') },
    async contas => { assert.equal(contas.size, 1); }, async () => false, () => assert.fail('Sem falha'));
  assert.match(enviada.email, /^[a-f0-9]+@cpf\.saberseguro\.invalid$/);
  assert.equal(enviada.password, 'SenhaTeste123!'); assert.equal(enviada.disabled, false);
  assert.equal(listar(modelo.empresas).at(-1).dados.email, undefined);
});

test('falha no banco compensa somente contas criadas nesta importação', async () => {
  const { db } = banco(); const modelo = await prepararImportacao(db, await planilha(), contexto);
  const criadas = [], removidas = [];
  await assert.rejects(() => comNovosAcessos(modelo, 'SenhaTeste123!', {
    createUser: async data => { criadas.push(data.uid); }, deleteUser: async uid => { removidas.push(uid); },
  }, async () => { throw new Error('rollback'); }, async () => false, () => assert.fail('Sem falha')), /rollback/);
  assert.deepEqual(removidas, criadas);
});

test('erro após commit não apaga conta já vinculada ao banco', async () => {
  const { db } = banco(); const modelo = await prepararImportacao(db, await planilha(), contexto);
  await assert.rejects(() => comNovosAcessos(modelo, 'SenhaTeste123!', {
    createUser: async () => {}, deleteUser: async () => assert.fail('Conta vinculada não deve ser apagada'),
  }, async () => { throw new Error('resposta perdida'); }, async () => true, () => assert.fail('Sem falha')), /resposta perdida/);
});

test('valida senha e horários antes de criar contas', () => {
  assert.throws(() => validarOpcoesAcesso('123', '08:00', '18:00'), /senha inicial/);
  assert.throws(() => validarOpcoesAcesso('SenhaTeste123!', '18:00', '08:00'), /horários/);
  assert.equal(validarOpcoesAcesso('SenhaTeste123!', '08:00', '18:00').inicio, '08:00');
});
test('reutiliza empresa/unidade/setor existentes e cria cargos e funcionários faltantes', async () => {
  const { db, dados } = banco();
  const inicial = await prepararImportacao(db, await planilha(), contexto);
  await gravarImportacao(db, inicial, contexto); dados.cargo.length = 0; dados.usuario.length = 0;
  dados.setor[0].nome = '  SETOR A  ';
  const previa = await prepararImportacao(db, await planilha(), contexto);
  assert.equal(previa.resumo.empresa, undefined); assert.equal(previa.resumo.unidade.atualizar, 1);
  assert.equal(previa.resumo.setor.atualizar, 1); assert.equal(previa.resumo.cargo.criar, 1);
  await gravarImportacao(db, previa, contexto);
  assert.equal(dados.setor[0].nome, 'Setor A'); assert.equal(dados.cargo[0].fkSetorId, 1);
});
test('conflito de CPF externo não expõe dados nem transfere funcionário', async () => {
  const { db, dados } = banco();
  dados.usuario.push({ idUsuario: 10, nome: 'Nome confidencial', cpf: '01234567890', fkEmpresaId: 123, email: null });
  const previa = await prepararImportacao(db, await planilha(), contexto);
  assert.ok(previa.erros.some(e => e.includes('outro cadastro')));
  assert.ok(!JSON.stringify(previa).includes('Nome confidencial'));
});
test('rejeita duplicidade de unidade dentro da empresa selecionada', async () => {
  const { db, dados } = banco();
  dados.unidade.push({ idUnidade: 1, fkEmpresaId: 1, documento: '12.345.678/0001-90' }, { idUnidade: 2, fkEmpresaId: 1, documento: '12345678000190' });
  const previa = await prepararImportacao(db, await planilha(), contexto);
  assert.ok(previa.erros.some(e => e.includes('mais de um cadastro')));
});
test('CPF e e-mail não podem apontar para pessoas distintas', async () => {
  const { db, dados } = banco();
  dados.usuario.push({ idUsuario: 1, cpf: '01234567890', email: 'a@example.com' }, { idUsuario: 2, cpf: '98765432100', email: 'b@example.com' });
  const comEmail = [...linha]; comEmail[7] = 'b@example.com';
  const previa = await prepararImportacao(db, await planilha([comEmail]), contexto);
  assert.ok(previa.erros.some(e => e.includes('mais de um cadastro')));
});
test('dados conflitantes da unidade e fórmulas são sinalizados por linha', async () => {
  const outra = [...linha]; outra[4] = '98765432100'; outra[0] = 'Nome diferente';
  assert.ok((await planilha([linha, outra])).erros.some(e => e.includes('nomeFantasia diferente')));
  const formula = [...linha]; formula[3] = { formula: '1+1', result: 2 };
  assert.ok((await planilha([formula])).erros.some(e => e.includes('sem fórmula')));
});
test('prévia assinada rejeita adulteração, troca de usuário e alteração do cadastro', async () => {
  const { db } = banco(); const previa = await prepararImportacao(db, await planilha(), contexto);
  const ass = assinaturaImportacao(previa, contexto, 123, 'segredo');
  assert.ok(validarAssinatura(ass, ass)); assert.equal(validarAssinatura('bad', ass), false);
  assert.notEqual(ass, assinaturaImportacao(previa, { ...contexto, idUsuario: 100 }, 123, 'segredo'));
  previa.empresas[0].dados.razaoSocial = 'Adulterada';
  assert.equal(validarAssinatura(ass, assinaturaImportacao(previa, contexto, 123, 'segredo')), false);
});
test('usuário restrito não importa em empresa externa e precisa de permissões por operação', async () => {
  const { db } = banco();
  const modelo = await planilha();
  await assert.rejects(() => prepararImportacao(db, modelo, { ...contexto, roles: ['gestor'], fkEmpresaId: 20, permissoes: [] }), /Sem permissão/);
  const previa = await prepararImportacao(db, modelo, { ...contexto, roles: ['gestor'], fkEmpresaId: 1, permissoes: [] });
  assert.ok(previa.erros.some(e => e.includes('Sem permissão')));
});

test('três unidades com documentos distintos entram na empresa selecionada sem criar ou alterar empresas', async () => {
  const { db, dados } = banco();
  const empresaAntes = structuredClone(dados.empresa);
  const linhas = [0, 1, 2].map(i => {
    const row = [...linha]; row[0] = `Unidade ${i}`; row[4] = `0123456789${i}`;
    row[5] = `12345678000${i}90`; row[6] = `Razão da unidade ${i}`;
    row[8] = `77777777000${i}00`; row[9] = `Empresa da origem ${i}`;
    return row;
  });
  const previa = await prepararImportacao(db, await planilha(linhas), contexto);
  assert.deepEqual(previa.erros, []); assert.equal(previa.empresas.length, 1);
  assert.equal(previa.empresas[0].nome, 'Empresa selecionada');
  assert.equal(previa.resumo.unidade.criar, 3); assert.equal(previa.resumo.empresa, undefined);
  await gravarImportacao(db, previa, contexto);
  assert.deepEqual(dados.empresa, empresaAntes);
  assert.equal(dados.unidade.length, 3); assert.equal(dados.usuario.length, 3);
  assert.ok(dados.unidade.every(u => u.fkEmpresaId === 1));
  assert.ok(dados.usuario.every(u => u.fkEmpresaId === 1));
});

test('sem seleção, empresa inexistente ou inativa bloqueia inclusive administrador', async () => {
  const { db, dados } = banco();
  for (const valor of [undefined, null, 0, -1, '1', 1.5]) {
    assert.throws(() => validarEmpresaSelecionada({ ...contexto, empresaSelecionadaId: valor }), /Entre em uma empresa/);
    await assert.rejects(() => prepararImportacao(db, {}, { ...contexto, empresaSelecionadaId: valor }), /Entre em uma empresa/);
  }
  await assert.rejects(() => prepararImportacao(db, {}, { ...contexto, empresaSelecionadaId: 777 }), /não encontrada/);
  dados.empresa[0].ativo = 0;
  await assert.rejects(() => prepararImportacao(db, {}, contexto), /não encontrada/);
});

test('empresa do destino é parte da assinatura e confirmação recusa outra empresa', async () => {
  const { db } = banco(); const previa = await prepararImportacao(db, await planilha(), contexto);
  const outroContexto = { ...contexto, empresaSelecionadaId: 2 };
  assert.notEqual(assinaturaImportacao(previa, contexto, 123, 'segredo'), assinaturaImportacao(previa, outroContexto, 123, 'segredo'));
  await assert.rejects(() => gravarImportacao(db, previa, outroContexto), /empresa selecionada mudou/);
});

test('unidade de outra empresa não é atualizada mesmo com documento igual', async () => {
  const { db, dados } = banco();
  dados.unidade.push({ idUnidade: 10, fkEmpresaId: 2, documento: '12345678000190', nomeFantasia: 'Outra empresa' });
  const previa = await prepararImportacao(db, await planilha(), contexto);
  assert.equal(previa.resumo.unidade.criar, 1);
  await gravarImportacao(db, previa, contexto);
  assert.equal(dados.unidade[0].nomeFantasia, 'Outra empresa');
  assert.equal(dados.unidade[1].fkEmpresaId, 1);
});
test('arquivo inválido, cabeçalhos errados e planilha vazia são rejeitados', async () => {
  await assert.rejects(() => lerModelo1(Buffer.from('inválido')), /XLSX/);
  const w = new ExcelJS.Workbook(); w.addWorksheet('errada').addRow(['Nome']);
  await assert.rejects(() => w.xlsx.writeBuffer().then(b => lerModelo1(Buffer.from(b))), /colunas/);
  const vazia = await planilha([]); assert.ok(vazia.erros.some(e => e.includes('não contém')));
});

test('volume da captura: 3 unidades, 594 setores, 667 cargos e 1129 funcionários em lotes', async () => {
  const { db, dados, operacoes } = banco();
  const item = (tipo, chave, dados) => ({ tipo, chave, nome: dados.nome || dados.nomeFantasia || '', dados, linha: 3, filhos: [] });
  const raiz = item('empresa', 'empresa-selecionada', {});
  for (let i = 0; i < 3; i++) {
    const documento = `12345678000${i}90`;
    raiz.filhos.push(item('unidade', documento, { documento, nomeFantasia: `Unidade ${i}`, razaoSocial: `Unidade ${i}`, tipoDocumento: 'cnpj' }));
  }
  const setores = Array.from({ length: 594 }, (_, i) => {
    const setor = item('setor', `setor ${i}`, { nome: `Setor ${i}` }); raiz.filhos[i % 3].filhos.push(setor); return setor;
  });
  const cargos = Array.from({ length: 667 }, (_, i) => {
    const cargo = item('cargo', `cargo ${i}`, { nome: `Cargo ${i}` }); setores[i % 594].filhos.push(cargo); return cargo;
  });
  for (let i = 0; i < 1129; i++) {
    const cpf = String(i + 1).padStart(11, '0'); cargos[i % 667].filhos.push(item('funcionario', cpf, { nome: `Pessoa ${i}`, cpf }));
  }
  const modelo = { empresas: [raiz], erros: [], avisos: [], linhas: 1129, duplicadas: 0 };
  dados.unidade.push(...raiz.filhos.map((u, i) => ({ idUnidade: i + 1, fkEmpresaId: 1, ativo: 1, ...u.dados })));
  const previa = await prepararImportacao(db, modelo, contexto);
  assert.deepEqual(previa.erros, []);
  assert.equal(previa.resumo.unidade.atualizar, 3);
  await gravarImportacao(db, previa, contexto);
  assert.equal(dados.unidade.length, 3); assert.equal(dados.setor.length, 594);
  assert.equal(dados.cargo.length, 667); assert.equal(dados.usuario.length, 1129);
  assert.equal(dados.usuariorole.length, 1129); assert.equal(dados.usuariohorario.length, 7903);
  assert.ok(dados.usuario.every(u => dados.cargo.some(c => c.idCargo === u.fkCargoId)));
  assert.ok(dados.cargo.every(c => dados.setor.some(s => s.idSetor === c.fkSetorId)));
  assert.ok(operacoes.insercoes < 50, `Inserções em lotes: ${operacoes.insercoes}`);
  console.log(`Volume 1129: ${operacoes.insercoes} inserções em lotes, ${operacoes.leituras} consultas e ${operacoes.atualizacoes} atualizações individuais.`);
  const antes = { ...operacoes };
  const repetida = await prepararImportacao(db, structuredClone(modelo), contexto);
  await gravarImportacao(db, repetida, contexto);
  assert.equal(operacoes.insercoes, antes.insercoes);
  assert.equal(operacoes.atualizacoes, antes.atualizacoes);
  assert.equal(dados.usuario.length, 1129);
});

test('Firebase limita concorrência a 8 e aguarda tarefas iniciadas antes de compensar', async () => {
  const linhas = Array.from({ length: 30 }, (_, i) => { const row = [...linha]; row[4] = String(i + 1).padStart(11, '0'); return row; });
  const { db } = banco(); const modelo = await prepararImportacao(db, await planilha(linhas), contexto);
  let ativos = 0, maximo = 0, iniciados = 0;
  const removidas = [];
  await assert.rejects(() => comNovosAcessos(modelo, 'SenhaTeste123!', {
    createUser: async () => {
      const n = ++iniciados; ativos++; maximo = Math.max(maximo, ativos);
      await new Promise(resolve => setTimeout(resolve, n === 1 ? 1 : 15)); ativos--;
      if (n === 1) throw new Error('Falha simulada');
    },
    deleteUser: async uid => { assert.equal(ativos, 0); removidas.push(uid); },
  }, async () => assert.fail('Não deve gravar lote com falha Firebase'), async () => false, () => assert.fail('Sem falha na limpeza')), /Não foi possível criar/);
  assert.equal(maximo, 8); assert.equal(iniciados, 8); assert.equal(removidas.length, 8);
});
