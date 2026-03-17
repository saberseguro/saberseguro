import { useEffect, useState } from "react";
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
import { getDashBoardHome } from "../../services/apiDashBoard";

type StatusResumo = {
  status: "NAO_INICIADO" | "EM_ANDAMENTO" | "CONCLUIDO" | "ATRASADO";
  quantidade: number;
};

type CertificadosPorMes = {
  mes: string;
  total: number;
};

type DashboardHomeDTO = {
  kpis: {
    funcionariosAtivos: number;
    cursosDisponiveis: number;
    totalVinculosObrigatorios: number;
    cursosNaoIniciados: number;
    cursosEmAndamento: number;
    cursosConcluidos: number;
    cursosAtrasados: number;
    certificadosTotal: number;
    certificadosUltimos30Dias: number;
  };
  statusCursos: StatusResumo[];
  certificadosPorMes: CertificadosPorMes[];
};

export default function HomePage() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dados, setDados] = useState<DashboardHomeDTO | null>(null);

  useEffect(() => {
    async function carregar() {
      try {
        const resp = await getDashBoardHome(user?.idUsuario ?? 0);
        setDados(resp);
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
      </div>
    </div>
  );
}
