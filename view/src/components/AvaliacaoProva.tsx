import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  Eye,
  RefreshCcw,
  Play,
  Award,
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
  setAvaliacoesRespondidasMap: React.Dispatch<
    React.SetStateAction<Record<number, any>>
  >;
  setVerDetalhes: (valor: boolean) => void;
  handleGerarCertificado?: () => void;
  idCurso: number;
  setLiberadoProximo: React.Dispatch<React.SetStateAction<boolean>>;
  registrarStepBackend: (step: Step) => Promise<void>;
}

export default function AvaliacaoProva({
  step,
  avaliacao,
  setAvaliacoesRespondidasMap,
  handleGerarCertificado,
  idCurso,
  setLiberadoProximo,
  registrarStepBackend,
}: AvaliacaoProvaProps) {
  const isCurso = step.tipo === "avaliacao_curso";

  const [loading, setLoading] = useState(false);
  const [avaliacaoIniciada, setAvaliacaoIniciada] = useState(false);
  const [inicioAvaliacao, setInicioAvaliacao] = useState<Date | null>(null);
  const [respostasSelecionadas, setRespostasSelecionadas] = useState<Record<number, string[] | number[]>>({});
  const [tentativas, setTentativas] = useState<any[]>([]);
  const [mostrarTentativas, setMostrarTentativas] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const notaMinima = avaliacao?.notaMinima ?? 7;
  const aprovado = tentativas.some((t) => t.nota >= notaMinima);

  const carregarTentativas = async () => {
    if (!step?.fkAvaliacaoId) {
      setTentativas([]);
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setTentativas([]);
    setAvaliacaoIniciada(false);
    setInicioAvaliacao(null);
    setRespostasSelecionadas({});
    setLiberadoProximo(false);

    try {
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
        setLiberadoProximo(true);
      } else {
        setLiberadoProximo(false);
      }
    } catch (e) {
      console.error("Erro ao buscar tentativas:", e);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarTentativas();
  }, [step?.fkAvaliacaoId]);

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

  const handleFinalizar = async () => {
    if (!inicioAvaliacao || !step.fkAvaliacaoId) return;

    const confirm = await Swal.fire({
      title: "Enviar avaliação?",
      text: "Depois de enviada, não será possível alterar suas respostas.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sim, enviar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#d33",
      reverseButtons: true,
    });

    if (!confirm.isConfirmed) return;

    const fim = new Date();
    const duracaoSegundos = Math.floor((fim.getTime() - inicioAvaliacao.getTime()) / 1000);
    const respostas = Object.entries(respostasSelecionadas).map(([idPergunta, alternativas]) => ({
      idPergunta: Number(idPergunta),
      alternativas,
    }));

    try {
      await enviarAvaliacao(step.fkAvaliacaoId!, respostas, duracaoSegundos);
      await finalizarAvaliacaoBackend(step.fkAvaliacaoId!);
      setLiberadoProximo(true);
      registrarStepBackend(step);

      toast.success("Avaliação finalizada!");
      setAvaliacaoIniciada(false);
      await carregarTentativas();

      if (isCurso && tentativas.length > 0) {
        const ultima = tentativas.reduce((a, b) =>
          new Date(a.dataFim).getTime() > new Date(b.dataFim).getTime() ? a : b
        );

        if (ultima?.nota >= notaMinima) {
          await finalizarCurso(idCurso);
          toast.success("Curso finalizado com sucesso!");
          handleGerarCertificado?.();
        }
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
        <div className="flex items-center gap-3 justify-center text-xs text-gray-600 mt-2">
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
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm shadow-sm cursor-pointer"
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
              ) : avaliacao.tipo === "avaliacao_curso" && (
                <p className="text-gray-600">
                  Última nota: <strong>{tentativas[0]?.nota ?? 0}</strong>
                </p>
              )}

              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => setMostrarTentativas(!mostrarTentativas)}
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm cursor-pointer flex items-center justify-center"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  <p>{mostrarTentativas ? "Ocultar Tentativas" : "Ver Tentativas"}</p>
                </button>

                <button
                  onClick={iniciarOuRefazer}
                  className="px-6 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm cursor-pointer flex items-center justify-center"
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  <p>Refazer Avaliação</p>
                </button>

                {isCurso && aprovado && (
                  <button
                    onClick={handleGerarCertificado}
                    className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm cursor-pointer shadow-sm flex items-center justify-center"
                  >
                    <Award className="w-4 h-4 mr-2" />
                    <p>Gerar Certificado</p>
                  </button>
                )}
              </div>

              {mostrarTentativas && tentativas.length > 0 && (
                <div className="border-t pt-4 text-left">
                  {tentativas.map((t) => (
                    <div key={t.idAvaliacaoUsuario} className={`rounded-md mb-2 px-4 py-2 border ${t.nota >= 7 ? "bg-green-50 border-green-300 text-green-600" : "bg-red-50 border-red-300 text-red-600"}`}>
                      <div
                        className="flex justify-between items-center cursor-pointer"
                      >
                        <p>
                          {new Date(t.dataFim).toLocaleString()}
                        </p>
                        <p>
                          Nota: <strong>{t.nota ?? "–"}</strong>
                        </p>
                      </div>
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
                {idx + 1}. {p.enunciado}
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
                      <span>{alt.texto}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="flex justify-end">
            <button
              onClick={handleFinalizar}
              className="px-6 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700 text-sm shadow-sm cursor-pointer"
            >
              Enviar Respostas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}