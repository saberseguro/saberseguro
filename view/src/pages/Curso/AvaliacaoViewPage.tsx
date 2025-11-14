import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Clock, BookOpen, LibraryBig, Eye } from "lucide-react";
import { getAvaliacaoPorId } from "../../services/apiAvaliacao";
import toast from "react-hot-toast";
import Loading from "../../components/Loading";
import type { Avaliacao } from "../../types/EstruturaCurso";
import { formatarMinutosEmHoras } from "../../auxiliares/formatters";

interface Props {
  tipo: "CURSO" | "MODULO" | "AULA";
}

export default function AvaliacaoViewPage({ tipo }: Props) {
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
            onClick={() =>
              tipo === "CURSO"
                ? navigate(`/cursos/${id}`)
                : navigate(`/cursos/${id}/modulo/${idModulo}/aula/${idAula}`)
            }
            type="button"
            className="p-2 hover:bg-gray-200 rounded-full transition cursor-pointer"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <div className="flex flex-col gap-2">

            <h1 className="text-2xl font-bold text-gray-800">{avaliacao.titulo} #{idAvaliacao}</h1>

            <div className="flex items-center gap-2">

              {/* Badge tipo */}
              <span className="flex items-center gap-1 px-3 py-1 rounded-full border border-green-400 bg-green-50 text-green-600 text-xs uppercase">
                <BookOpen size={14} />
                {avaliacao.tipoAplicacao}
              </span>

              {/* Badge Perguntas */}
              <span className="flex items-center gap-1 px-3 py-1 rounded-full border border-yellow-400 bg-yellow-50 text-yellow-600 text-xs">
                <LibraryBig size={14} />
                {avaliacao.perguntas?.length}
              </span>

              {/* Badge tempo */}
              <span className="flex items-center gap-1 px-3 py-1 rounded-full border border-blue-400 bg-blue-50 text-blue-600 text-xs">
                <Clock size={14} />
                {formatarMinutosEmHoras(avaliacao.tempo_limite)}
              </span>

            </div>

          </div>

        </div>

        <button
          onClick={() =>
            tipo === "CURSO"
              ? navigate(`/cursos/${id}/avaliacao/${idAvaliacao}/editar`)
              : navigate(`/cursos/${id}/modulo/${idModulo}/aula/${idAula}/avaliacao/${idAvaliacao}/editar`)
          }
          type="button"
          className="flex items-center gap-2 text-blue-600 cursor-pointer hover:bg-gray-200 px-3 py-1.5 rounded-md hover:opacity-90 transition"
        >
          <Edit size={16} />
          Editar
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Perguntas</h2>

            <button
              onClick={() =>
                navigate(`/cursos/${id}/avaliacao/${idAvaliacao}/pergunta/novo`)
              }
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer transition"
            >
              + Adicionar Pergunta
            </button>
          </div>

          {avaliacao.perguntas?.length ? (
            <ul className="space-y-2">
              {avaliacao.perguntas.map((p) => (
                <li
                  key={p.idPergunta}
                  className="p-3 bg-gray-50 border border-gray-100 rounded-md"
                >
                  <div className="flex justify-between items-center gap-4">
                    <div>
                      <p className="font-medium text-gray-700">{p.enunciado}</p>
                      <ol className="list-[lower-alpha] pl-6 text-sm text-gray-600 mt-1">
                        {p.alternativas.map((alt: any) => (
                          <li key={alt.idAlternativa}>
                            {alt.texto}{" "}
                            {alt.correta ? (
                              <span className="text-green-600 font-semibold">(correta)</span>
                            ) : null}
                          </li>
                        ))}
                      </ol>
                    </div>
                    <button
                      onClick={() => navigate(`/cursos/${id}/avaliacao/${idAvaliacao}/pergunta/${p.idPergunta}/editar`)}
                      className="text-gray-600 hover:text-blue-600 cursor-pointer mx-2"
                      title="Ver avaliação"
                    >
                      <Eye size={18} />
                    </button>
                  </div>
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
