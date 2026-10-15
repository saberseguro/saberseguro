import { Prisma } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'crypto';
import { digitos, normalizar, listar, ItemImportacao, ModeloImportacao, Tipo, Dados } from './modelo1';
import { InformarProgresso, lotes } from './progressoImportacao';

type Banco = Pick<Prisma.TransactionClient, 'empresa' | 'unidade' | 'setor' | 'cargo' | 'usuario' | 'logevento' | 'usuariorole' | 'usuariohorario'>;
type Registro = Record<string, unknown>;
export type ContextoImportacao = { idUsuario: number; roles: string[]; permissoes: string[]; fkEmpresaId?: number; empresaSelecionadaId: number };
export const tipos: Tipo[] = ['unidade', 'setor', 'cargo', 'funcionario'];
const ids: Record<Tipo, string> = { empresa: 'idEmpresa', unidade: 'idUnidade', setor: 'idSetor', cargo: 'idCargo', funcionario: 'idUsuario' };
const tabelas = { empresa: 'empresa', unidade: 'unidade', setor: 'setor', cargo: 'cargo', funcionario: 'usuario' } as const;
const pais: Record<Tipo, string> = { empresa: '', unidade: 'fkEmpresaId', setor: 'fkUnidadeId', cargo: 'fkSetorId', funcionario: 'fkCargoId' };

export function resumo(modelo: ModeloImportacao) {
  const itens = listar(modelo.empresas);
  return Object.fromEntries(tipos.map(tipo => [tipo, {
    total: itens.filter(i => i.tipo === tipo).length,
    criar: itens.filter(i => i.tipo === tipo && i.acao === 'criar').length,
    atualizar: itens.filter(i => i.tipo === tipo && i.acao === 'atualizar').length,
  }]));
}

export function validarEmpresaSelecionada(contexto: ContextoImportacao) {
  if (!Number.isSafeInteger(contexto.empresaSelecionadaId) || contexto.empresaSelecionadaId <= 0) throw new Error('Entre em uma empresa antes de importar dados.');
  if (!contexto.roles.includes('admin') && contexto.fkEmpresaId !== contexto.empresaSelecionadaId) throw new Error('Sem permissão para importar nesta empresa.');
}

export async function prepararImportacao(db: Banco, modelo: ModeloImportacao, contexto: ContextoImportacao) {
  validarEmpresaSelecionada(contexto);
  const empresas = await db.empresa.findMany({ where: { idEmpresa: contexto.empresaSelecionadaId, ativo: 1 } });
  if (empresas.length !== 1) throw new Error('Empresa selecionada não encontrada ou inativa. Selecione uma empresa ativa antes de importar.');
  const destino = empresas[0];
  for (const raiz of modelo.empresas) {
    raiz.id = destino.idEmpresa;
    raiz.chave = String(destino.idEmpresa);
    raiz.nome = destino.nomeFantasia || destino.razaoSocial;
    raiz.dados = { razaoSocial: destino.razaoSocial, documento: destino.documento };
    delete raiz.acao;
    delete raiz.atual;
  }
  // Sem filtro de ativo: registros inativos também são reconhecidos e preservados.
  const empresaIds = empresas.map(e => e.idEmpresa);
  const unidades = await db.unidade.findMany({ where: { fkEmpresaId: { in: empresaIds } } });
  const setores = await db.setor.findMany({ where: { fkUnidadeId: { in: unidades.map(u => u.idUnidade) } } });
  const cargos = await db.cargo.findMany({ where: { fkSetorId: { in: setores.map(s => s.idSetor) } } });
  // CPF/e-mail são únicos globalmente; conflitos externos não revelam dados de outras empresas.
  const funcionariosPlanilha = listar(modelo.empresas).filter(i => i.tipo === 'funcionario');
  const usuariosPorId = new Map<number, Registro>();
  for (const lote of lotes(funcionariosPlanilha, 500)) {
    const usuarios = await db.usuario.findMany({
      where: { OR: [{ cpf: { in: lote.map(i => i.chave) } }, { email: { in: lote.map(i => i.dados.email).filter((v): v is string => typeof v === 'string' && !!v) } }] },
      select: { idUsuario: true, nome: true, cpf: true, email: true, telefone: true, fkEmpresaId: true, fkCargoId: true, firebaseId: true, ativo: true, editado_em: true, usuariorole: true, usuariohorario: true },
    });
    usuarios.forEach(u => usuariosPorId.set(u.idUsuario, u));
  }
  const usuarios = [...usuariosPorId.values()];
  const registros: Record<Tipo, Registro[]> = { empresa: empresas, unidade: unidades, setor: setores, cargo: cargos, funcionario: usuarios };
  const indice = new Map<string, Registro[]>();
  const indexar = (chave: string, registro: Registro) => { const lista = indice.get(chave) ?? []; lista.push(registro); indice.set(chave, lista); };
  for (const tipo of tipos) for (const r of registros[tipo]) {
    if (tipo === 'funcionario') {
      if (r.cpf) indexar(`cpf:${digitos(String(r.cpf))}`, r);
      if (r.email) indexar(`email:${String(r.email).toLowerCase()}`, r);
    } else indexar(`${tipo}:${r[pais[tipo]]}:${tipo === 'unidade' ? digitos(String(r.documento)) : normalizar(String(r.nome))}`, r);
  }
  const usados = new Set<string>();
  const visitar = (item: ItemImportacao, pai?: ItemImportacao, empresa?: ItemImportacao) => {
    if (item.tipo === 'empresa') throw new Error('A importação não permite criar ou atualizar empresas.');
    let encontrados: Registro[];
    if (item.tipo === 'funcionario') encontrados = [...new Set([...(indice.get(`cpf:${item.chave}`) ?? []), ...(item.dados.email ? indice.get(`email:${item.dados.email}`) ?? [] : [])])];
    else encontrados = pai?.id ? indice.get(`${item.tipo}:${pai.id}:${item.chave}`) ?? [] : [];
    if (encontrados.length > 1) modelo.erros.push(`Linha ${item.linha}: mais de um cadastro corresponde a ${item.tipo} "${item.nome}". Resolva a duplicidade no sistema.`);
    const atual = encontrados.length === 1 ? encontrados[0] : undefined;
    if (item.tipo === 'funcionario' && atual && (atual.fkEmpresaId !== empresa?.id || (atual.cpf && digitos(String(atual.cpf)) !== item.chave))) {
      modelo.erros.push(`Linha ${item.linha}: CPF ou e-mail já vinculado a outro cadastro ou empresa. Revise os dados.`);
      return;
    }
    item.acao = atual ? 'atualizar' : 'criar';
    if (item.tipo === 'funcionario') {
      item.configurarAcesso = !atual?.firebaseId;
      item.perfilPendente = item.configurarAcesso && !(atual?.usuariorole as unknown[] | undefined)?.length;
      item.horariosPendentes = item.configurarAcesso && !(atual?.usuariohorario as unknown[] | undefined)?.length;
    }
    if (atual) {
      item.id = Number(atual[ids[item.tipo]]);
      const chave = `${item.tipo}:${item.id}`;
      if (usados.has(chave)) modelo.erros.push(`Linha ${item.linha}: duas entradas correspondem ao mesmo cadastro no sistema.`);
      usados.add(chave);
      item.atual = {};
      const campos = new Set([...Object.keys(item.dados), 'ativo', 'editado_em', ...(item.tipo === 'funcionario' ? ['fkCargoId', 'email', 'telefone'] : [])]);
      for (const campo of campos) if (atual[campo] != null) item.atual[campo] = atual[campo] instanceof Date ? (atual[campo] as Date).toISOString() : String(atual[campo]);
      if (item.tipo === 'funcionario' && atual.firebaseId && item.dados.email && item.dados.email !== atual.email) {
        modelo.erros.push(`Linha ${item.linha}: e-mail diferente do acesso existente. Altere o acesso antes de importar ou mantenha o e-mail atual na planilha.`);
      }
    }
    const permissao = `${item.acao === 'criar' ? 'criar' : 'editar'}_${item.tipo === 'funcionario' ? 'usuarios' : 'empresas'}`;
    if (!contexto.permissoes.includes(permissao)) modelo.erros.push(`Sem permissão para ${item.acao} ${item.tipo}: ${item.nome}.`);
    item.filhos.forEach(filho => visitar(filho, item, empresa));
  };
  modelo.empresas.forEach(e => e.filhos.forEach(unidade => visitar(unidade, e, e)));
  const acessosNovos = listar(modelo.empresas).filter(i => i.configurarAcesso).length;
  if (acessosNovos) modelo.avisos.push(`${acessosNovos} funcionário(s) receberão acesso com a senha inicial informada e troca obrigatória no primeiro login. Sem e-mail, entrarão por CPF. Perfil funcionário e horários serão adicionados somente quando ainda não existirem. Senhas de contas existentes serão preservadas.`);
  return { ...modelo, resumo: resumo(modelo), acessosNovos };
}

export function assinaturaImportacao(modelo: ModeloImportacao, contexto: ContextoImportacao, expira: number, segredo: string) {
  return createHmac('sha256', segredo).update(JSON.stringify({ modelo, usuario: contexto.idUsuario, empresa: contexto.empresaSelecionadaId, expira })).digest('hex');
}
export function validarAssinatura(recebida: unknown, esperada: string) {
  return typeof recebida === 'string' && /^[a-f0-9]{64}$/.test(recebida) && timingSafeEqual(Buffer.from(recebida, 'hex'), Buffer.from(esperada, 'hex'));
}

export interface AcessosImportacao {
  contas: Map<string, string>;
  idRole?: number;
  horarioInicio: string;
  horarioFim: string;
}

export async function gravarImportacao(db: Banco, modelo: ModeloImportacao, contexto: ContextoImportacao, acessos: AcessosImportacao, informar: InformarProgresso = () => {}) {
  validarEmpresaSelecionada(contexto);
  if (modelo.empresas.length !== 1 || modelo.empresas[0].id !== contexto.empresaSelecionadaId) throw new Error('A empresa selecionada mudou. Gere uma nova prévia.');
  const contagens = resumo(modelo);
  const total = listar(modelo.empresas).length - 1;
  let concluidos = 0;
  const idsGravados = new Map<ItemImportacao, number>();
  idsGravados.set(modelo.empresas[0], contexto.empresaSelecionadaId);
  let nivel = modelo.empresas[0].filhos.map(item => ({ item, pai: modelo.empresas[0] }));
  const funcionarios: ItemImportacao[] = [];
  informar({ fase: 'banco', concluidos, total, mensagem: 'Gravando cadastros em lotes' });
  for (const tipo of ['unidade', 'setor', 'cargo', 'funcionario'] as const) {
    if (nivel.some(({ item }) => item.tipo !== tipo)) throw new Error('Estrutura de importação inválida.');
    const delegate = db[tabelas[tipo]] as unknown as {
      update(args: { where: Record<string, number>; data: Record<string, unknown> }): Promise<Registro>;
      createMany(args: { data: Record<string, unknown>[] }): Promise<{ count: number }>;
      findMany(args: { where: Record<string, unknown> }): Promise<Registro[]>;
    };
    const novos: { item: ItemImportacao; paiId: number; data: Record<string, unknown> }[] = [];
    for (const { item, pai } of nivel) {
      const paiId = idsGravados.get(pai);
      if (!paiId) throw new Error('Vínculo pai não encontrado durante a importação.');
      const data: Record<string, unknown> = { ...item.dados, [pais[tipo]]: paiId };
      if (tipo === 'funcionario') { data.fkEmpresaId = contexto.empresaSelecionadaId; funcionarios.push(item); }
      if (item.configurarAcesso) {
        const uid = acessos.contas.get(item.chave);
        if (!uid) throw new Error(`Acesso não provisionado para o funcionário da linha ${item.linha}.`);
        data.firebaseId = uid; data.trocarsenha = true;
      }
      if (item.id) {
        // Pais de unidades/setores/cargos já foram conferidos na prévia; evita UPDATE sem mudança.
        const alterado = item.configurarAcesso || Object.entries(item.dados).some(([campo, valor]) => String(item.atual?.[campo] ?? '') !== String(valor))
          || (tipo === 'funcionario' && String(item.atual?.fkCargoId) !== String(paiId));
        if (alterado) await delegate.update({ where: { [ids[tipo]]: item.id }, data: { ...data, editado_em: new Date() } });
        idsGravados.set(item, item.id);
        informar({ fase: 'banco', concluidos: ++concluidos, total, mensagem: `Atualizando ${tipo}` });
      } else {
        const defaults = tipo === 'unidade' ? { nomeFantasia: item.nome, cep: '', endereco: '', bairro: '', cidade: '', uf: '' }
          : tipo === 'setor' || tipo === 'cargo' ? { descricao: '' } : { email: null, firebaseId: null };
        novos.push({ item, paiId, data: { ...defaults, ...data } });
      }
    }
    for (const lote of lotes(novos)) {
      // Sem skipDuplicates: conflito deve reverter a transação, nunca omitir registros.
      await delegate.createMany({ data: lote.map(n => n.data) });
      const where = tipo === 'funcionario' ? { cpf: { in: lote.map(n => n.item.chave) }, fkEmpresaId: contexto.empresaSelecionadaId }
        : { [pais[tipo]]: { in: [...new Set(lote.map(n => n.paiId))] } };
      const registros = await delegate.findMany({ where });
      const indice = new Map<string, Registro[]>();
      for (const r of registros) {
        const chave = tipo === 'funcionario' ? String(r.cpf) : `${r[pais[tipo]]}:${tipo === 'unidade' ? digitos(String(r.documento)) : normalizar(String(r.nome))}`;
        const lista = indice.get(chave) ?? []; lista.push(r); indice.set(chave, lista);
      }
      for (const n of lote) {
        const chave = tipo === 'funcionario' ? n.item.chave : `${n.paiId}:${n.item.chave}`;
        const registros = indice.get(chave);
        if (registros?.length !== 1) throw new Error('Conflito ao vincular os cadastros importados. Gere uma nova prévia.');
        idsGravados.set(n.item, Number(registros[0][ids[tipo]]));
      }
      concluidos += lote.length;
      informar({ fase: 'banco', concluidos, total, mensagem: `Gravando ${tipo} em lotes` });
    }
    nivel = nivel.flatMap(({ item }) => item.filhos.map(filho => ({ item: filho, pai: item })));
  }
  if (nivel.length) throw new Error('Estrutura de importação inválida.');
  const perfis = funcionarios.filter(f => f.perfilPendente).map(f => ({ fkUsuarioId: idsGravados.get(f)!, fkRoleId: acessos.idRole! }));
  if (perfis.length && !acessos.idRole) throw new Error('Perfil funcionário não encontrado.');
  informar({ fase: 'banco', concluidos, total, mensagem: 'Gravando perfis e horários de acesso' });
  for (const lote of lotes(perfis)) await db.usuariorole.createMany({ data: lote });
  const horarios = funcionarios.filter(f => f.horariosPendentes).flatMap(f => Array.from({ length: 7 }, (_, diaSemana) => ({
    fkUsuarioId: idsGravados.get(f)!, diaSemana, horarioInicio: acessos.horarioInicio, horarioFim: acessos.horarioFim, permitido: true,
  })));
  for (const lote of lotes(horarios, 700)) await db.usuariohorario.createMany({ data: lote });
  await db.logevento.create({ data: { fkUsuarioId: contexto.idUsuario, tipo: 'importar', entidade: 'importacao', descricao: `Importação Modelo 1 na empresa ${contexto.empresaSelecionadaId}`, dados_depois: JSON.stringify(contagens) } });
  return contagens;
}
