// CursosPage.tsx
import { useEffect, useState } from "react";
import type { Curso } from "../../types/EstruturaCurso";
import { getCursos } from "../../services/apiCurso";

// Componentes
import TabelaCursos from "../../components/Tabelas/TabelaCursos";
import FiltrosCursos from "../../components/FiltrosCursos";

export default function CursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [page, setPage] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [busca, setBusca] = useState("");
  const [filtros, setFiltros] = useState<{ categoria: string | null; ativo: string | null }>({
    categoria: null,
    ativo: null,
  });

  useEffect(() => {
    buscarCursos();
  }, [page, busca, filtros]);

  const buscarCursos = async () => {
    const res = await getCursos({ page, busca, filtros });
    setCursos(res.data);
    setTotalPaginas(res.totalPaginas);
  };

  return (
    <div className="p-4 rounded-md shadow-md bg-white">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Cursos</h1>
        <button className="bg-sky-600 text-white px-4 py-2 rounded">+ Novo Curso</button>
      </div>

      <FiltrosCursos busca={busca} setBusca={setBusca} filtros={filtros} setFiltros={setFiltros} />

      <TabelaCursos cursos={cursos} />

      <div className="flex justify-end gap-2 mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Anterior
        </button>
        <span>Página {page} de {totalPaginas}</span>
        <button
          disabled={page === totalPaginas}
          onClick={() => setPage(p => p + 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
