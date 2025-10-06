import { Eye, RefreshCcw, Play, Award } from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";
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
  const [respostasSelecionadas, setRespostasSelecionadas] = useState<
    Record<number, string[] | number[]>
  >({});

  // Iniciar Avaliação
  const handleIniciar = async () => {
    try {
      setLoading(true);

      if (!step.fkAvaliacaoId)
        return toast.error("Avaliação inválida.");
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

      if (!step.fkAvaliacaoId)
        return toast.error("Avaliação inválida.");
      await iniciarAvaliacao(step.fkAvaliacaoId!);

      setRespostasSelecionadas({});
      setInicioAvaliacao(new Date());
      setAvaliacaoIniciada(true);
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
    const duracaoSegundos = Math.floor(
      (fim.getTime() - inicioAvaliacao.getTime()) / 1000
    );

    const respostas = Object.entries(respostasSelecionadas).map(
      ([idPergunta, alternativas]) => ({
        idPergunta: Number(idPergunta),
        alternativas,
      })
    );

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

      if (step.fkAvaliacaoId) {
        setAvaliacoesRespondidasMap((prev) => ({
          ...prev,
          [step.fkAvaliacaoId!]: {
            nota: tentativaMaisRecente?.nota ?? null,
            status: "concluida",
          },
        }));
      }

      marcarConcluido(step.idAulaStep);
      setAvaliacaoIniciada(false);
      setVerDetalhes(true);

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

  const handleVerResultados = () => {
    setVerDetalhes(true);
  };

  return (
    <div className="flex flex-col gap-4 mt-4">
      {/* Quando ainda não iniciou */}
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

      {/* Quando a avaliação foi iniciada */}
      {avaliacaoIniciada && step.avaliacao?.perguntas?.length > 0 && (
        <div className="mt-6 space-y-6">
          {step.avaliacao.perguntas.map((pergunta: any, idx: number) => (
            <div
              key={pergunta.idPergunta}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
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
                          setRespostasSelecionadas((prev) => ({
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

      {/* Quando já concluiu (avaliação comum) */}
      {status === "concluida" && !isCurso && !avaliacaoIniciada && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleVerResultados}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm shadow-sm"
          >
            <Eye className="inline-block w-4 h-4 mr-2" />
            Ver Resultados
          </button>
          <button
            onClick={handleRefazer}
            className="px-6 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm shadow-sm"
          >
            <RefreshCcw className="inline-block w-4 h-4 mr-2" />
            Refazer Avaliação
          </button>
        </div>
      )}

      {/* Quando já concluiu (avaliação de curso) */}
      {isCurso && status === "concluida" && !avaliacaoIniciada && (
        <div className="flex flex-wrap gap-2">
          {aprovado ? (
            <button
              onClick={handleGerarCertificado}
              className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm shadow-sm"
            >
              <Award className="inline-block w-4 h-4 mr-2" />
              Gerar Certificado
            </button>
          ) : (
            <button
              onClick={handleRefazer}
              className="px-6 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm shadow-sm"
            >
              <RefreshCcw className="inline-block w-4 h-4 mr-2" />
              Refazer Prova
            </button>
          )}
        </div>
      )}
    </div>
  );
}