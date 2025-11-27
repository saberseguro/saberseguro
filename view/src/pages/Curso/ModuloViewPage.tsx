import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Clock, Edit, Plus } from "lucide-react";
import { getModuloPorId } from "../../services/apiModulo";
import Loading from "../../components/Loading";
import toast from "react-hot-toast";
import type { Modulo } from "../../types/EstruturaCurso";
import SortableAulas from "../../components/SortableAula";
import { formatarMinutosEmHoras } from "../../auxiliares/formatters";

export default function ModuloViewPage() {
  const { id, idModulo } = useParams();
  const navigate = useNavigate();
  const [modulo, setModulo] = useState<Modulo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getModuloPorId(Number(idModulo))
      .then(setModulo)
      .catch(() => toast.error("Erro ao carregar módulo"))
      .finally(() => setLoading(false));
  }, [idModulo]);

  if (loading) return <Loading />;
  if (!modulo) return <p className="text-center text-gray-500">Módulo não encontrado.</p>;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/cursos/${id}`)}
            className="p-2 hover:bg-gray-200 rounded-full transition cursor-pointer"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>

          <div>
            <h1 className="text-2xl font-bold text-gray-800">{modulo.titulo}</h1>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 bg-green-50 border border-green-300 text-green-500 px-2 py-0.5 rounded-full text-xs font-medium">
                <BookOpen size={14} />
                Módulo {modulo.ordem || 1}
              </span>

              <span className="flex items-center gap-1.5 bg-blue-50 border border-blue-300 text-blue-500 px-2 py-0.5 rounded-full text-xs font-medium">
                <Clock size={14} />
                {formatarMinutosEmHoras(modulo.cargaHoraria)}
              </span>
            </div>
          </div>
        </div>

        {/* Botão Editar */}
        <button
          onClick={() => navigate(`/cursos/${id}/modulo/${modulo.idModulo}/editar`)}
          className="flex items-center gap-2 text-blue-600 cursor-pointer hover:bg-gray-200 px-3 py-1.5 rounded-md hover:opacity-90 transition"
        >
          <Edit size={16} />
          Editar
        </button>
      </div>

      {/* Lista de aulas */}
      <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-700">
            Aulas do Módulo ({modulo.aulas?.length || 0})
          </h2>
          <button
            onClick={() =>
              navigate(`/cursos/${id}/modulo/${modulo.idModulo}/aula/novo?ordem=${modulo.aulas?.length + 1}`)
            }
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-md hover:opacity-90 cursor-pointer"
          >
            <Plus size={16} /> Adicionar Aula
          </button>
        </div>

        {modulo.aulas?.length ? (
          <SortableAulas
            items={modulo.aulas}
            onReorder={(novasAulas) =>
              setModulo((prev) =>
                prev ? { ...prev, aulas: novasAulas } : prev
              )
            }
          />
        ) : (
          <p className="text-sm text-gray-500">Nenhuma aula cadastrada.</p>
        )}

      </div>
    </div>
  );
}
