import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Filter } from "lucide-react";
import type { Certificado } from "../../types/EstruturaCurso";
import { useNavigate } from "react-router-dom";
import { getCertificados } from "../../services/apiCurso";
import toast from "react-hot-toast";
import ToolTip from "../../components/Auxiliares/ToolTip";
import TabelaBase from "../../components/Tabelas/TabelaBase";
import { formatarMinutosEmHoras } from "../../auxiliares/formatters";
import { SearchableSelect } from "../../components/Formularios/Inputs";

export default function CertificadoPage() {
  const navigate = useNavigate();
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [listaFiltrada, setListaFiltrada] = useState<Certificado[]>([]);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filtroCurso, setFiltroCurso] = useState("");
  const [filtroFuncionario, setFiltroFuncionario] = useState("");
  const [filtroInicio, setFiltroInicio] = useState("");
  const [filtroFim, setFiltroFim] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const lista = await getCertificados();
        setCertificados(lista);
        setListaFiltrada(lista);
      } catch (e: any) {
        toast.error("Erro ao carregar certificados.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // 🔁 Gera listas únicas de cursos e funcionários
  const cursosUnicos = useMemo(() => {
    return Array.from(new Set(certificados.map((c) => c.curso))).filter(Boolean);
  }, [certificados]);

  const funcionariosUnicos = useMemo(() => {
    return Array.from(new Set(certificados.map((c) => c.funcionario))).filter(Boolean);
  }, [certificados]);

  const handlePreview = async (cert: Certificado) => {
    navigate(`/certificado/preview/${cert.idCertificado}`, {
      state: {
        nome: cert.funcionario || "",
      },
    });
  };

  // 🔍 Aplicar Filtros
  const aplicarFiltros = () => {
    let filtrados = [...certificados];

    if (filtroCurso)
      filtrados = filtrados.filter((c) => c.curso === filtroCurso);

    if (filtroFuncionario)
      filtrados = filtrados.filter((c) => c.funcionario === filtroFuncionario);

    if (filtroInicio)
      filtrados = filtrados.filter(
        (c) => new Date(c.dataGeracao) >= new Date(filtroInicio)
      );

    if (filtroFim)
      filtrados = filtrados.filter(
        (c) => new Date(c.dataGeracao) <= new Date(filtroFim)
      );

    setListaFiltrada(filtrados);
  };

  const limparFiltros = () => {
    setFiltroCurso("");
    setFiltroFuncionario("");
    setFiltroInicio("");
    setFiltroFim("");
    setListaFiltrada(certificados);
  };

  const columns = [
    {
      header: "Código",
      accessor: "codigo" as keyof Certificado,
      sortable: true,
    },
    {
      header: "Curso",
      accessor: "curso" as keyof Certificado,
      sortable: true,
    },
    {
      header: "Carga Horária",
      accessor: "cargaHoraria" as keyof Certificado,
      render: (_val: any, row: Certificado) =>
        formatarMinutosEmHoras(row.cargaHoraria),
      sortable: true,
    },
    {
      header: "Funcionário",
      accessor: "funcionario" as keyof Certificado,
      sortable: true,
    },
    {
      header: "Data de Geração",
      accessor: "dataGeracao" as keyof Certificado,
      sortable: true,
    },
    {
      header: "Ações",
      accessor: "idCertificado" as keyof Certificado,
      render: (_val: any, row: Certificado) => {
        const podeVisualizar = row?.valido;

        return (
          <div className="flex justify-center items-center">
            <ToolTip
              text={
                podeVisualizar
                  ? "Visualizar Certificado"
                  : "Você não tem permissão para abrir este certificado"
              }
              position="left"
            >
              <button
                onClick={() => podeVisualizar && handlePreview(row)}
                disabled={!podeVisualizar}
                className={`cursor-pointer ${podeVisualizar
                  ? "text-sky-600 hover:text-sky-800"
                  : "text-gray-300 cursor-not-allowed"
                  }`}
              >
                {podeVisualizar ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </ToolTip>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="p-4 rounded-md shadow-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Meus Certificados</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 text-sky-600 px-3 py-1 rounded text-sm cursor-pointer ${showFilters ? "bg-gray-400 text-white  hover:bg-sky-700" : "hover:text-sky-800 border border-sky-600"}`}
          >
            <Filter size={16} />
            Filtros
          </button>
        </div>

        {/* Painel de Filtros */}
        {showFilters && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4 space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <SearchableSelect
                label="Curso"
                options={cursosUnicos.map((c) => ({ label: c, value: c }))}
                value={filtroCurso}
                onChange={(v) => setFiltroCurso(String(v))}
                placeholder="Buscar curso..."
                emptyOptionLabel="Todos"
                allowClear
              />

              <SearchableSelect
                label="Funcionário"
                options={funcionariosUnicos.map((f) => ({ label: f, value: f }))}
                value={filtroFuncionario}
                onChange={(v) => setFiltroFuncionario(String(v))}
                placeholder="Buscar funcionário..."
                emptyOptionLabel="Todos"
                allowClear
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={limparFiltros}
                className="flex items-center gap-1 text-gray-600 border px-3 py-1 rounded hover:bg-red-500 hover:text-white text-sm cursor-pointer"
              >
                Limpar
              </button>
              <button
                onClick={aplicarFiltros}
                className="bg-sky-600 text-white px-6 py-1 rounded hover:bg-sky-700 text-sm cursor-pointer font-medium"
              >
                Aplicar
              </button>
            </div>
          </div>
        )}


        <TabelaBase
          columns={columns}
          data={listaFiltrada}
          isLoading={loading}
          itemsPerPage={10}
        />
      </div>
    </>
  );
}
