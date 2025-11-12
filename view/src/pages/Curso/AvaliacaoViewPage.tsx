import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, ClipboardList } from "lucide-react";
import { getAvaliacaoPorId } from "../../services/apiAvaliacao";
import toast from "react-hot-toast";
import Loading from "../../components/Loading";
import type { Avaliacao } from "../../types/EstruturaCurso";

export default function AvaliacaoViewPage() {
  const { id, idModulo, idAula, idAvaliacao } = useParams();
  const navigate = useNavigate();
  const [avaliacao, setAvaliacao] = useState<Avaliacao | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAvaliacaoPorId(Number(idAvaliacao))
      .then(setAvaliacao)
      .catch(() => toast.error("Erro ao carregar avaliação"))
      .finally(() => setLoading(false));
  }, [idAvaliacao]);

  if (loading) return <Loading />;
  if (!avaliacao) return <p className="text-center text-gray-500">Avaliação não encontrada.</p>;

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
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <ClipboardList className="text-blue-500" /> {avaliacao.titulo}
            </h1>
            <p className="text-gray-500 text-sm">{avaliacao.descricao}</p>
          </div>
        </div>

        <button
          onClick={() =>
            navigate(
              `/cursos/${id}/modulo/${idModulo}/aula/${idAula}/avaliacao/${idAvaliacao}/editar`
            )
          }
          className="flex items-center gap-2 text-blue-600 cursor-pointer hover:bg-gray-200 px-3 py-1.5 rounded-md hover:opacity-90 transition"
        >
          <Edit size={16} />
          Editar
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-700">Detalhes da Avaliação</h2>

        <p><strong>Título:</strong> {avaliacao.titulo}</p>
        <p><strong>Descrição:</strong> {avaliacao.descricao}</p>
        <p><strong>Quantidade de perguntas:</strong> {avaliacao.perguntas?.length ?? 0}</p>

        <div className="mt-4">
          <h3 className="font-semibold text-gray-600 mb-2">Perguntas</h3>
          {avaliacao.perguntas?.length ? (
            <ul className="space-y-2">
              {avaliacao.perguntas.map((p) => (
                <li
                  key={p.idPergunta}
                  className="p-3 bg-gray-50 border border-gray-100 rounded-md"
                >
                  <p className="font-medium text-gray-700">{p.enunciado}</p>
                  <ul className="list-disc pl-6 text-sm text-gray-600 mt-1">
                    {p.alternativas.map((alt: any) => (
                      <li key={alt.idAlternativa}>
                        {alt.texto}{" "}
                        {alt.correta ? (
                          <span className="text-green-600 font-semibold">(correta)</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Nenhuma pergunta adicionada.</p>
          )}
        </div>
      </div>
    </div>
  );
}
