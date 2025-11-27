import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import Loading from "../../components/Loading";
import { getAulaPorId, salvarAula, editarAula } from "../../services/apiAula";
import type { Aula } from "../../types/EstruturaCurso";
import { formatarMinutosEmHoras } from "../../auxiliares/formatters";
import { SelectInput } from "../../components/Formularios/Inputs";

export default function AulaFormPage() {
  const { id, idModulo, idAula } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [aula, setAula] = useState<Aula | null>(null);
  const [loading, setLoading] = useState(true);
  const modo = idAula ? "editar" : "criar";

  useEffect(() => {
    if (modo === "criar") {
      const ordemParam = Number(params.get("ordem")) || 1;
      setAula({
        idAula: 0,
        titulo: "",
        descricao: "",
        duracao: 0,
        ordem: ordemParam,
        fkModuloId: Number(idModulo),
        steps: [],
      });
      setLoading(false);
      return;
    }

    // 🟦 Se for edição
    getAulaPorId(Number(idAula))
      .then(setAula)
      .catch(() => toast.error("Erro ao carregar aula"))
      .finally(() => setLoading(false));
  }, [idAula, modo, params]);

  const handleSalvar = async () => {
    try {
      setLoading(true);
      const salvo =
        modo === "criar"
          ? await salvarAula(aula!)
          : await editarAula(aula!.idAula as number, aula!);
      toast.success("Aula salva com sucesso!");
      navigate(`/cursos/${id}/modulo/${idModulo}/aula/${salvo.idAula}`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar aula");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;
  if (!aula) return null;

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/cursos/${id}/modulo/${idModulo}`)}
            className="p-2 hover:bg-gray-200 rounded-full transition cursor-pointer"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-700">
            {modo === "criar" ? "Nova Aula" : `Editar Aula #${aula.idAula}`}
          </h1>
        </div>
      </div>

      {/* Campos principais */}
      <div className="bg-white rounded-md border border-gray-200 p-6 space-y-4">
        {/* Título */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Título</label>
            <input
              type="text"
              value={aula.titulo}
              onChange={(e) => setAula({ ...aula, titulo: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          {/* Carga Horária */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Carga Horária (minutos)
            </label>

            <div className="flex items-center gap-2">
              <input
                type="number"
                value={aula.duracao || 0}
                onChange={(e) => setAula({ ...aula, duracao: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
              <span className="text-xs text-gray-500 whitespace-nowrap">
                ({formatarMinutosEmHoras(aula.duracao)})
              </span>
            </div>
          </div>
        </div>

        {/* Tipo (enum/seleção) */}
        <SelectInput
          label="Tipo"
          name="tipo"
          value={aula.tipo ?? ""}
          onChange={(e) => setAula({ ...aula, tipo: e.target.value })}
          required={true}
          options={[
            { value: "video", label: "Vídeo" },
          ]}
        />

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Descrição</label>
          <textarea
            rows={3}
            value={aula.descricao}
            onChange={(e) => setAula({ ...aula, descricao: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none"
          />
        </div>
      </div>

      {/* Botão salvar */}
      <div className="text-end">
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSalvar}
          disabled={loading}
        >
          {loading ? "Salvando..." : "Salvar Aula"}
        </button>
      </div>
    </div>
  );
}