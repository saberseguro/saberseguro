import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FileSpreadsheet, FileText, Download, Filter, Loader2 } from "lucide-react";
import type { FiltrosRelatorio, OpcaoRelatorio, TipoArquivoRelatorio, TipoRelatorio } from "../types/Relatorio";
import { useAuth } from "../contexts/AuthContext";
import { temPermissao } from "../auxiliares/permissoes";
import { apiRelatorio } from "../services/apiRelatorio";
import type { Cargo, Empresa, Funcionario, Setor, Unidade } from "../types/EstruturaEmpresa";
import { buscarFuncionariosRelatorio, getCargos, getEmpresa, getSetores, getUnidades, searchEmpresas } from "../services/apiEmpresa";
import { SearchDropdown } from "../components/SearchDropDown";
import { useCompany } from "../contexts/CompanyContext";

const valoresIniciaisFiltros: FiltrosRelatorio = {
  fkEmpresaId: undefined,
  fkUnidadeId: undefined,
  fkSetorId: undefined,
  fkCargoId: undefined,
  fkFuncionarioId: undefined,
  ativo: undefined,
  statusCurso: "TODOS",
  dataInicio: "",
  dataFim: "",
};

export default function RelatoriosPage() {
  const { user } = useAuth();
  const { companyId, selectedCompany } = useCompany();

  const isAdmin = Array.isArray(user?.role) && user.role.includes("admin");
  const podeGerarRelatorios = temPermissao(user, ["visualizar_empresas", "editar_empresas"]);

  const [relatorios] = useState<OpcaoRelatorio[]>(apiRelatorio.listarOpcoes());
  const [relatorioSelecionado, setRelatorioSelecionado] = useState<TipoRelatorio | "">("");

  const [filtros, setFiltros] = useState<FiltrosRelatorio>({
    ...valoresIniciaisFiltros,
    fkEmpresaId: companyId || undefined,
  });

  const [empresaSelecionada, setEmpresaSelecionada] = useState<Empresa | null>(null);
  const [buscaEmpresa, setBuscaEmpresa] = useState("");

  const [_empresa, setEmpresa] = useState<Empresa | null>(null);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);

  const [_loadingEmpresa, setLoadingEmpresa] = useState(false);
  const [loadingUnidades, setLoadingUnidades] = useState(false);
  const [loadingSetores, setLoadingSetores] = useState(false);
  const [loadingCargos, setLoadingCargos] = useState(false);
  const [loadingFuncionarios, setLoadingFuncionarios] = useState(false);
  const [gerando, setGerando] = useState(false);

  const relatorioAtual = useMemo(
    () => relatorios.find((r) => r.id === relatorioSelecionado),
    [relatorios, relatorioSelecionado]
  );

  const formatoAtual: TipoArquivoRelatorio | "" = relatorioAtual?.formato ?? "";

  useEffect(() => {
    if (!isAdmin) {
      fetchEmpresa();
    }
  }, [isAdmin]);

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
  }, [filtros.fkEmpresaId, filtros.fkUnidadeId, filtros.fkSetorId, filtros.fkCargoId, filtros.ativo]);


  const fetchEmpresa = async () => {
    if (!filtros.fkEmpresaId) return;

    setLoadingEmpresa(true);
    try {
      const empresaData = await getEmpresa(filtros.fkEmpresaId);
      setEmpresa(empresaData);
    } catch (error) {
      console.error("Erro ao buscar empresa:", error);
      setEmpresa(null);
    } finally {
      setLoadingEmpresa(false);
    }
  };

  async function carregarUnidades(fkEmpresaId: number) {
    try {
      setLoadingUnidades(true);
      const data = await getUnidades(fkEmpresaId);
      setUnidades(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar unidades.");
      setUnidades([]);
    } finally {
      setLoadingUnidades(false);
    }
  }

  async function carregarSetores(fkUnidadeId: number, fkEmpresaId: number) {
    try {
      setLoadingSetores(true);
      const data = await getSetores(fkUnidadeId, fkEmpresaId);
      setSetores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar setores.");
      setSetores([]);
    } finally {
      setLoadingSetores(false);
    }
  }

  async function carregarCargos(fkSetorId: number, fkEmpresaId: number) {
    try {
      setLoadingCargos(true);
      const data = await getCargos(fkSetorId, fkEmpresaId);
      setCargos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar cargos.");
      setCargos([]);
    } finally {
      setLoadingCargos(false);
    }
  }

  async function carregarFuncionariosPorFiltro() {
    try {
      if (!filtros.fkEmpresaId) {
        setFuncionarios([]);
        return;
      }

      setLoadingFuncionarios(true);

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
      toast.error("Erro ao carregar funcionários.");
      setFuncionarios([]);
    } finally {
      setLoadingFuncionarios(false);
    }
  }

  function atualizarFiltro<K extends keyof FiltrosRelatorio>(campo: K, valor: FiltrosRelatorio[K]) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }

  function handleChangeEmpresa(empresa: Empresa) {
    setEmpresaSelecionada(empresa);
    setBuscaEmpresa("");
    setFiltros({
      ...valoresIniciaisFiltros,
      fkEmpresaId: empresa.idEmpresa,
      statusCurso: "TODOS",
    });
  }

  function limparFiltrosDependentes(nivel: "empresa" | "unidade" | "setor" | "cargo") {
    if (nivel === "empresa") {
      setFiltros((prev) => ({
        ...prev,
        fkUnidadeId: undefined,
        fkSetorId: undefined,
        fkCargoId: undefined,
        fkFuncionarioId: undefined,
      }));
      return;
    }

    if (nivel === "unidade") {
      setFiltros((prev) => ({
        ...prev,
        fkSetorId: undefined,
        fkCargoId: undefined,
        fkFuncionarioId: undefined,
      }));
      return;
    }

    if (nivel === "setor") {
      setFiltros((prev) => ({
        ...prev,
        fkCargoId: undefined,
        fkFuncionarioId: undefined,
      }));
      return;
    }

    if (nivel === "cargo") {
      setFiltros((prev) => ({
        ...prev,
        fkFuncionarioId: undefined,
      }));
    }
  }

  function validarAntesDeGerar() {
    if (!relatorioSelecionado) {
      toast.error("Selecione um relatório.");
      return false;
    }

    if (!filtros.fkEmpresaId) {
      toast.error("Selecione uma empresa.");
      return false;
    }

    if (
      relatorioSelecionado === "pendencias_cursos" &&
      !filtros.fkCargoId &&
      !filtros.fkSetorId &&
      !filtros.fkUnidadeId
    ) {
      toast.error("Selecione ao menos unidade, setor ou cargo para o relatório de pendências.");
      return false;
    }

    return true;
  }

  async function handleGerarRelatorio() {
    if (!validarAntesDeGerar() || !relatorioAtual) return;

    try {
      setGerando(true);

      await apiRelatorio.gerar({
        tipo: relatorioAtual.id,
        formato: relatorioAtual.formato,
        filtros,
      });

      toast.success("Relatório gerado com sucesso.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar relatório.");
    } finally {
      setGerando(false);
    }
  }

  if (!podeGerarRelatorios) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h1 className="text-xl font-bold text-gray-800 mb-2">Relatórios</h1>
          <p className="text-sm text-gray-500">Você não possui permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Central de Relatórios</h1>
              <p className="text-sm text-gray-500 mt-1">
                Selecione o tipo de relatório, aplique os filtros e gere o arquivo em PDF ou Excel.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGerarRelatorio}
              disabled={gerando || !relatorioSelecionado}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {gerando ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {gerando ? "Gerando..." : "Gerar relatório"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pb-8">
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
                        <span className="inline-flex mt-3 text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-600 uppercase">
                          {relatorio.formato}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Filtros</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isAdmin && !companyId ? (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                  <SearchDropdown<Empresa>
                    placeholder="Buscar empresa..."
                    valor={buscaEmpresa ? buscaEmpresa : empresaSelecionada?.nomeFantasia ?? ""}
                    onChange={setBuscaEmpresa}
                    onSelect={(empresa) => handleChangeEmpresa(empresa)}
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
                  disabled={!filtros.fkEmpresaId || loadingUnidades}
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
                  disabled={!filtros.fkUnidadeId || loadingSetores}
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
                  disabled={!filtros.fkSetorId || loadingCargos}
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
                  onChange={(e) =>
                    atualizarFiltro("fkFuncionarioId", e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  disabled={!filtros.fkCargoId || loadingFuncionarios}
                >
                  <option value="">Todos</option>
                  {funcionarios.map((f) => (
                    <option key={f.idUsuario} value={f.idUsuario}>
                      {f.nome}
                    </option>
                  ))}
                </select>
              </div>

              {relatorioSelecionado !== "lista_presenca_cursos" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filtros.ativo ?? ""}
                    onChange={(e) =>
                      atualizarFiltro("ativo", e.target.value === "" ? undefined : Number(e.target.value))
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  >
                    <option value="">Todos</option>
                    <option value="1">Ativos</option>
                    <option value="0">Inativos</option>
                  </select>
                </div>
              )}

              {relatorioSelecionado === "pendencias_cursos" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Situação do curso</label>
                  <select
                    value={filtros.statusCurso ?? "TODOS"}
                    onChange={(e) =>
                      atualizarFiltro(
                        "statusCurso",
                        e.target.value as "PENDENTE" | "CONCLUIDO" | "TODOS"
                      )
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  >
                    <option value="TODOS">Todos</option>
                    <option value="PENDENTE">Pendentes</option>
                    <option value="CONCLUIDO">Concluídos</option>
                  </select>
                </div>
              )}

              {["pendencias_cursos", "lista_presenca_cursos"].includes(relatorioSelecionado) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data início {relatorioSelecionado === "lista_presenca_cursos" ? "do período" : ""}
                    </label>
                    <input
                      type="date"
                      value={filtros.dataInicio || ""}
                      onChange={(e) => atualizarFiltro("dataInicio", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data fim {relatorioSelecionado === "lista_presenca_cursos" ? "do período" : ""}
                    </label>
                    <input
                      type="date"
                      value={filtros.dataFim || ""}
                      onChange={(e) => atualizarFiltro("dataFim", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 rounded-xl bg-gray-50 border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Resumo</h3>

              {relatorioAtual ? (
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    <strong>Relatório:</strong> {relatorioAtual.titulo}
                  </p>
                  <p>
                    <strong>Formato:</strong> {formatoAtual.toUpperCase()}
                  </p>
                  <p>
                    <strong>Empresa:</strong> {filtros.fkEmpresaId ?? "-"}
                  </p>
                  <p>
                    <strong>Unidade:</strong> {filtros.fkUnidadeId ?? "Todas"}
                  </p>
                  <p>
                    <strong>Setor:</strong> {filtros.fkSetorId ?? "Todos"}
                  </p>
                  <p>
                    <strong>Cargo:</strong> {filtros.fkCargoId ?? "Todos"}
                  </p>
                  <p>
                    <strong>Funcionário:</strong> {filtros.fkFuncionarioId ?? "Todos"}
                  </p>
                  {["pendencias_cursos", "lista_presenca_cursos"].includes(relatorioSelecionado) && (
                    <>
                      <p>
                        <strong>Data início:</strong> {filtros.dataInicio || "Não informado"}
                      </p>
                      <p>
                        <strong>Data fim:</strong> {filtros.dataFim || "Não informado"}
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Selecione um relatório para visualizar o resumo.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}