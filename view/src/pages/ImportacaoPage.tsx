import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, FileSpreadsheet, Upload, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { apiFetch } from '../services/apiFetch';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import ModalSelecionarEmpresa from '../components/Modais/ModalSelecionarEmpresa';
import { consultarImportacao, type ProcessoImportacao } from '../services/apiImportacao';

type Tipo = 'empresa' | 'unidade' | 'setor' | 'cargo' | 'funcionario';
type Dados = Record<string, string | number>;
interface Item { chave: string; tipo: Tipo; nome: string; linha: number; dados: Dados; filhos: Item[]; id?: number; acao: 'criar' | 'atualizar'; atual?: Dados }
type Resumo = Record<Tipo, { total: number; criar: number; atualizar: number }>;
interface Previa { empresas: Item[]; erros: string[]; avisos: string[]; resumo: Resumo; linhas: number; duplicadas: number; assinatura: string; expira: number; acessosNovos: number }
const labels = { unidade: 'Unidades', setor: 'Setores', cargo: 'Cargos', funcionario: 'Funcionários' };
const botao = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
const principal = `${botao} bg-sky-700 text-white hover:bg-sky-800`;
const secundario = `${botao} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`;
const campos: Record<string, string> = { nome: 'Nome', nomeFantasia: 'Nome fantasia', razaoSocial: 'Razão social', documento: 'Documento', tipoDocumento: 'Tipo de documento', cpf: 'CPF', email: 'E-mail', telefone: 'Telefone', endereco: 'Endereço', bairro: 'Bairro', cidade: 'Cidade', uf: 'UF', cep: 'CEP', numero: 'Número', complemento: 'Complemento', descricao: 'Descrição' };

function Estado({ item }: { item: Item }) {
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${item.acao === 'atualizar' ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>
    {item.acao === 'atualizar' ? `Já cadastrado · atualizar #${item.id}` : 'Não cadastrado · criar'}
  </span>;
}
function Detalhes({ item }: { item: Item }) {
  return <details className="mt-2 text-sm"><summary className="cursor-pointer text-sky-700">Conferir dados {item.id ? 'e cadastro atual' : 'da planilha'}</summary>
    <div className="mt-2 overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="bg-gray-50"><th className="p-2">Campo</th><th className="p-2">No sistema</th><th className="p-2">Após importar</th></tr></thead>
      <tbody>{Object.entries(item.dados).map(([campo, valor]) => <tr key={campo} className="border-t border-gray-100"><th className="p-2 font-medium">{campos[campo] || campo}</th><td className="p-2 whitespace-pre-wrap">{item.atual?.[campo] ?? '—'}</td><td className="p-2 whitespace-pre-wrap">{valor}</td></tr>)}</tbody></table></div>
    {item.atual?.ativo === '0' && <p className="mt-2 text-amber-800">Cadastro inativo: continuará inativo.</p>}
  </details>;
}
function Contagens({ resumo }: { resumo: Resumo }) {
  return <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{(Object.keys(labels) as (keyof typeof labels)[]).map(tipo => <div key={tipo} className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-sm text-gray-500">{labels[tipo]}</p><p className="my-1 text-2xl font-semibold text-gray-900">{resumo[tipo].total}</p><p className="text-xs text-emerald-700">{resumo[tipo].criar} a criar</p><p className="mt-1 text-xs text-amber-700">{resumo[tipo].atualizar} a atualizar</p></div>)}</div>;
}

export default function ImportacaoPage() {
  const { user } = useAuth();
  const { companyId, selectedCompany } = useCompany();
  const [selecionarEmpresa, setSelecionarEmpresa] = useState(false);
  if (!['ver_empresas', 'ver_usuarios', 'editar_empresas'].every(p => user?.permissoes.includes(p))) return <div className="rounded-xl bg-white p-6">Você não tem permissão para importar dados.</div>;
  if (!companyId) return <div className="mx-auto max-w-3xl p-5">
    <section className="rounded-xl border border-gray-200 bg-white p-8">
      <h1 className="text-2xl font-semibold text-gray-900">Selecione uma empresa para importar</h1>
      <p className="mt-3 text-gray-600">Entre em uma empresa antes de enviar a planilha. As unidades, setores, cargos e funcionários serão importados para a empresa selecionada.</p>
      <button className={`${principal} mt-6`} onClick={() => setSelecionarEmpresa(true)}>Selecionar empresa</button>
    </section>
    <ModalSelecionarEmpresa open={selecionarEmpresa} onClose={() => setSelecionarEmpresa(false)} />
  </div>;
  // Trocar ou sair da empresa descarta o arquivo, a prévia e a confirmação anteriores.
  return <ImportacaoEmpresa key={companyId} empresaId={companyId} empresaNome={selectedCompany?.nomeFantasia || selectedCompany?.razaoSocial || user?.empresa?.nomeFantasia || user?.empresa?.razaoSocial || `Empresa #${companyId}`} />;
}

function ImportacaoEmpresa({ empresaId, empresaNome }: { empresaId: number; empresaNome: string }) {
  const { user } = useAuth();
  const [etapa, setEtapa] = useState(1);
  const [modelo, setModelo] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [base64, setBase64] = useState('');
  const [previa, setPrevia] = useState<Previa | null>(null);
  const [unidadeAtiva, setUnidadeAtiva] = useState(0);
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const chaveProcesso = `importacao:${user?.idUsuario}:${empresaId}`;
  const [processoId, setProcessoId] = useState<string | null>(() => sessionStorage.getItem(chaveProcesso));
  const [processo, setProcesso] = useState<ProcessoImportacao<Resumo> | null>(null);
  const [consultandoProcesso, setConsultandoProcesso] = useState(true);
  const [tentativaConsulta, setTentativaConsulta] = useState(0);
  const trava = useRef(false);
  const [confirmado, setConfirmado] = useState(false);
  const [senhaInicial, setSenhaInicial] = useState('');
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('');
  const [horarioInicio, setHorarioInicio] = useState('00:00');
  const [horarioFim, setHorarioFim] = useState('23:59');
  const acessoValido = !previa?.acessosNovos || (senhaInicial.length >= 8 && senhaInicial.length <= 128 && senhaInicial === confirmacaoSenha && !!horarioInicio && horarioInicio < horarioFim);
  const [resultado, setResultado] = useState<Resumo | null>(null);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const permitido = ['ver_empresas', 'ver_usuarios', 'editar_empresas'].every(p => user?.permissoes.includes(p));
  const unidades = previa?.empresas.flatMap(empresa => empresa.filhos.map(unidade => ({ empresa, unidade }))) ?? [];
  const selecionada = unidades[unidadeAtiva];
  useEffect(() => {
    let cancelado = false;
    let timer: ReturnType<typeof setTimeout>;
    const consultar = async () => {
      try {
        const atual = await consultarImportacao<Resumo>(empresaId, processoId);
        if (cancelado) return;
        setConsultandoProcesso(false);
        if (!atual) {
          if (processoId) {
            sessionStorage.removeItem(chaveProcesso); setProcessoId(null);
            setErro('O processo não está mais disponível. Se a API foi reiniciada, gere uma nova prévia e confira os cadastros antes de tentar novamente.');
          }
          setOcupado(false); trava.current = false; return;
        }
        setProcesso(atual);
        if (!processoId) {
          sessionStorage.setItem(chaveProcesso, atual.id); setProcessoId(atual.id);
          setOcupado(true); trava.current = true; return;
        }
        if (atual.status === 'executando') {
          setOcupado(true); trava.current = true; setErro('');
          timer = setTimeout(consultar, 1500);
        } else {
          sessionStorage.removeItem(chaveProcesso);
          setOcupado(false); trava.current = false;
          if (atual.status === 'concluido' && atual.resultado) {
            setResultado(atual.resultado); setBase64(''); setPrevia(null); setArquivo(null); setSenhaInicial(''); setConfirmacaoSenha('');
          } else { setErro(atual.erro || 'Não foi possível concluir a importação.'); setConfirmado(false); }
        }
      } catch (e) {
        if (cancelado) return;
        setErro(e instanceof Error ? e.message : 'Não foi possível consultar a importação.');
        setConsultandoProcesso(true);
        timer = setTimeout(consultar, 5000);
      }
    };
    void consultar();
    return () => { cancelado = true; clearTimeout(timer); };
  }, [empresaId, processoId, chaveProcesso, tentativaConsulta]);
  const lerArquivo = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsDataURL(file);
  });
  const gerarPrevia = async () => {
    if (!arquivo || trava.current || consultandoProcesso) return;
    trava.current = true; setOcupado(true); setErro(''); setConfirmado(false);
    try {
      const conteudo = await lerArquivo(arquivo);
      const dados = await apiFetch<Previa>('/importacao/previa', { method: 'POST', body: JSON.stringify({ empresaId, modelo, nomeArquivo: arquivo.name, arquivo: conteudo }) });
      setBase64(conteudo); setPrevia(dados); setUnidadeAtiva(0); setEtapa(3); setBusca(''); setFiltro('todos');
    } catch (e) { setErro(e instanceof Error ? e.message : 'Erro ao analisar arquivo.'); }
    finally { trava.current = false; setOcupado(false); }
  };
  const importar = async () => {
    if (!previa || !confirmado || previa.erros.length || trava.current || !acessoValido || consultandoProcesso) return;
    trava.current = true; setOcupado(true); setErro('');
    try {
      const res = await apiFetch<ProcessoImportacao<Resumo>>('/importacao/confirmar', { method: 'POST', body: JSON.stringify({ empresaId, modelo, nomeArquivo: arquivo?.name, arquivo: base64, assinatura: previa.assinatura, expira: previa.expira, ...(previa.acessosNovos ? { senhaInicial, horarioInicio, horarioFim } : {}) }) });
      sessionStorage.setItem(chaveProcesso, res.id); setProcesso(res); setProcessoId(res.id); setTentativaConsulta(n => n + 1);
      setSenhaInicial(''); setConfirmacaoSenha('');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao iniciar importação.'); setConfirmado(false);
      // Uma resposta perdida não significa que o servidor deixou de iniciar o trabalho.
      setConsultandoProcesso(true); setProcessoId(null); setTentativaConsulta(n => n + 1);
    }
  };
  const escolherArquivo = (file?: File) => {
    setErro(''); setPrevia(null); setBase64(''); setConfirmado(false); setSenhaInicial(''); setConfirmacaoSenha('');
    if (!file) { setArquivo(null); return; }
    if (!/\.xlsx$/i.test(file.name) || file.size > 10 * 1024 * 1024 || file.size === 0) { setArquivo(null); setErro('Selecione um arquivo .xlsx válido de até 10 MB.'); return; }
    setArquivo(file);
  };
  if (!permitido) return <div className="rounded-xl bg-white p-6">Você não tem permissão para importar dados.</div>;
  if (resultado) return <div className="mx-auto max-w-6xl space-y-6 p-2 sm:p-5"><div className="rounded-xl border border-emerald-200 bg-white p-8"><CheckCircle2 className="mb-4 text-emerald-600" size={36} /><h1 className="text-2xl font-semibold">Importação concluída</h1><p className="mt-2 text-gray-600">Os cadastros foram criados ou atualizados com seus vínculos de empresa, unidade, setor e cargo.</p><p className="mt-2 text-sm text-gray-500">Os novos acessos podem entrar por CPF e senha inicial, respeitando os horários configurados. A troca de senha será solicitada no primeiro login. Contas existentes mantêm sua senha.</p></div><Contagens resumo={resultado} /><button className={principal} onClick={() => { setResultado(null); setEtapa(1); setModelo(''); setConfirmado(false); }}>Nova importação</button></div>;
  return <div className="mx-auto max-w-7xl space-y-6 p-2 sm:p-5">
    <header><h1 className="text-2xl font-semibold text-gray-900">Importar dados</h1><p className="mt-1 text-sm text-gray-500">Importe unidades, setores, cargos e funcionários para a empresa selecionada.</p><p className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">Empresa de destino: <strong>{empresaNome}</strong> · #{empresaId}</p></header>
    <ol className="grid grid-cols-3 gap-2 rounded-xl border border-gray-200 bg-white p-4">{['Selecionar modelo', 'Enviar planilha', 'Revisar e importar'].map((texto, i) => <li key={texto} aria-current={etapa === i + 1 ? 'step' : undefined} className={`flex items-center gap-2 text-sm ${etapa === i + 1 ? 'font-semibold text-sky-800' : 'text-gray-500'}`}><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${etapa >= i + 1 ? 'bg-sky-700 text-white' : 'bg-gray-100'}`}>{etapa > i + 1 ? <CheckCircle2 size={18} /> : i + 1}</span><span>{texto}</span></li>)}</ol>
    {erro && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{erro}</div>}
    {consultandoProcesso && <p role="status" className="text-sm text-sky-800">Consultando andamento da importação…</p>}
    {processo?.status === 'executando' && <section aria-live="polite" className="rounded-xl border border-sky-200 bg-white p-5">
      <div className="flex items-center gap-3"><Loader2 className="animate-spin text-sky-700" size={20} /><h2 className="font-semibold">{processo.progresso.mensagem}</h2></div>
      {processo.progresso.total > 0 && <><p className="mt-3 text-sm text-gray-600">{processo.progresso.concluidos.toLocaleString('pt-BR')} de {processo.progresso.total.toLocaleString('pt-BR')} nesta etapa</p><progress aria-label="Progresso da etapa de importação" className="mt-2 h-3 w-full accent-sky-700" value={processo.progresso.concluidos} max={processo.progresso.total} /></>}
      <p className="mt-3 text-xs text-gray-500">O processamento continua no servidor. Ao atualizar esta página, o acompanhamento será retomado. Aguarde a conclusão antes de iniciar outro lote.</p>
    </section>}
    {etapa === 1 && <section className="rounded-xl border border-gray-200 bg-white p-6"><h2 className="text-lg font-semibold">Qual modelo deseja importar?</h2><label className={`mt-5 flex max-w-xl cursor-pointer gap-4 rounded-xl border-2 p-5 ${modelo ? 'border-sky-600 bg-sky-50' : 'border-gray-200'}`}><input type="radio" name="modelo" value="modelo1" checked={modelo === 'modelo1'} onChange={() => setModelo('modelo1')} className="mt-1" /><FileSpreadsheet className="shrink-0 text-sky-700" /><span><strong className="block">Modelo 1</strong><span className="mt-1 block text-sm text-gray-600">Planilha com unidades, setores, cargos e funcionários para a empresa selecionada. Identificação por CNPJ/CAEPF e CPF.</span></span></label><div className="mt-6 flex justify-end"><button disabled={!modelo || ocupado || consultandoProcesso} className={principal} onClick={() => setEtapa(2)}>Continuar <ArrowRight size={16} /></button></div></section>}
    {etapa === 2 && <section className="rounded-xl border border-gray-200 bg-white p-6"><h2 className="text-lg font-semibold">Envie a planilha do Modelo 1</h2><p className="mt-2 text-sm text-gray-500">Mantenha os cabeçalhos da planilha original. Limite de 10 MB e 10.000 linhas.</p><label onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (!ocupado) escolherArquivo(e.dataTransfer.files[0]); }} className="mt-5 flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-10 text-center"><Upload size={32} className="text-sky-700" /><span className="font-medium">{arquivo ? arquivo.name : 'Arraste o arquivo ou selecione uma planilha'}</span><span className="text-xs text-gray-500">Arquivo Excel (.xlsx){arquivo ? ` · ${(arquivo.size / 1024).toFixed(1)} KB` : ''}</span><input aria-label="Planilha XLSX" type="file" accept=".xlsx" disabled={ocupado || consultandoProcesso} onChange={e => escolherArquivo(e.target.files?.[0])} className="max-w-full text-sm" /></label><div className="mt-6 flex justify-between gap-3"><button disabled={ocupado || consultandoProcesso} className={secundario} onClick={() => setEtapa(1)}><ArrowLeft size={16} /> Voltar</button><button disabled={!arquivo || ocupado || consultandoProcesso} className={principal} onClick={gerarPrevia}>{ocupado ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}{ocupado ? 'Analisando cadastros…' : 'Gerar prévia'}</button></div></section>}
    {etapa === 3 && previa && <>
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-gray-600">{arquivo?.name} · {previa.linhas} linhas · {previa.duplicadas} repetições agrupadas</p><button disabled={ocupado || consultandoProcesso} className={secundario} onClick={gerarPrevia}>Atualizar prévia</button></div>
      <Contagens resumo={previa.resumo} />
      {previa.acessosNovos > 0 && <section className="rounded-xl border border-sky-200 bg-white p-5">
        <h2 className="font-semibold">Configurar {previa.acessosNovos} novo(s) acesso(s)</h2>
        <p className="mt-2 text-sm text-gray-600">A senha inicial será usada somente por funcionários sem acesso configurado. Eles deverão alterá-la no primeiro login. Quem não tiver e-mail poderá entrar com CPF.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">Senha inicial<input type="password" autoComplete="new-password" minLength={8} maxLength={128} disabled={ocupado || consultandoProcesso} value={senhaInicial} onChange={e => { setSenhaInicial(e.target.value); setConfirmado(false); }} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2" /><span className="text-xs text-gray-500">De 8 a 128 caracteres. Entregue a senha aos funcionários.</span></label>
          <label className="text-sm">Confirmar senha inicial<input type="password" autoComplete="new-password" disabled={ocupado || consultandoProcesso} value={confirmacaoSenha} onChange={e => { setConfirmacaoSenha(e.target.value); setConfirmado(false); }} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2" /></label>
          <label className="text-sm">Início do horário de acesso<input type="time" disabled={ocupado || consultandoProcesso} value={horarioInicio} onChange={e => { setHorarioInicio(e.target.value); setConfirmado(false); }} className="mt-1 block rounded-lg border border-gray-300 px-3 py-2" /></label>
          <label className="text-sm">Fim do horário de acesso<input type="time" disabled={ocupado || consultandoProcesso} value={horarioFim} onChange={e => { setHorarioFim(e.target.value); setConfirmado(false); }} className="mt-1 block rounded-lg border border-gray-300 px-3 py-2" /></label>
        </div>
        <p className="mt-3 text-xs text-gray-500">Perfil funcionário e horário acima em todos os dias da semana, somente para cadastros que ainda não tenham essas configurações. Horários e perfis existentes serão preservados.</p>
      </section>}
      {!!previa.erros.length && <section role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><h2 className="font-semibold">Corrija {previa.erros.length} problema(s) antes de importar</h2><ul className="mt-2 max-h-60 list-disc overflow-y-auto pl-5">{previa.erros.map((msg, i) => <li key={i}>{msg}</li>)}</ul></section>}
      <details className="rounded-xl border border-sky-100 bg-sky-50 p-4 text-sm" open><summary className="cursor-pointer font-medium text-sky-900">Regras e observações desta importação</summary><ul className="mt-2 list-disc space-y-1 pl-5 text-sky-900">{previa.avisos.map((msg, i) => <li key={i}>{msg}</li>)}</ul></details>
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div role="tablist" aria-label="Unidades da planilha" className="flex gap-1 overflow-x-auto border-b border-gray-200 bg-gray-50 p-2">{unidades.map(({ empresa, unidade }, i) => <button key={`${empresa.chave}:${unidade.chave}`} role="tab" id={`unidade-tab-${i}`} aria-controls={`unidade-painel-${i}`} aria-selected={i === unidadeAtiva} onClick={() => setUnidadeAtiva(i)} className={`shrink-0 rounded-lg px-4 py-3 text-sm ${i === unidadeAtiva ? 'bg-sky-700 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>{unidade.nome} <span className="ml-1 opacity-80">({unidade.filhos.length} setores)</span></button>)}</div>
        {selecionada && <div role="tabpanel" id={`unidade-painel-${unidadeAtiva}`} aria-labelledby={`unidade-tab-${unidadeAtiva}`} className="space-y-5 p-5">
          <div className="grid gap-4 lg:grid-cols-2">{[selecionada.unidade].map(item => <div key={item.tipo} className="rounded-lg border border-gray-200 p-4"><p className="mb-1 text-xs uppercase text-gray-500">{item.tipo === 'empresa' ? 'Empresa' : 'Unidade'}</p><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{item.nome}</h2><Estado item={item} /></div><p className="mt-1 text-sm text-gray-500">{item.dados.documento}</p><Detalhes item={item} /></div>)}</div>
          <div className="flex flex-wrap gap-3"><input aria-label="Buscar funcionário" placeholder="Buscar funcionário por nome ou CPF" value={busca} onChange={e => setBusca(e.target.value)} className="min-w-60 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" /><select aria-label="Filtrar funcionários por situação do cadastro" value={filtro} onChange={e => setFiltro(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="todos">Todos os funcionários</option><option value="criar">Não cadastrados</option><option value="atualizar">Já cadastrados</option></select></div>
          {selecionada.unidade.filhos.map(setor => <section key={setor.chave} className="rounded-lg border border-gray-200"><div className="bg-gray-50 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{setor.nome} <span className="text-xs font-normal text-gray-500">· {setor.filhos.length} cargos · {setor.filhos.reduce((n, c) => n + c.filhos.length, 0)} funcionários</span></h3><Estado item={setor} /></div><Detalhes item={setor} /></div><div className="space-y-5 p-4">{setor.filhos.map(cargo => {
            const funcionarios = cargo.filhos.filter(f => (filtro === 'todos' || f.acao === filtro) && (!busca || `${f.nome} ${f.dados.cpf}`.toLowerCase().includes(busca.toLowerCase().trim()) || String(f.dados.cpf).includes(busca.replace(/\D/g, '') || 'sem-correspondencia')));
            return <div key={cargo.chave}><div className="flex flex-wrap items-center gap-2"><h4 className="text-sm font-semibold">{cargo.nome}</h4><Estado item={cargo} /><span className="text-xs text-gray-500">{cargo.filhos.length} funcionários</span></div><Detalhes item={cargo} /><div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-xs text-gray-500"><tr><th className="p-3">Funcionário</th><th className="p-3">CPF</th><th className="p-3">E-mail</th><th className="p-3">Cadastro</th></tr></thead><tbody>{funcionarios.map(f => <tr key={f.chave} className="border-t border-gray-100 align-top"><td className="p-3"><span className="font-medium">{f.nome}</span><Detalhes item={f} /></td><td className="p-3 whitespace-nowrap">{String(f.dados.cpf).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</td><td className="p-3">{f.dados.email || f.atual?.email || <span className="text-gray-400">Não informado</span>}</td><td className="p-3"><Estado item={f} /></td></tr>)}{!funcionarios.length && <tr><td colSpan={4} className="p-3 text-gray-500">Nenhum funcionário corresponde ao filtro.</td></tr>}</tbody></table></div></div>;
          })}</div></section>)}
        </div>}
      </section>
      <div className="sticky bottom-0 rounded-xl border border-gray-200 bg-white p-4 shadow-lg"><label className="flex items-start gap-2 text-sm text-gray-700"><input type="checkbox" checked={confirmado} disabled={ocupado || !!previa.erros.length} onChange={e => setConfirmado(e.target.checked)} className="mt-1" />Conferi a prévia e confirmo a criação e atualização dos cadastros apresentados.</label><div className="mt-4 flex flex-wrap justify-between gap-3"><button disabled={ocupado || consultandoProcesso} className={secundario} onClick={() => { setEtapa(2); setConfirmado(false); setErro(''); }}><ArrowLeft size={16} /> Trocar arquivo</button><button disabled={ocupado || consultandoProcesso || !confirmado || !!previa.erros.length || !acessoValido} className={principal} onClick={importar}>{ocupado ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}{ocupado ? 'Importando…' : 'Confirmar importação'}</button></div></div>
    </>}
  </div>;
}
