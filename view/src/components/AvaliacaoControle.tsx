import { Eye, RefreshCcw, Play, Award, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import {
  enviarAvaliacao,
  fetchResultadoAvaliacao,
  finalizarAvaliacaoBackend,
  finalizarCurso,
  iniciarAvaliacao,
} from "../services/apiCurso";
import type { Step } from "../types/EstruturaCurso";

interface AvaliacaoControleProps {
  step: Step;
  avaliacao: any;
  onFinalizar?: () => void;
  registrarStepBackend: (step: Step) => Promise<void>;
  setAvaliacoesRespondidasMap: React.Dispatch<
    React.SetStateAction<Record<number, any>>
  >;
  marcarConcluido: (idAulaStep: number | string) => void;
  setVerDetalhes: (valor: boolean) => void;
  handleGerarCertificado?: () => void;
  idCurso: number;
}

export default function AvaliacaoControle({
  step,
  avaliacao,
  registrarStepBackend,
  setAvaliacoesRespondidasMap,
  marcarConcluido,
  setVerDetalhes,
  handleGerarCertificado,
  idCurso,
}: AvaliacaoControleProps) {
  const tentativa = step.avaliacao?.avaliacoesUsuarios?.[0];
  const isCurso = step.tipo === "avaliacao_curso";
  const status = tentativa?.status;
  const nota = tentativa?.nota ?? null;
  const aprovado = status === "concluida" && nota >= 7;

  // Estados locais
  const [loading, setLoading] = useState(false);
  const [avaliacaoIniciada, setAvaliacaoIniciada] = useState(false);
  const [inicioAvaliacao, setInicioAvaliacao] = useState<Date | null>(null);
  const [respostasSelecionadas, setRespostasSelecionadas] = useState<Record<number, string[] | number[]>>({});
  const [tentativas, setTentativas] = useState<any[]>([]);
  const [mostrarTentativas, setMostrarTentativas] = useState(false);
  const [tentativaAberta, setTentativaAberta] = useState<number | null>(null);

  // Carregar tentativas anteriores
  const carregarTentativas = async () => {
    if (!step.fkAvaliacaoId) return;
    try {
      setLoading(true);
      const { tentativas } = await fetchResultadoAvaliacao(step.fkAvaliacaoId);
      setTentativas(tentativas || []);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar tentativas.");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (step.fkAvaliacaoId) carregarTentativas();
  }, [step.fkAvaliacaoId]);

  // Iniciar Avaliação
  const handleIniciar = async () => {
    try {
      setLoading(true);
      if (!step.fkAvaliacaoId) return toast.error("Avaliação inválida.");
      await iniciarAvaliacao(step.fkAvaliacaoId!);
      setInicioAvaliacao(new Date());
      setAvaliacaoIniciada(true);
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível iniciar a avaliação.");
    } finally {
      setLoading(false);
    }
  };

  // Refazer Avaliação
  const handleRefazer = async () => {
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
      toast.error("Não foi possível iniciar novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Finalizar Avaliação
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
      const resultado = await fetchResultadoAvaliacao(step.fkAvaliacaoId!);

      const tentativaMaisRecente = resultado.tentativas?.reduce(
        (maisRecente, atual) => {
          const dataAtual = new Date(atual.dataFim).getTime();
          const dataMaisRecente = new Date(maisRecente.dataFim).getTime();
          return dataAtual > dataMaisRecente ? atual : maisRecente;
        }
      );

      setAvaliacoesRespondidasMap(prev => ({
        ...prev,
        [step.fkAvaliacaoId!]: {
          nota: tentativaMaisRecente?.nota ?? null,
          status: "concluida",
        },
      }));

      marcarConcluido(step.idAulaStep);
      setAvaliacaoIniciada(false);
      setVerDetalhes(true);
      await carregarTentativas();

      if (isCurso && tentativaMaisRecente?.nota >= 7) {
        await finalizarCurso(idCurso);
        toast.success("Curso finalizado com sucesso!");
        if (handleGerarCertificado) handleGerarCertificado();
      } else {
        toast.success("Avaliação finalizada!");
      }
    } catch (e) {
      console.error("Erro ao finalizar avaliação:", e);
      toast.error("Erro ao enviar avaliação.");
    }
  };

  // Ver resultados (abrir lista de tentativas)
  const handleVerResultados = async () => {
    if (!mostrarTentativas) await carregarTentativas();
    setMostrarTentativas(!mostrarTentativas);
  };

  return (
    <div className="flex flex-col gap-4 mt-4">
      {/* Botões principais */}
      {!avaliacaoIniciada && !status && (
        <button
          disabled={loading}
          onClick={handleIniciar}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm shadow-sm w-fit"
        >
          <Play className="inline-block w-4 h-4 mr-2" />
          Iniciar Avaliação
        </button>
      )}

      {/* Corpo da Avaliação */}
      {avaliacaoIniciada && step.avaliacao?.perguntas?.length > 0 && (
        <div className="mt-6 space-y-6">
          {step.avaliacao.perguntas.map((pergunta: any, idx: number) => (
            <div key={pergunta.idPergunta} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-700 mb-3">
                {idx + 1}. {pergunta.titulo}
              </h3>

              <ul className="space-y-2">
                {pergunta.alternativas.map((alt: any) => (
                  <li key={alt.idAlternativa}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`pergunta-${pergunta.idPergunta}`}
                        value={alt.idAlternativa}
                        onChange={() =>
                          setRespostasSelecionadas(prev => ({
                            ...prev,
                            [pergunta.idPergunta]: [alt.idAlternativa],
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

      {/* Tentativas anteriores */}
      {status === "concluida" && !avaliacaoIniciada && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleVerResultados}
              className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm shadow-sm"
            >
              <Eye className="inline-block w-4 h-4 mr-2" />
              {mostrarTentativas ? "Ocultar Tentativas" : "Ver Tentativas"}
            </button>

            <button
              onClick={handleRefazer}
              className="px-6 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm shadow-sm"
            >
              <RefreshCcw className="inline-block w-4 h-4 mr-2" />
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
            <div className="border-t pt-4">
              {tentativas.map((t) => (
                <div key={t.idAvaliacaoUsuario} className="border rounded-lg mb-3 p-3 bg-gray-50">
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() =>
                      setTentativaAberta(tentativaAberta === t.idAvaliacaoUsuario ? null : t.idAvaliacaoUsuario)
                    }
                  >
                    <span className="font-medium text-gray-700">
                      Tentativa em {new Date(t.dataFim).toLocaleString()} – Nota: {t.nota ?? "–"}
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
  );
}
