import ExcelJS from 'exceljs';

export type Tipo = 'empresa' | 'unidade' | 'setor' | 'cargo' | 'funcionario';
export type Dados = Record<string, string | number>;
export interface ItemImportacao {
  chave: string;
  tipo: Tipo;
  nome: string;
  linha: number;
  dados: Dados;
  filhos: ItemImportacao[];
  id?: number;
  acao?: 'criar' | 'atualizar';
  atual?: Dados;
  configurarAcesso?: boolean;
  perfilPendente?: boolean;
  horariosPendentes?: boolean;
}
export interface ModeloImportacao {
  empresas: ItemImportacao[];
  erros: string[];
  avisos: string[];
  linhas: number;
  duplicadas: number;
}
export const normalizar = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLowerCase();
export const digitos = (v: string) => v.replace(/\D/g, '');
export const listar = (itens: ItemImportacao[]): ItemImportacao[] => itens.flatMap(i => [i, ...listar(i.filhos)]);

// Os nomes das colunas identificam o modelo, independentemente da ordem e da linha de título.
export async function lerModelo1(buffer: Buffer): Promise<ModeloImportacao> {
  const workbook = new ExcelJS.Workbook();
  try { await workbook.xlsx.load(buffer as never); } catch { throw new Error('Não foi possível ler o XLSX. Envie uma planilha válida, sem senha.'); }
  const resultado: ModeloImportacao = { empresas: [], erros: [], avisos: [], linhas: 0, duplicadas: 0 };
  const obrigatorias = ['Nome Unidade', 'Nome Setor', 'Nome Cargo', 'Nome Funcionário', 'CPF', 'CNPJ Unidade', 'Razão Social Unid.'];
  const candidatas: { sheet: ExcelJS.Worksheet; header: number; colunas: Map<string, number> }[] = [];
  for (const sheet of workbook.worksheets) {
    for (let n = 1; n <= Math.min(sheet.rowCount, 20); n++) {
      const colunas = new Map<string, number>();
      sheet.getRow(n).eachCell((cell, col) => colunas.set(normalizar(cell.text), col));
      if (obrigatorias.every(c => colunas.has(normalizar(c)))) { candidatas.push({ sheet, header: n, colunas }); break; }
    }
  }
  if (candidatas.length !== 1) throw new Error('Modelo 1: o arquivo deve conter exatamente uma aba com as colunas Nome Unidade, Nome Setor, Nome Cargo, Nome Funcionário, CPF, CNPJ Unidade e Razão Social Unid.');
  const { sheet, header, colunas } = candidatas[0];
  if (sheet.rowCount > 10002) throw new Error('Limite de 10.000 linhas por importação.');
  const funcionarios = new Map<string, ItemImportacao>();
  const emails = new Map<string, string>();
  const avisar = (texto: string) => { if (!resultado.avisos.includes(texto)) resultado.avisos.push(texto); };
  const juntar = (lista: ItemImportacao[], tipo: Tipo, chave: string, nome: string, dados: Dados, linha: number) => {
    let item = lista.find(i => i.chave === chave);
    if (!item) { item = { tipo, chave, nome, dados, linha, filhos: [] }; lista.push(item); }
    else for (const [campo, valor] of Object.entries(dados)) {
      if (item.dados[campo] !== undefined && normalizar(String(item.dados[campo])) !== normalizar(String(valor))) {
        resultado.erros.push(`Linha ${linha}: ${tipo} "${nome}" possui ${campo} diferente da linha ${item.linha}.`);
      } else item.dados[campo] = valor;
    }
    return item;
  };
  sheet.eachRow((row, linha) => {
    if (linha <= header) return;
    const get = (col: string) => {
      const index = colunas.get(normalizar(col));
      if (!index) return '';
      const cell = row.getCell(index);
      if (cell.type === ExcelJS.ValueType.Formula || cell.type === ExcelJS.ValueType.Error) {
        resultado.erros.push(`Linha ${linha}: a coluna ${col} deve conter um valor, sem fórmula ou erro.`);
        return '';
      }
      return cell.text.trim();
    };
    if (!['Nome Funcionário', 'CPF', 'Nome Unidade', 'Nome Setor', 'Nome Cargo'].some(c => get(c))) return;
    resultado.linhas++;
    const unidadeNome = get('Nome Unidade'), setorNome = get('Nome Setor'), cargoNome = get('Nome Cargo'), nome = get('Nome Funcionário');
    const cpf = digitos(get('CPF')).padStart(11, '0');
    const documentoUnidade = digitos(get('CNPJ Unidade') || get('CAEPF Unidade')).padStart(14, '0');
    const razaoSocial = get('Razão Social Unid.');
    if (!nome || !unidadeNome || !setorNome || !cargoNome || !razaoSocial || !/^\d{11}$/.test(cpf) || /^0+$/.test(cpf) || !/^\d{14}$/.test(documentoUnidade) || /^0+$/.test(documentoUnidade)) {
      resultado.erros.push(`Linha ${linha}: preencha nomes, razão social, CPF (11 dígitos) e CNPJ/CAEPF (14 dígitos).`); return;
    }
    const endereco: Dados = {};
    for (const [campo, coluna] of Object.entries({ endereco: 'Endereço Unidade', bairro: 'Bairro Unidade', cidade: 'Cidade Unidade', uf: 'Estado Unidade', cep: 'Cep Unidade', numero: 'Nº endereço Unidade', complemento: 'Complemento endereço Unidade' })) {
      const valor = get(coluna); if (valor && valor !== 'N/A') endereco[campo] = valor;
    }
    const tipoDocumento = get('CNPJ Unidade') ? 'cnpj' : 'caepf';
    // A raiz é somente um agrupador. A empresa de destino vem da seleção validada na API.
    const empresa = juntar(resultado.empresas, 'empresa', 'empresa-selecionada', '', {}, linha);
    const unidade = juntar(empresa.filhos, 'unidade', documentoUnidade, unidadeNome, { nomeFantasia: unidadeNome, razaoSocial: get('Razão Social Unid.') || razaoSocial, documento: documentoUnidade, tipoDocumento, ...endereco }, linha);
    const setor = juntar(unidade.filhos, 'setor', normalizar(setorNome), setorNome, { nome: setorNome }, linha);
    const descricao = get('Descrição Detalhada do Cargo');
    const cargo = juntar(setor.filhos, 'cargo', normalizar(cargoNome), cargoNome, { nome: cargoNome, ...(descricao ? { descricao } : {}) }, linha);
    const email = get('E-mail').toLowerCase(), telefone = digitos(get('Telefone Celular') || get('Telefone SMS') || get('Tel'));
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) resultado.erros.push(`Linha ${linha}: e-mail inválido.`);
    if (email && emails.has(email) && emails.get(email) !== cpf) resultado.erros.push(`Linha ${linha}: e-mail repetido para CPFs diferentes.`);
    if (email) emails.set(email, cpf);
    const dados: Dados = { nome, cpf, ...(email ? { email } : {}), ...(telefone ? { telefone } : {}) };
    // Situação do SOC não equivale ao indicador ativo do sistema (ex.: S = situação própria da origem).
    const antigo = funcionarios.get(cpf);
    if (antigo) {
      if (!cargo.filhos.includes(antigo) || JSON.stringify(antigo.dados) !== JSON.stringify(dados)) resultado.erros.push(`Linha ${linha}: CPF repetido com dados ou lotação diferentes da linha ${antigo.linha}.`);
      else resultado.duplicadas++;
      return;
    }
    const funcionario = juntar(cargo.filhos, 'funcionario', cpf, nome, dados, linha);
    funcionarios.set(cpf, funcionario);
  });
  if (!resultado.linhas) resultado.erros.push('A planilha não contém registros para importar.');
  for (const item of listar(resultado.empresas)) {
    const limites: Record<string, number> = { nome: 250, nomeFantasia: 255, razaoSocial: 255, email: 250, endereco: 250, bairro: 250, cidade: 250, uf: 2, cep: 10, numero: 10, complemento: 50 };
    for (const [campo, valor] of Object.entries(item.dados)) if (limites[campo] && String(valor).length > limites[campo]) resultado.erros.push(`Linha ${item.linha}: ${campo} de ${item.tipo} excede ${limites[campo]} caracteres.`);
  }
  avisar('Somente os campos disponíveis no cadastro serão importados. Campos vazios preservam valores existentes; situação, permissões, horários e vínculos com treinamentos não são alterados.');
  avisar('Todas as unidades serão vinculadas à empresa selecionada. Os campos CNPJ e Razão Social da empresa na planilha são ignorados; o cadastro da empresa não será alterado.');
  if (resultado.duplicadas) avisar(`${resultado.duplicadas} linha(s) idêntica(s) repetida(s) serão importadas uma única vez.`);
  return resultado;
}
