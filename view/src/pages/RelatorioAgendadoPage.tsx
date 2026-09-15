import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import {
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2,
  Mail,
  Pencil,
  Plus,
  Power,
  Trash2,
  X,
} from "lucide-react";
import type { TipoRelatorio } from "../types/Relatorio";
import type {
  FiltrosRelatorioAgendado,
  FrequenciaRelatorioAgendado,
  PayloadRelatorioAgendado,
  RelatorioAgendado,
} from "../types/RelatorioAgendado";
import { useAuth } from "../contexts/AuthContext";
import { useCompany } from "../contexts/CompanyContext";
import { temPermissao } from "../auxiliares/permissoes";
import { apiRelatorio } from "../services/apiRelatorio";
import {
  atualizarRelatorioAgendado,
  alternarAtivoRelatorioAgendado,
  criarRelatorioAgendado,
  listarRelatoriosAgendados,
  removerRelatorioAgendado,
} from "../services/apiRelatorioAgendado";
import type { Cargo, Empresa, Funcionario, Setor, Unidade } from "../types/EstruturaEmpresa";
import { buscarFuncionariosRelatorio, getCargos, getEmpresa, getSetores, getUnidades, searchEmpresas } from "../services/apiEmpresa";
import { SearchDropdown } from "../components/SearchDropDown";

const valoresIniciaisFiltros: FiltrosRelatorioAgendado & { fkEmpresaId?: number } = {
  fkEmpresaId: undefined,
  fkUnidadeId: undefined,
  fkSetorId: undefined,
  fkCargoId: undefined,
  fkFuncionarioId: undefined,
  ativo: undefined,
  statusCurso: "TODOS",
};

const opcoesFrequencia: { id: FrequenciaRelatorioAgendado; label: string; descricao: string }[] = [
  { id: "semanal", label: "Semanal", descricao: "Envia toda semana (últimos 7 dias)." },
  { id: "quinzenal", label: "Quinzenal", descricao: "Envia a cada 15 dias." },
  { id: "mensal", label: "Mensal", descricao: "Envia a cada mês." },
];

function validarEmails(valor: string): { validos: string[]; invalidos: string[] } {
  const partes = valor
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validos = partes.filter((e) => regexEmail.test(e));
  const invalidos = partes.filter((e) => !regexEmail.test(e));

  return { validos, invalidos };
}

function formatarData(data?: string | null) {
  if (!data) return "-";
  return new Date(data).toLocaleDateString("pt-BR");
}

export default function RelatorioAgendadoPage() {
  const { user } = useAuth();
  const { companyId, selectedCompany } = useCompany();

  const isAdmin = Array.isArray(user?.role) && user.role.includes("admin");
  const podeGerenciar = temPermissao(user, ["editar_empresas"]);

  const [relatorios] = useState(apiRelatorio.listarOpcoes());

  const [agendamentos, setAgendamentos] = useState<RelatorioAgendado[]>([]);
  const [carregandoLista, setCarregandoLista] = useState(false);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [nome, setNome] = useState("");
  const [relatorioSelecionado, setRelatorioSelecionado] = useState<TipoRelatorio | "">("");
  const [emailsDestino, setEmailsDestino] = useState("");
  const [frequencia, setFrequencia] = useState<FrequenciaRelatorioAgendado>("semanal");

  const [filtros, setFiltros] = useState(valoresIniciaisFiltros);

  const [empresaSelecionada, setEmpresaSelecionada] = useState<Empresa | null>(null);
  const [buscaEmpresa, setBuscaEmpresa] = useState("");

  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);

  const relatorioAtual = useMemo(
    () => relatorios.find((r) => r.id === relatorioSelecionado),
    [relatorios, relatorioSelecionado]
  );

  useEffect(() => {
    carregarLista();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  useEffect(() => {
    if (!filtros.fkEmpresaId) {
      setUnidades([]);
      setSetores([]);
      setCargos([]);
      setFuncionarios([]);
      return;
    }
    carregarUnidades(filtros.fkEmpresaId);
  }, [filtros.fkEmpresaId]);

  useEffect(() => {
    if (!filtros.fkUnidadeId || !filtros.fkEmpresaId) {
      setSetores([]);
      setCargos([]);
      setFuncionarios([]);
      return;
    }
    carregarSetores(filtros.fkUnidadeId, filtros.fkEmpresaId);
  }, [filtros.fkUnidadeId, filtros.fkEmpresaId]);

  useEffect(() => {
    if (!filtros.fkSetorId || !filtros.fkEmpresaId) {
      setCargos([]);
      setFuncionarios([]);
      return;
    }
    carregarCargos(filtros.fkSetorId, filtros.fkEmpresaId);
  }, [filtros.fkSetorId, filtros.fkEmpresaId]);

  useEffect(() => {
    if (!filtros.fkEmpresaId) {
      setFuncionarios([]);
      return;
    }
    carregarFuncionariosPorFiltro();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.fkEmpresaId, filtros.fkUnidadeId, filtros.fkSetorId, filtros.fkCargoId, filtros.ativo]);

  async function carregarLista() {
    const fkEmpresaId = isAdmin ? undefined : companyId ?? undefined;

    if (!isAdmin && !fkEmpresaId) return;

    try {
      setCarregandoLista(true);
      const dados = await listarRelatoriosAgendados(fkEmpresaId);
      setAgendamentos(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar relatórios agendados.");
      setAgendamentos([]);
    } finally {
      setCarregandoLista(false);
    }
  }

  async function carregarUnidades(fkEmpresaId: number) {
    try {
      const data = await getUnidades(fkEmpresaId);
      setUnidades(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setUnidades([]);
    }
  }

  async function carregarSetores(fkUnidadeId: number, fkEmpresaId: number) {
    try {
      const data = await getSetores(fkUnidadeId, fkEmpresaId);
      setSetores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setSetores([]);
    }
  }

  async function carregarCargos(fkSetorId: number, fkEmpresaId: number) {
    try {
      const data = await getCargos(fkSetorId, fkEmpresaId);
      setCargos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setCargos([]);
    }
  }

  async function carregarFuncionariosPorFiltro() {
    try {
      if (!filtros.fkEmpresaId) return;

      const data = await buscarFuncionariosRelatorio({
        fkEmpresaId: filtros.fkEmpresaId,
        fkUnidadeId: filtros.fkUnidadeId,
        fkSetorId: filtros.fkSetorId,
        fkCargoId: filtros.fkCargoId,
        fkFuncionarioId: filtros.fkFuncionarioId,
        ativo: filtros.ativo,
      });
      setFuncionarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setFuncionarios([]);
    }
  }

  function atualizarFiltro<K extends keyof typeof filtros>(campo: K, valor: (typeof filtros)[K]) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }

  function limparFiltrosDependentes(nivel: "unidade" | "setor" | "cargo") {
    if (nivel === "unidade") {
      setFiltros((prev) => ({ ...prev, fkSetorId: undefined, fkCargoId: undefined, fkFuncionarioId: undefined }));
    } else if (nivel === "setor") {
      setFiltros((prev) => ({ ...prev, fkCargoId: undefined, fkFuncionarioId: undefined }));
    } else if (nivel === "cargo") {
      setFiltros((prev) => ({ ...prev, fkFuncionarioId: undefined }));
    }
  }

  function handleChangeEmpresa(empresa: Empresa) {
    setEmpresaSelecionada(empresa);
    setBuscaEmpresa("");
    setFiltros({ ...valoresIniciaisFiltros, fkEmpresaId: empresa.idEmpresa });
  }

  function abrirNovoAgendamento() {
    setEditandoId(null);
    setNome("");
    setRelatorioSelecionado("");
    setEmailsDestino("");
    setFrequencia("semanal");
    setEmpresaSelecionada(null);
    setBuscaEmpresa("");
    setFiltros({ ...valoresIniciaisFiltros, fkEmpresaId: !isAdmin ? companyId ?? undefined : undefined });
    setMostrarFormulario(true);
  }

  async function abrirEdicao(agendamento: RelatorioAgendado) {
    setEditandoId(agendamento.idRelatorioAgendado);
    setNome(agendamento.nome);
    setRelatorioSelecionado(agendamento.tipoRelatorio);
    setEmailsDestino(agendamento.emailsDestino);
    setFrequencia(agendamento.frequencia);
    setFiltros({
      fkEmpresaId: agendamento.fkEmpresaId,
      fkUnidadeId: agendamento.filtros?.fkUnidadeId,
      fkSetorId: agendamento.filtros?.fkSetorId,
      fkCargoId: agendamento.filtros?.fkCargoId,
      fkFuncionarioId: agendamento.filtros?.fkFuncionarioId,
      ativo: agendamento.filtros?.ativo,
      statusCurso: agendamento.filtros?.statusCurso ?? "TODOS",
    });

    if (isAdmin) {
      try {
        const empresa = await getEmpresa(agendamento.fkEmpresaId);
        setEmpresaSelecionada(empresa);
      } catch (error) {
        console.error(error);
      }
    }

    setMostrarFormulario(true);
  }

  function fecharFormulario() {
    setMostrarFormulario(false);
    setEditandoId(null);
  }

  function validarFormulario(): boolean {
    if (!nome.trim()) {
      toast.error("Informe um nome para o agendamento.");
      return false;
    }
    if (!relatorioSelecionado) {
      toast.error("Selecione um relatório.");
      return false;
    }
    if (!filtros.fkEmpresaId) {
      toast.error("Selecione uma empresa.");
      return false;
    }
    if (!emailsDestino.trim()) {
      toast.error("Informe ao menos um e-mail de destino.");
      return false;
    }

    const { validos, invalidos } = validarEmails(emailsDestino);
    if (invalidos.length > 0) {
      toast.error(`E-mail inválido: ${invalidos.join(", ")}`);
      return false;
    }
    if (validos.length === 0) {
      toast.error("Informe ao menos um e-mail de destino válido.");
      return false;
    }

    return true;
  }

  async function handleSalvar() {
    if (!validarFormulario() || !relatorioAtual) return;

    const { validos } = validarEmails(emailsDestino);

    const payload: PayloadRelatorioAgendado = {
      nome: nome.trim(),
      fkEmpresaId: filtros.fkEmpresaId,
      tipoRelatorio: relatorioAtual.id,
      formato: relatorioAtual.formato,
      filtros: {
        fkUnidadeId: filtros.fkUnidadeId,
        fkSetorId: filtros.fkSetorId,
        fkCargoId: filtros.fkCargoId,
        fkFuncionarioId: filtros.fkFuncionarioId,
        ativo: filtros.ativo,
        ...(relatorioAtual.id === "pendencias_cursos" ? { statusCurso: filtros.statusCurso } : {}),
      },
      emailsDestino: validos.join(","),
      frequencia,
    };

    try {
      setSalvando(true);

      if (editandoId) {
        await atualizarRelatorioAgendado(editandoId, payload);
        toast.success("Agendamento atualizado com sucesso.");
      } else {
        await criarRelatorioAgendado(payload);
        toast.success("Agendamento criado com sucesso.");
      }

      fecharFormulario();
      carregarLista();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Erro ao salvar agendamento.");
    } finally {
      setSalvando(false);
    }
  }

  async function handleAlternarAtivo(agendamento: RelatorioAgendado) {
    try {
      await alternarAtivoRelatorioAgendado(agendamento.idRelatorioAgendado, !agendamento.ativo);
      toast.success(agendamento.ativo ? "Agendamento desativado." : "Agendamento ativado.");
      carregarLista();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Erro ao atualizar status do agendamento.");
    }
  }

  async function handleExcluir(agendamento: RelatorioAgendado) {
    const confirmacao = await Swal.fire({
      title: "Remover agendamento?",
      text: `O agendamento "${agendamento.nome}" deixará de ser enviado automaticamente. Deseja continuar?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim, remover",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#d33",
      reverseButtons: true,
    });

    if (!confirmacao.isConfirmed) return;

    try {
      await removerRelatorioAgendado(agendamento.idRelatorioAgendado);
      toast.success("Agendamento removido.");
      carregarLista();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Erro ao remover agendamento.");
    }
  }

  function labelFrequencia(freq: FrequenciaRelatorioAgendado) {
    return opcoesFrequencia.find((o) => o.id === freq)?.label ?? freq;
  }

  function labelRelatorio(tipo: TipoRelatorio) {
    return relatorios.find((r) => r.id === tipo)?.titulo ?? tipo;
  }

  if (!podeGerenciar) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h1 className="text-xl font-bold text-gray-800 mb-2">Envio Automático de Relatórios</h1>
          <p className="text-sm text-gray-500">Você não possui permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Envio Automático de Relatórios</h1>
              <p className="text-sm text-gray-500 mt-1">
                Configure relatórios para serem gerados e enviados por e-mail automaticamente, em uma frequência
                definida.
              </p>
            </div>

            {!mostrarFormulario && (
              <button
                type="button"
                onClick={abrirNovoAgendamento}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                <Plus size={16} />
                Novo agendamento
              </button>
            )}
          </div>
        </div>

        {mostrarFormulario && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-1 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Filter size={18} className="text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-800">Tipo de relatório</h2>
              </div>

              <div className="space-y-3">
                {relatorios.map((relatorio) => {
                  const ativo = relatorioSelecionado === relatorio.id;
                  return (
                    <button
                      key={relatorio.id}
                      type="button"
                      onClick={() => setRelatorioSelecionado(relatorio.id)}
                      className={`w-full text-left border rounded-xl p-4 transition ${ativo
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {relatorio.formato === "pdf" ? (
                            <FileText size={18} className={ativo ? "text-blue-600" : "text-gray-500"} />
                          ) : (
                            <FileSpreadsheet size={18} className={ativo ? "text-blue-600" : "text-gray-500"} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{relatorio.titulo}</p>
                          <p className="text-xs text-gray-500 mt-1">{relatorio.descricao}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  {editandoId ? "Editar agendamento" : "Novo agendamento"}
                </h2>
                <button type="button" onClick={fecharFormulario} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do agendamento</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Pendências mensais - Unidade Centro"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  />
                </div>

                {isAdmin ? (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                    <SearchDropdown<Empresa>
                      placeholder="Buscar empresa..."
                      valor={buscaEmpresa ? buscaEmpresa : empresaSelecionada?.nomeFantasia ?? ""}
                      onChange={setBuscaEmpresa}
                      onSelect={handleChangeEmpresa}
                      buscar={searchEmpresas}
                      renderItem={(e) => <span>{e.nomeFantasia}</span>}
                      chaveUnica={(e) => e.idEmpresa}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                    <input
                      disabled
                      value={String(selectedCompany?.nomeFantasia ?? selectedCompany?.razaoSocial ?? "")}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-100 text-gray-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                  <select
                    value={filtros.fkUnidadeId ?? ""}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : undefined;
                      atualizarFiltro("fkUnidadeId", value);
                      limparFiltrosDependentes("unidade");
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                    disabled={!filtros.fkEmpresaId}
                  >
                    <option value="">Todas</option>
                    {unidades.map((u) => (
                      <option key={u.idUnidade} value={u.idUnidade}>
                        {u.nomeFantasia}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Setor</label>
                  <select
                    value={filtros.fkSetorId ?? ""}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : undefined;
                      atualizarFiltro("fkSetorId", value);
                      limparFiltrosDependentes("setor");
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                    disabled={!filtros.fkUnidadeId}
                  >
                    <option value="">Todos</option>
                    {setores.map((s) => (
                      <option key={s.idSetor} value={s.idSetor}>
                        {s.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                  <select
                    value={filtros.fkCargoId ?? ""}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : undefined;
                      atualizarFiltro("fkCargoId", value);
                      limparFiltrosDependentes("cargo");
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                    disabled={!filtros.fkSetorId}
                  >
                    <option value="">Todos</option>
                    {cargos.map((c) => (
                      <option key={c.idCargo} value={c.idCargo}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Funcionário</label>
                  <select
                    value={filtros.fkFuncionarioId ?? ""}
                    onChange={(e) => atualizarFiltro("fkFuncionarioId", e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                    disabled={!filtros.fkCargoId}
                  >
                    <option value="">Todos</option>
                    {funcionarios.map((f) => (
                      <option key={f.idUsuario} value={f.idUsuario}>
                        {f.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {relatorioSelecionado === "pendencias_cursos" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Situação do curso</label>
                    <select
                      value={filtros.statusCurso ?? "TODOS"}
                      onChange={(e) => atualizarFiltro("statusCurso", e.target.value as "PENDENTE" | "CONCLUIDO" | "TODOS")}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2"
                    >
                      <option value="TODOS">Todos</option>
                      <option value="PENDENTE">Pendentes</option>
                      <option value="CONCLUIDO">Concluídos</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status do funcionário</label>
                  <select
                    value={filtros.ativo ?? ""}
                    onChange={(e) => atualizarFiltro("ativo", e.target.value === "" ? undefined : Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  >
                    <option value="">Todos</option>
                    <option value="1">Ativos</option>
                    <option value="0">Inativos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequência de envio</label>
                  <select
                    value={frequencia}
                    onChange={(e) => setFrequencia(e.target.value as FrequenciaRelatorioAgendado)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  >
                    {opcoesFrequencia.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {opcoesFrequencia.find((f) => f.id === frequencia)?.descricao}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-mails de destino (separados por vírgula)
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={emailsDestino}
                      onChange={(e) => setEmailsDestino(e.target.value)}
                      placeholder="gestor@empresa.com, financeiro@empresa.com"
                      className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Não precisam ser e-mails de usuários cadastrados no sistema.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={fecharFormulario}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSalvar}
                  disabled={salvando}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {salvando && <Loader2 size={16} className="animate-spin" />}
                  {editandoId ? "Salvar alterações" : "Criar agendamento"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm pb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Agendamentos configurados</h2>

          {carregandoLista ? (
            <div className="flex items-center justify-center py-10 text-gray-400">
              <Loader2 size={20} className="animate-spin mr-2" /> Carregando...
            </div>
          ) : agendamentos.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">Nenhum envio automático configurado ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="py-2 pr-4">Nome</th>
                    <th className="py-2 pr-4">Relatório</th>
                    <th className="py-2 pr-4">Frequência</th>
                    <th className="py-2 pr-4">Próximo envio</th>
                    <th className="py-2 pr-4">Último envio</th>
                    <th className="py-2 pr-4">E-mails</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {agendamentos.map((agendamento) => (
                    <tr key={agendamento.idRelatorioAgendado} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 pr-4 font-medium text-gray-800">{agendamento.nome}</td>
                      <td className="py-3 pr-4 text-gray-600">{labelRelatorio(agendamento.tipoRelatorio)}</td>
                      <td className="py-3 pr-4 text-gray-600">{labelFrequencia(agendamento.frequencia)}</td>
                      <td className="py-3 pr-4 text-gray-600">{formatarData(agendamento.proximoEnvioEm)}</td>
                      <td className="py-3 pr-4 text-gray-600">{formatarData(agendamento.ultimoEnvioEm)}</td>
                      <td className="py-3 pr-4 text-gray-600 max-w-[220px] truncate" title={agendamento.emailsDestino}>
                        {agendamento.emailsDestino}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex text-[11px] px-2 py-1 rounded-full uppercase font-semibold ${agendamento.ativo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                            }`}
                        >
                          {agendamento.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            title={agendamento.ativo ? "Desativar" : "Ativar"}
                            onClick={() => handleAlternarAtivo(agendamento)}
                            className={`p-2 rounded-lg border ${agendamento.ativo
                              ? "border-amber-200 text-amber-600 hover:bg-amber-50"
                              : "border-green-200 text-green-600 hover:bg-green-50"
                              }`}
                          >
                            <Power size={14} />
                          </button>
                          <button
                            type="button"
                            title="Editar"
                            onClick={() => abrirEdicao(agendamento)}
                            className="p-2 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            title="Excluir"
                            onClick={() => handleExcluir(agendamento)}
                            className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
