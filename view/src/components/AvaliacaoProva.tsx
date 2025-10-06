import { useEffect, useState } from "react";
import {
  Eye,
  RefreshCcw,
  Play,
  Award,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Clock,
  ClipboardList,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  enviarAvaliacao,
  fetchResultadoAvaliacao,
  finalizarAvaliacaoBackend,
  finalizarCurso,
  iniciarAvaliacao,
} from "../services/apiCurso";
import type { Step } from "../types/EstruturaCurso";

interface AvaliacaoProvaProps {
  step: Step;
  avaliacao: any;
  registrarStepBackend: (step: Step) => Promise<void>;
  setAvaliacoesRespondidasMap: React.Dispatch<
    React.SetStateAction<Record<number, any>>
  >;
  marcarConcluido: (idAulaStep: number | string) => void;
  setVerDetalhes: (valor: boolean) => void;
  handleGerarCertificado?: () => void;
  idCurso: number;
}

export default function AvaliacaoProva({
  step,
  avaliacao,
  registrarStepBackend,
  setAvaliacoesRespondidasMap,
  marcarConcluido,
  setVerDetalhes,
  handleGerarCertificado,
  idCurso,
}: AvaliacaoProvaProps) {
  const isCurso = step.tipo === "avaliacao_curso";

  const [loading, setLoading] = useState(false);
  const [avaliacaoIniciada, setAvaliacaoIniciada] = useState(false);
  const [inicioAvaliacao, setInicioAvaliacao] = useState<Date | null>(null);
  const [respostasSelecionadas, setRespostasSelecionadas] = useState<Record<number, string[] | number[]>>({});
  const [tentativas, setTentativas] = useState<any[]>([]);
  const [mostrarTentativas, setMostrarTentativas] = useState(false);
  const [tentativaAberta, setTentativaAberta] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);

  const notaMinima = avaliacao?.notaMinima ?? 70;
  const aprovado = tentativas.some((t) => t.nota >= notaMinima);

  // 🔹 Buscar tentativas
  const carregarTentativas = async () => {
    if (!step.fkAvaliacaoId) return;
    try {
      setLoading(true);
      const { tentativas } = await fetchResultadoAvaliacao(step.fkAvaliacaoId);
      setTentativas(tentativas || []);
      if (tentativas?.length > 0) {
        const ultima = tentativas.reduce((a, b) =>
          new Date(a.dataFim).getTime() > new Date(b.dataFim).getTime() ? a : b
        );
        setAvaliacoesRespondidasMap((prev) => ({
          ...prev,
          [step.fkAvaliacaoId!]: {
            nota: ultima?.nota ?? 0,
            status: "concluida",
          },
        }));
      }
    } catch (e) {
      console.error("Erro ao buscar tentativas:", e);
    } finally {
      setLoading(false);
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarTentativas();
  }, [step.fkAvaliacaoId]);

  // 🔹 Iniciar / Refazer
  const iniciarOuRefazer = async () => {
    try {
      setLoading(true);
      if (!step.fkAvaliacaoId) return toast.error("Avaliação inválida.");
      await iniciarAvaliacao(step.fkAvaliacaoId!);
      setRespostasSelecionadas({});
      setInicioAvaliacao(new Date());
      setAvaliacaoIniciada(true);
      setMostrarTentativas(false);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao iniciar a avaliação.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Finalizar
  const handleFinalizar = async () => {
    if (!inicioAvaliacao || !step.fkAvaliacaoId) return;
    const fim = new Date();
    const duracaoSegundos = Math.floor((fim.getTime() - inicioAvaliacao.getTime()) / 1000);
    const respostas = Object.entries(respostasSelecionadas).map(([idPergunta, alternativas]) => ({
      idPergunta: Number(idPergunta),
      alternativas,
    }));

    try {
      await enviarAvaliacao(step.fkAvaliacaoId!, respostas, duracaoSegundos);
      await finalizarAvaliacaoBackend(step.fkAvaliacaoId!);
      await registrarStepBackend(step);
      marcarConcluido(step.idAulaStep);

      toast.success("Avaliação finalizada!");
      setAvaliacaoIniciada(false);
      await carregarTentativas();

      // Se for prova final do curso e aprovado
      const ultima = tentativas.reduce((a, b) =>
        new Date(a.dataFim).getTime() > new Date(b.dataFim).getTime() ? a : b
      );
      if (isCurso && ultima?.nota >= notaMinima) {
        await finalizarCurso(idCurso);
        toast.success("Curso finalizado com sucesso!");
        handleGerarCertificado?.();
      }
    } catch (e) {
      console.error("Erro ao finalizar avaliação:", e);
      toast.error("Erro ao enviar avaliação.");
    }
  };

  if (carregando) {
    return <p className="text-center text-sm text-gray-500">Carregando avaliação...</p>;
  }

  return (
    <div className="p-4 space-y-4">
      {/* Cabeçalho */}
      <div className="text-center rounded-lg w-full mb-4">
        <h3 className="text-xl font-bold text-gray-800 mb-3">{avaliacao?.titulo}</h3>
        <div className="flex items-center gap-3 justify-center text-xs text-gray-600 mt-2 mb-6">
          <div className="flex items-center gap-1 px-3 py-1 bg-yellow-50 border border-yellow-300 rounded-full">
            <BookOpen className="w-4 h-4 text-yellow-600" />
            <span>{avaliacao?.perguntas?.length ?? 0} pergunta(s)</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 border border-blue-300 rounded-full">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>{avaliacao?.tempo_limite ?? 0} min</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 bg-green-50 border border-green-300 rounded-full">
            {avaliacao?.tipoAplicacao === "quiz" ? (
              <ClipboardList className="w-4 h-4 text-green-500" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
            <span className="capitalize">{avaliacao?.tipoAplicacao ?? "avaliação"}</span>
          </div>
        </div>
      </div>

      {/* 1️⃣ Tela inicial / tentativas */}
      {!avaliacaoIniciada && (
        <div className="flex flex-col items-center gap-4">
          {tentativas.length === 0 ? (
            <button
              onClick={iniciarOuRefazer}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm shadow-sm"
            >
              <Play className="inline-block w-4 h-4 mr-2" />
              Iniciar Avaliação
            </button>
          ) : (
            <div className="space-y-3 text-center">
              {aprovado ? (
                <p className="text-green-600 font-medium">
                  ✅ Aprovado com nota {tentativas[0]?.nota}
                </p>
              ) : (
                <p className="text-gray-600">
                  Última nota: <strong>{tentativas[0]?.nota ?? 0}</strong>
                </p>
              )}

              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => setMostrarTentativas(!mostrarTentativas)}
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm cursor-pointer"
                >
                  <Eye className="inline-flex w-4 h-4 mr-2" />
                  {mostrarTentativas ? "Ocultar Tentativas" : "Ver Tentativas"}
                </button>

                <button
                  onClick={iniciarOuRefazer}
                  className="px-6 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm cursor-pointer"
                >
                  <RefreshCcw className="inline-flex w-4 h-4 mr-2" />
                  Refazer Avaliação
                </button>

                {isCurso && aprovado && (
                  <button
                    onClick={handleGerarCertificado}
                    className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm shadow-sm"
                  >
                    <Award className="inline-block w-4 h-4 mr-2" />
                    Gerar Certificado
                  </button>
                )}
              </div>

              {mostrarTentativas && tentativas.length > 0 && (
                <div className="border-t pt-4 text-left">
                  {tentativas.map((t) => (
                    <div key={t.idAvaliacaoUsuario} className="border rounded-lg mb-3 p-3 bg-gray-50">
                      <div
                        className="flex justify-between items-center cursor-pointer"
                        onClick={() =>
                          setTentativaAberta(tentativaAberta === t.idAvaliacaoUsuario ? null : t.idAvaliacaoUsuario)
                        }
                      >
                        <span className="font-medium text-gray-700">
                          {new Date(t.dataFim).toLocaleString()} – Nota: {t.nota ?? "–"}
                        </span>
                        {tentativaAberta === t.idAvaliacaoUsuario ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>

                      {tentativaAberta === t.idAvaliacaoUsuario && (
                        <div className="mt-3 pl-2 text-sm text-gray-700 space-y-2">
                          {t.perguntas?.map((p: any, idx: number) => (
                            <div key={p.idPergunta}>
                              <strong>{idx + 1}. {p.titulo}</strong>
                              <ul className="ml-4 list-disc">
                                {p.alternativas.map((alt: any) => (
                                  <li
                                    key={alt.idAlternativa}
                                    className={
                                      alt.correta
                                        ? "text-green-600"
                                        : p.respondida?.includes(alt.idAlternativa)
                                        ? "text-red-500"
                                        : ""
                                    }
                                  >
                                    {alt.titulo}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2️⃣ Tela de perguntas */}
      {avaliacaoIniciada && (
        <div className="mt-6 space-y-6">
          {avaliacao.perguntas?.map((p: any, idx: number) => (
            <div key={p.idPergunta} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-700 mb-3">
                {idx + 1}. {p.titulo}
              </h3>

              <ul className="space-y-2">
                {p.alternativas.map((alt: any) => (
                  <li key={alt.idAlternativa}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`pergunta-${p.idPergunta}`}
                        value={alt.idAlternativa}
                        onChange={() =>
                          setRespostasSelecionadas((prev) => ({
                            ...prev,
                            [p.idPergunta]: [alt.idAlternativa],
                          }))
                        }
                      />
                      <span>{alt.titulo}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <button
            onClick={handleFinalizar}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm shadow-sm"
          >
            Enviar Respostas
          </button>
        </div>
      )}
    </div>
  );
}