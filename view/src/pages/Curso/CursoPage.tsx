import { useEffect, useState } from "react";
import type { Curso } from "../../types/EstruturaCurso";
import { getCursos } from "../../services/apiCurso";

// Componentes
import TabelaBase from "../../components/Tabelas/TabelaBase";
import FiltrosCursos from "../../components/Filtros/FiltrosCursos";
import ModalCurso from "../../components/Modais/ModalCurso";
import { makeCurso } from "../../types/FactoriesCurso";
import { useAuth } from "../../contexts/AuthContext";

export default function CursosPage() {
  const { user } = useAuth();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [busca, setBusca] = useState("");
  const [filtros, setFiltros] = useState<{ categoria: string | null; ativo: string | null }>({
    categoria: null,
    ativo: null,
  });
  const [isOpenModalCurso, setIsOpenModalCurso] = useState(false);
  const [cursoSelecionado, setCursoSelecionado] = useState<Curso | null>(null);

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
    setCursoSelecionado(curso);
    setIsOpenModalCurso(true);
  };

  const handleNovoCurso = () => {
    let novoCurso: Curso;

    const isAdmin = user?.role?.includes("admin");

    if (isAdmin) {
      novoCurso = makeCurso();
    } else {
      novoCurso = makeCurso({ fkEmpresaId: user?.fkEmpresaId });
    }

    setCursoSelecionado(novoCurso);
    setIsOpenModalCurso(true);
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

      <ModalCurso
        isOpen={isOpenModalCurso}
        onClose={() => setIsOpenModalCurso(false)}
        cursoSelecionado={cursoSelecionado}
        onSaved={() => buscarCursos()}
      />

    </div>
  );
}
