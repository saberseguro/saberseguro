import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import logo from "../../assets/media/logotipos/logo_h_azul_preto.png";
import {
  LogOut,
  Users,
  BookOpen,
  Award,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { buscarDashboardHome } from "../../services/apiDashBoard";
import type { DashboardHomeDTO, FuncionarioCursoAndamento } from "../../types/DashBoard";

export default function HomePage() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState<DashboardHomeDTO | null>(null);

  const [busca, setBusca] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof FuncionarioCursoAndamento;
    direction: "asc" | "desc";
  }>({
    key: "funcionarioNome",
    direction: "asc",
  });

  useEffect(() => {
    async function carregar() {
      try {
        const resp = await buscarDashboardHome();
        setDados(resp);
        console.log(resp);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  const kpis = dados?.kpis;

  const statusChartData =
    dados?.statusCursos.map((s) => ({
      status:
        s.status === "NAO_INICIADO"
          ? "Não iniciado"
          : s.status === "EM_ANDAMENTO"
            ? "Em andamento"
            : s.status === "CONCLUIDO"
              ? "Concluído"
              : "Atrasado",
      quantidade: s.quantidade,
    })) ?? [];

  const certificadosChartData =
    dados?.certificadosPorMes?.map((c) => ({
      // mes vem como "2025-01" -> mostrar "jan/25"
      mesLabel: (() => {
        const [ano, mes] = c.mes.split("-");
        const meses = [
          "jan",
          "fev",
          "mar",
          "abr",
          "mai",
          "jun",
          "jul",
          "ago",
          "set",
          "out",
          "nov",
          "dez",
        ];
        return `${meses[Number(mes) - 1]}/${ano.slice(-2)}`;
      })(),
      total: c.total,
    })) ?? [];

  const funcionariosCursosFiltrados = useMemo(() => {
    const lista = dados?.funcionariosCursos ?? [];

    const termo = busca.toLowerCase().trim();

    const filtrados = lista.filter((item) => {
      const texto = [
        item.funcionarioNome,
        item.unidade,
        item.setor,
        item.cargo,
        item.cursoNome,
        formatStatus(item.status),
        String(item.percentualConclusao),
      ]
        .join(" ")
        .toLowerCase();

      return texto.includes(termo);
    });

    return [...filtrados].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }

      return sortConfig.direction === "asc"
        ? String(aValue ?? "").localeCompare(String(bValue ?? ""))
        : String(bValue ?? "").localeCompare(String(aValue ?? ""));
    });
  }, [dados?.funcionariosCursos, busca, sortConfig]);

  function ordenarPor(key: keyof FuncionarioCursoAndamento) {
    setSortConfig((atual) => ({
      key,
      direction:
        atual.key === key && atual.direction === "asc" ? "desc" : "asc",
    }));
  }

  function renderSortIcon(key: keyof FuncionarioCursoAndamento) {
    if (sortConfig.key !== key) return "↕";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  }

  function getStatusClass(status: FuncionarioCursoAndamento["status"]) {
    if (status === "CONCLUIDO") {
      return "bg-green-100 text-green-700 border-green-200";
    }

    if (status === "EM_ANDAMENTO") {
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }

    if (status === "ATRASADO") {
      return "bg-red-100 text-red-700 border-red-200";
    }

    return "bg-gray-100 text-gray-700 border-gray-200";
  }

  function formatStatus(status: FuncionarioCursoAndamento["status"]) {
    if (status === "CONCLUIDO") return "Concluído";
    if (status === "EM_ANDAMENTO") return "Em andamento";
    if (status === "ATRASADO") return "Atrasado";
    return "Não iniciado";
  }

  function getProgressClass(percentual: number) {
    if (percentual >= 100) return "bg-green-500";
    if (percentual > 0) return "bg-yellow-500";
    return "bg-red-500";
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between bg-white p-4 rounded border border-gray-200">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Saber Seguro" className="h-10" />
          <div>
            <p className="text-xs text-gray-500">Painel Geral</p>
            <h1 className="text-2xl font-bold text-gray-700">
              Bem-vindo, {user?.nome}
            </h1>
          </div>
        </div>

        <button
          onClick={logout}
          className="text-red-600 p-2 rounded-full hover:bg-red-500 hover:text-white cursor-pointer flex items-center gap-2"
        >
          <LogOut size={20} />
          <span className="hidden sm:inline text-sm">Sair</span>
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Funcionários */}
        <div className="p-4 rounded-lg bg-white shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <p className="text-xs font-medium text-gray-500 uppercase">
              Funcionários Ativos
            </p>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          {loading ? (
            <p className="text-right text-gray-400 mt-4 text-sm">Carregando...</p>
          ) : (
            <p className="text-2xl font-bold text-blue-600 text-right mt-2">
              {kpis?.funcionariosAtivos ?? 0}
            </p>
          )}
        </div>

        {/* Cursos Disponíveis */}
        <div className="p-4 rounded-lg bg-white shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <p className="text-xs font-medium text-gray-500 uppercase">
              Cursos Disponíveis
            </p>
            <BookOpen className="w-5 h-5 text-indigo-600" />
          </div>
          {loading ? (
            <p className="text-right text-gray-400 mt-4 text-sm">Carregando...</p>
          ) : (
            <p className="text-2xl font-bold text-indigo-600 text-right mt-2">
              {kpis?.cursosDisponiveis ?? 0}
            </p>
          )}
        </div>

        {/* Cursos Concluídos */}
        <div className="p-4 rounded-lg bg-white shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <p className="text-xs font-medium text-gray-500 uppercase">
              Cursos Concluídos
            </p>
            <AlertTriangle className="w-5 h-5 text-green-600" />
          </div>
          {loading ? (
            <p className="text-right text-gray-400 mt-4 text-sm">Carregando...</p>
          ) : (
            <p className="text-2xl font-bold text-green-600 text-right mt-2">
              {kpis?.cursosConcluidos ?? 0}
            </p>
          )}
        </div>

        {/* Certificados (30 dias) */}
        <div className="p-4 rounded-lg bg-white shadow-sm border border-gray-100">
          <div className="flex justify-between items-center">
            <p className="text-xs font-medium text-gray-500 uppercase">
              Certificados (30 dias)
            </p>
            <Award className="w-5 h-5 text-amber-500" />
          </div>
          {loading ? (
            <p className="text-right text-gray-400 mt-4 text-sm">Carregando...</p>
          ) : (
            <p className="text-2xl font-bold text-amber-500 text-right mt-2">
              {kpis?.certificadosUltimos30Dias ?? 0}
            </p>
          )}
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status dos cursos */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-2 text-gray-700">
            Status dos Cursos
          </h3>
          {loading ? (
            <div className="flex items-center justify-center h-[250px] text-gray-400">
              Carregando...
            </div>
          ) : statusChartData.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-gray-500">
              Nenhum dado disponível
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statusChartData}>
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="quantidade" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Certificados por mês */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-2 text-gray-700">
            Certificados por Mês
          </h3>
          {loading ? (
            <div className="flex items-center justify-center h-[250px] text-gray-400">
              Carregando...
            </div>
          ) : certificadosChartData.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-gray-500">
              Nenhum dado disponível
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={certificadosChartData}>
                <XAxis dataKey="mesLabel" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Certificados"
                  stroke="#10b981"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Andamento dos Funcionários */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden lg:col-span-2">
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">
                Andamento dos Funcionários
              </h3>
              <p className="text-sm text-gray-500">
                Lista de funcionários e progresso nos cursos vinculados
              </p>
            </div>

            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar funcionário, curso, setor..."
              className="w-full md:w-80 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-400">
              Carregando...
            </div>
          ) : !dados?.funcionariosCursos?.length ? (
            <div className="p-6 text-center text-gray-500">
              Nenhum andamento encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th onClick={() => ordenarPor("funcionarioNome")} className="px-4 py-3 text-left font-semibold cursor-pointer">
                      Funcionário {renderSortIcon("funcionarioNome")}
                    </th>

                    <th onClick={() => ordenarPor("unidade")} className="px-4 py-3 text-left font-semibold cursor-pointer">
                      Unidade {renderSortIcon("unidade")}
                    </th>

                    <th onClick={() => ordenarPor("setor")} className="px-4 py-3 text-left font-semibold cursor-pointer">
                      Setor {renderSortIcon("setor")}
                    </th>

                    <th onClick={() => ordenarPor("cargo")} className="px-4 py-3 text-left font-semibold cursor-pointer">
                      Cargo {renderSortIcon("cargo")}
                    </th>

                    <th onClick={() => ordenarPor("cursoNome")} className="px-4 py-3 text-left font-semibold cursor-pointer">
                      Curso {renderSortIcon("cursoNome")}
                    </th>

                    <th onClick={() => ordenarPor("status")} className="px-4 py-3 text-center font-semibold cursor-pointer">
                      Status {renderSortIcon("status")}
                    </th>

                    <th onClick={() => ordenarPor("percentualConclusao")} className="px-4 py-3 text-center font-semibold cursor-pointer">
                      Progresso {renderSortIcon("percentualConclusao")}
                    </th>

                    <th onClick={() => ordenarPor("dataConclusao")} className="px-4 py-3 text-center font-semibold cursor-pointer">
                      Conclusão {renderSortIcon("dataConclusao")}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {funcionariosCursosFiltrados.map((item, index) => (
                    <tr
                      key={`${item.funcionarioId}-${item.cursoId}-${index}`}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {item.funcionarioNome}
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {item.unidade || "-"}
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {item.setor || "-"}
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {item.cargo || "-"}
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        {item.cursoNome}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusClass(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${getProgressClass(
                                item.percentualConclusao
                              )}`}
                              style={{ width: `${item.percentualConclusao}%` }}
                            />
                          </div>

                          <span className="text-xs font-semibold text-gray-600 w-10 text-right">
                            {item.percentualConclusao}%
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center text-gray-600">
                        {item.dataConclusao || "-"}
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
