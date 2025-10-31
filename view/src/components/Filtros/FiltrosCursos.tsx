import { useEffect, useState } from "react";
import type { Categoria } from "../../types/EstruturaCurso";
import { getCategorias } from "../../services/apiCurso";
import { Search } from "lucide-react";

interface Filtros {
  categoria: string | null;
  ativo: string | null;
}

interface Props {
  busca: string;
  setBusca: (valor: string) => void;
  filtros: Filtros;
  setFiltros: (filtros: Filtros) => void;
}

export default function FiltrosCursos({ busca, setBusca, filtros, setFiltros }: Props) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    const fetchCategorias = async () => {
      const data = await getCategorias();
      setCategorias(data);
    };
    fetchCategorias();
  }, []);

  return (
    <div className="w-full mb-4">

      {/* Select + Search input */}
      <div className="flex w-full border border-gray-300 rounded-md overflow-hidden bg-white">
        {/* Categoria dropdown */}
        <select
          value={filtros.categoria || ""}
          onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value || null })}
          className="px-3 py-2 bg-white text-sm text-gray-700 focus:outline-none border-r border-gray-200"
        >
          <option value="">Todas as categorias</option>
          {categorias.map((cat) => (
            <option key={cat.idCategoria} value={String(cat.idCategoria)}>
              {cat.nome}
            </option>
          ))}
        </select>

        {/* Input de busca */}
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar cursos..."
          className="flex-1 px-3 py-2 text-sm focus:outline-none"
        />

        {/* Botão de pesquisa (estilizado com ícone) */}
        <button
          type="button"
          className="px-4 bg-sky-600 text-white hover:bg-sky-700 transition-all cursor-pointer"
        >
          <Search size={15}/>
        </button>
      </div>

    </div>
  );
}
