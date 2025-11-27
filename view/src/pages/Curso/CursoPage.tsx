import { useEffect, useState } from "react";
import type { Curso } from "../../types/EstruturaCurso";
import { getCursos } from "../../services/apiCurso";

// Componentes
import TabelaBase from "../../components/Tabelas/TabelaBase";
import FiltrosCursos from "../../components/Filtros/FiltrosCursos";
import { useAuth } from "../../contexts/AuthContext";
import { formatarMinutosEmHoras } from "../../auxiliares/formatters";
import { useNavigate } from "react-router-dom";

export default function CursosPage() {
  const { user } = useAuth();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [filtros, setFiltros] = useState<{ categoria: string | null; ativo: string | null }>({
    categoria: null,
    ativo: null,
  });

  const columns = [
    {
      header: "ID",
      accessor: "idCurso" as keyof Curso,
      sortable: true,
    },
    {
      header: "Título",
      accessor: "titulo" as keyof Curso,
      sortable: true,
    },
    {
      header: "Responsável",
      accessor: "responsaveltecnico" as keyof Curso,
      sortable: true,
      render: (_val: any, row: Curso) => row.responsaveltecnico?.nome || "—",
    },
    {
      header: "Carga Horária",
      accessor: "cargaHoraria" as keyof Curso,
      sortable: true,
      render: (_val: any, row: Curso) => `${formatarMinutosEmHoras(row.cargaHoraria)}`,
    },
    {
      header: "Descrição",
      accessor: "descricao" as keyof Curso,
    },
  ];

  useEffect(() => {
    buscarCursos();
  }, [busca, filtros]);

  const buscarCursos = async () => {
    const res = await getCursos({ busca, filtros });
    setCursos(res.data);
  };

  const handleEditCurso = (curso: Curso) => {
    navigate(`/cursos/${curso.idCurso}?modo=ver`);
  };

  const handleNovoCurso = () => {
    const isAdmin = user?.role?.includes("admin");

    if (isAdmin) {
      navigate("/cursos/novo");
    } else {
      navigate(`/cursos/novo?fkEmpresaId=${user?.fkEmpresaId}`);
    }
  };

  return (
    <div className="p-4 rounded-md shadow-md bg-white">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Cursos</h1>
        <button
          className="bg-sky-600 text-white px-4 py-2 rounded cursor-pointer text-sm"
          onClick={handleNovoCurso}
        >
          + Novo Curso
        </button>
      </div>

      <FiltrosCursos busca={busca} setBusca={setBusca} filtros={filtros} setFiltros={setFiltros} />

      <TabelaBase
        columns={columns}
        data={cursos}
        itemsPerPage={10}
        onEdit={handleEditCurso}
      />

    </div>
  );
}
