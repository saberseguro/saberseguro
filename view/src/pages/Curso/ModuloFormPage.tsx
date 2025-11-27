import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import Loading from "../../components/Loading";
import { getModuloPorId, salvarModulo, editarModulo } from "../../services/apiModulo";
import type { Modulo } from "../../types/EstruturaCurso";
import { formatarMinutosEmHoras } from "../../auxiliares/formatters";

export default function ModuloFormPage() {
  const { id, idModulo } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [modulo, setModulo] = useState<Modulo | null>(null);
  const [loading, setLoading] = useState(true);
  const modo = idModulo ? "editar" : "criar";

  useEffect(() => {
    if (!idModulo) {
      const ordemParam = Number(params.get("ordem")) || 1;

      setModulo({
        idModulo: 0,
        titulo: "",
        descricao: "",
        ordem: ordemParam,
        cargaHoraria: 0,
        fkCursoId: Number(id),
        aulas: [],
      });
      setLoading(false);
    } else {
      getModuloPorId(Number(idModulo))
        .then(setModulo)
        .catch(() => toast.error("Erro ao carregar módulo"))
        .finally(() => setLoading(false));
    }
  }, [idModulo]);


  const handleSalvar = async () => {
    try {
      setLoading(true);
      const salvo =
        modo === "criar"
          ? await salvarModulo(modulo!)
          : await editarModulo(modulo!.idModulo as number, modulo!);
      toast.success("Módulo salvo com sucesso!");
      navigate(`/cursos/${id}/modulo/${salvo.idModulo}`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar módulo");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;
  if (!modulo) return null;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-gray-300 pb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/cursos/${id}${modo === "criar" ? "" : `/modulo/${modulo.idModulo}`}`)}
            className="p-2 hover:bg-gray-200 rounded-full transition cursor-pointer"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-700">
            {modo === "criar" ? "Novo Módulo" : `Editar Módulo #${modulo.idModulo}`}
          </h1>
        </div>
      </div>

      {/* Formulário */}
      <div className="bg-white rounded-md border border-gray-200 p-6 space-y-4">

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Título
            </label>
            <input
              type="text"
              value={modulo.titulo}
              onChange={(e) => setModulo({ ...modulo, titulo: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Carga Horária (minutos)
            </label>

            <div className="flex items-center gap-2">
              <input
                type="number"
                value={modulo.cargaHoraria || 0}
                onChange={(e) =>
                  setModulo({ ...modulo, cargaHoraria: Number(e.target.value) })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
              <span className="text-xs text-gray-500 whitespace-nowrap">
                ({formatarMinutosEmHoras(modulo.cargaHoraria)})
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Botão Salvar */}
      <div className="text-end">
        <button
          className="bg-blue-600 text-white px-8 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
          onClick={handleSalvar}
          disabled={loading}
        >
          {loading ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}