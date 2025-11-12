import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAvaliacaoPorId, salvarAvaliacao, editarAvaliacao } from "../../services/apiAvaliacao";
import toast from "react-hot-toast";
import Loading from "../../components/Loading";
import type { Avaliacao } from "../../types/EstruturaCurso";

interface Props {
  modo?: "criar" | "editar";
}

export default function AvaliacaoFormPage({ modo = "editar" }: Props) {
  const { id, idModulo, idAula, idAvaliacao } = useParams();
  const navigate = useNavigate();
  const [avaliacao, setAvaliacao] = useState<Avaliacao | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (modo === "criar") {
      setAvaliacao({
        idAvaliacao: 0,
        titulo: "",
        descricao: "",
        tempo_limite: 0,
        tipoAplicacao: "AULA",
        ordem: 1,
        ativo: 1,
        perguntas: [],
        avaliacoesUsuarios: [],
      });
      setLoading(false);
    } else {
      getAvaliacaoPorId(Number(idAvaliacao))
        .then(setAvaliacao)
        .catch(() => toast.error("Erro ao carregar avaliação"))
        .finally(() => setLoading(false));
    }
  }, [idAvaliacao, modo]);

  const handleSalvar = async () => {
    try {
      setLoading(true);
      let salvo;
      if (modo === "criar") salvo = await salvarAvaliacao(avaliacao!);
      else salvo = await editarAvaliacao(avaliacao!.idAvaliacao as number, avaliacao!);

      toast.success("Avaliação salva com sucesso!");
      navigate(
        `/cursos/${id}/modulo/${idModulo}/aula/${idAula}/avaliacao/${salvo.idAvaliacao}`
      );
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar avaliação");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center border-b pb-3">
        <h1 className="text-2xl font-semibold text-gray-700">
          {modo === "criar" ? "Nova Avaliação" : `Editar Avaliação #${avaliacao?.idAvaliacao}`}
        </h1>
        <button
          onClick={() => navigate(`/cursos/${id}/modulo/${idModulo}/aula/${idAula}`)}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Voltar
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Título</label>
          <input
            type="text"
            className="w-full border rounded-md p-2"
            value={avaliacao?.titulo || ""}
            onChange={(e) =>
              setAvaliacao((prev) => (prev ? { ...prev, titulo: e.target.value } : prev))
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Descrição</label>
          <textarea
            className="w-full border rounded-md p-2"
            rows={3}
            value={avaliacao?.descricao || ""}
            onChange={(e) =>
              setAvaliacao((prev) => (prev ? { ...prev, descricao: e.target.value } : prev))
            }
          />
        </div>
      </div>

      <div className="pt-4">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={handleSalvar}
        >
          Salvar
        </button>
      </div>
    </div>
  );
}
