import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { getPergunta, excluirPergunta } from "../../services/apiPergunta";
import type { Pergunta } from "../../types/EstruturaCurso";

export default function PerguntaViewPage() {
  const { idPergunta, idAvaliacao, id, idModulo, idAula } = useParams();
  const navigate = useNavigate();

  const [pergunta, setPergunta] = useState<Pergunta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!idPergunta) return;

    getPergunta(Number(idPergunta))
      .then((resp) => {
        setPergunta({
          idPergunta: resp.idPergunta,
          enunciado: resp.enunciado,
          tipo: resp.tipo,
          alternativas:
            resp.alternativas?.map((a: any) => ({
              idAlternativa: a.idAlternativa,
              texto: a.texto,
              correta: a.correta,
            })) ?? [],
        });
      })
      .catch(() => toast.error("Erro ao carregar pergunta"))
      .finally(() => setLoading(false));
  }, [idPergunta]);

  if (loading) return <p className="text-gray-500">Carregando...</p>;
  if (!pergunta) return <p className="text-gray-500">Pergunta não encontrada.</p>;

  const voltar = () => {
    // Avaliação do curso
    if (!idModulo && !idAula) navigate(`/cursos/${id}/avaliacao/${idAvaliacao}`);

    // Avaliação dentro da aula
    else navigate(`/cursos/${id}/modulo/${idModulo}/aula/${idAula}/avaliacao/${idAvaliacao}`);
  };

  const handleExcluir = async () => {
    const confirmar = confirm("Deseja realmente excluir esta pergunta?");
    if (!confirmar) return;

    try {
      await excluirPergunta(Number(idPergunta));
      toast.success("Pergunta excluída!");
      voltar();
    } catch {
      toast.error("Erro ao excluir pergunta");
    }
  };

  return (
    <div className="p-6 space-y-4 bg-white rounded shadow border">

      {/* BOTÃO VOLTAR */}
      <button
        onClick={voltar}
        className="text-sm text-blue-600 hover:underline"
      >
        ← Voltar
      </button>

      {/* TÍTULO */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{pergunta.enunciado}</h2>

        <div className="flex gap-3">
          <button
            className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() =>
              navigate(
                !idModulo && !idAula
                  ? `/cursos/${id}/avaliacao/${idAvaliacao}/pergunta/${idPergunta}/editar`
                  : `/cursos/${id}/modulo/${idModulo}/aula/${idAula}/avaliacao/${idAvaliacao}/pergunta/${idPergunta}/editar`
              )
            }
          >
            Editar
          </button>

          <button
            className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={handleExcluir}
          >
            Excluir
          </button>
        </div>
      </div>

      {/* TIPO */}
      <p className="text-gray-600">
        <strong>Tipo:</strong>{" "}
        {pergunta.tipo === "OBJETIVA" ? "Objetiva" : "Discursiva"}
      </p>

      {/* ALTERNATIVAS */}
      {pergunta.tipo === "OBJETIVA" && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Alternativas:</h3>
          <ul className="space-y-2">
            {pergunta.alternativas?.map((alt, idx) => (
              <li
                key={idx}
                className={`
                  p-2 rounded border 
                  ${alt.correta ? "bg-green-100 border-green-400" : "bg-gray-100"}
                `}
              >
                {alt.texto}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* DISCURSIVA */}
      {pergunta.tipo === "DISCURSIVA" && (
        <p className="text-gray-600 italic">Resposta discursiva (sem alternativas)</p>
      )}
    </div>
  );
}