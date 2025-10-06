import { useEffect, useMemo, useState } from "react";
import type { CursoCompleto, Step } from "../../types/EstruturaCurso";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchResultadoAvaliacao, getCursoCompleto, registrarStepAula, registrarStepCurso } from "../../services/apiCurso";
import { ArrowLeft, BookOpen, CheckCircle, ChevronRight, Circle, ClipboardList, Clock, Video } from "lucide-react";
import ReactPlayer from "react-player";
import ModalVisualizador from "../../components/Modais/ModalVisualizador";
import toast from "react-hot-toast";
import AvaliacaoControle from "../../components/AvaliacaoControle";
import AvaliacaoProva from "../../components/AvaliacaoProva";

function isStepConcluido(step: any, usuarioAula: any, avaliacoesRespondidasMap: any) {
  switch (step.tipo) {
    case "video":
      return usuarioAula?.assistiuVideo === 1;
    case "material":
      return usuarioAula?.baixouMateriais === 1;
    case "avaliacao":
    case "avaliacao_modulo":
    case "avaliacao_curso":
      return avaliacoesRespondidasMap[step.fkAvaliacaoId]?.status === "concluida";
    default:
      return false;
  }
}

interface SidebarProps {
  curso: CursoCompleto;
  stepAtualIndex: number;
  setStepAtualIndex: React.Dispatch<React.SetStateAction<number>>;
  stepsConcluidos: (string | number)[];
}

function SidebarCurso({ curso, stepAtualIndex, setStepAtualIndex, stepsConcluidos }: SidebarProps) {
  const modulosMap = curso.modulos.map((mod) => {
    const aulas = mod.aulas.map((aula) => {
      const stepsAula = curso.steps?.filter((s) => s.idAula === aula.idAula) ?? [];
      return { ...aula, stepsAula };
    });
    const stepsModulo = curso.steps?.filter((s) => s.idModulo === mod.idModulo && !s.idAula) ?? [];
    return { ...mod, aulas, stepsModulo };
  });

  const stepsCurso = curso.steps?.filter((s) => !s.idModulo && s.tipo.startsWith("avaliacao")) ?? [];

  return (
    <aside className="hidden lg:block w-72 shrink-0 bg-white border border-gray-200 rounded-lg px-3 py-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
      {modulosMap.map((mod) => (
        <div key={mod.idModulo} className="mb-4">
          {/* Título do módulo */}
          <div className="px-1 text-sm font-semibold text-gray-800 mb-1">
            {mod.titulo}
          </div>

          {/* Aulas */}
          <ul className="space-y-1">
            {mod.aulas.map((aula) => {
              const stepsAula = aula.stepsAula;
              const concluida = stepsAula.every((s) => stepsConcluidos.includes(s.idAulaStep));
              const algumStep = stepsAula[0];
              const isAtual = stepsAula.some((s) => curso.steps?.indexOf(s) === stepAtualIndex);

              return (
                <li key={aula.idAula} className="pl-4 w-full space-y-1">
                  <button
                    onClick={() => setStepAtualIndex(curso.steps?.indexOf(algumStep) ?? 0)}
                    className={`group w-full flex items-center justify-between gap-2 px-3 py-2 rounded-full border transition cursor-pointer
                      ${isAtual
                        ? "bg-blue-50 border-blue-200 text-blue-600"
                        : concluida
                          ? "bg-green-50 border-green-300 text-green-600"
                          : "bg-white hover:bg-gray-50 border-gray-200 text-gray-600"}`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Video className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs whitespace-nowrap overflow-hidden text-ellipsis">{aula.titulo}</span>
                    </div>
                    <span className="flex-shrink-0">
                      {concluida ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-400" />
                      )}
                    </span>
                  </button>

                  {/* Avaliações da aula */}
                  {stepsAula
                    .filter((s) => s.tipo.startsWith("avaliacao") && s.avaliacao?.idAvaliacao)
                    .length > 0 && (
                      <ul className="mt-1 space-y-1 ml-6">
                        {stepsAula
                          .filter((s) => s.tipo.startsWith("avaliacao") && s.avaliacao?.idAvaliacao)
                          .map((s) => {
                            const concluido = stepsConcluidos.includes(s.idAulaStep);
                            const atual = curso.steps?.indexOf(s) === stepAtualIndex;

                            return (
                              <li key={s.idAulaStep} className="w-full">
                                <button
                                  onClick={() => {
                                    const idx = curso.steps?.indexOf(s) ?? -1;
                                    if (idx >= 0) setStepAtualIndex(idx);
                                  }}
                                  disabled={!s.avaliacao?.idAvaliacao}
                                  className={`group w-full flex items-center justify-between gap-2 px-3 py-2 rounded-full border text-xs transition cursor-pointer
                                    ${atual
                                      ? "bg-blue-50 border-blue-200 text-blue-600"
                                      : concluido
                                        ? "bg-green-50 border-green-400 text-green-600"
                                        : "bg-white hover:bg-gray-50 border-gray-200 text-gray-500"}`}
                                >
                                  <div className="flex items-center justify-between gap-2 flex-1 min-w-0">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                      <ClipboardList className="w-4 h-4" />
                                      <span className="text-ellipsis overflow-hidden whitespace-nowrap">
                                        {s.avaliacao?.titulo ?? "Avaliação"}
                                      </span>
                                    </div>

                                    <span className="flex-shrink-0">
                                      {concluido ? (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                      ) : (
                                        <Circle className="w-4 h-4 text-gray-400" />
                                      )}
                                    </span>
                                  </div>
                                </button>
                              </li>
                            );
                          })}
                      </ul>
                    )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {/* Avaliações do curso */}
      {stepsCurso.length > 0 && (
        <div className="mb-4">
          <div className="px-1 text-sm font-semibold text-gray-800">Avaliações do Curso</div>
          <ul className="mt-2 space-y-1">
            {stepsCurso.map((s) => {
              const concluido = stepsConcluidos.includes(s.idAulaStep);
              const atual = curso.steps?.indexOf(s) === stepAtualIndex;
              return (
                <li key={s.idAulaStep} className="pl-4 w-full">
                  <button
                    onClick={() => setStepAtualIndex(curso.steps?.indexOf(s) ?? 0)}
                    className={`group w-full flex items-center gap-2 px-3 py-2 rounded-full border text-xs transition cursor-pointer
                      ${atual
                        ? "bg-blue-50 border-blue-200 text-blue-600"
                        : concluido
                          ? "bg-green-50 border-green-400 text-green-600"
                          : "bg-white hover:bg-gray-50 border-gray-200 text-gray-500"}`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <ClipboardList className="w-4 h-4" />
                      <span>{s.avaliacao?.titulo ?? "Avaliação"}</span>
                    </div>
                    <span className="flex-shrink-0">
                      {concluido ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-400" />
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </aside>
  );
}

interface StepRendererProps {
  step: Step | null;
  registrarStepBackend: (step: Step) => Promise<void>;
  avaliacoesRespondidasMap: Record<number, any>;
  aulaSelecionada?: any;
  setMaterialSelecionado: React.Dispatch<React.SetStateAction<{ titulo: string; url: string } | null>>;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;

  setAvaliacoesRespondidasMap: React.Dispatch<React.SetStateAction<Record<number, any>>>;
  marcarConcluido: (idAulaStep: number | string) => void;
  setVerDetalhes: (valor: boolean) => void;
  setAvaliacaoIniciada: (valor: boolean) => void;
  setInicioAvaliacao: (valor: Date) => void;
  setRespostasSelecionadas: React.Dispatch<React.SetStateAction<Record<number, string[] | number[]>>>;
  idCurso: number;
}

function StepRenderer({
  step,
  registrarStepBackend,
  avaliacoesRespondidasMap,
  aulaSelecionada,
  setMaterialSelecionado,
  setModalOpen,

  setAvaliacoesRespondidasMap,
  marcarConcluido,
  setVerDetalhes,
  idCurso
}: StepRendererProps) {

  const navigate = useNavigate();

  const handleGerarCertificado = () => {
    if (idCurso) {
      navigate(`/certificado/${idCurso}`);
    }
  };

  if (!step) return <div>Selecione um step</div>;

  if (step.tipo === "video") {
    const video = aulaSelecionada?.videos?.find(
      (v: any) => v.idAulaVideo === step.fkAulaVideoId
    );

    return (
      <div className="bg-black flex justify-center items-center">
        <div className="w-full aspect-video rounded overflow-hidden shadow-md">
          <ReactPlayer
            src={video?.url ?? ""}
            width="100%"
            height="100%"
            controls
            playing={false}
            style={{ backgroundColor: "black" }}
            onEnded={() => registrarStepBackend(step)}
          />
        </div>
      </div>
    );
  }

  if (step.tipo === "material") {
    const mat = aulaSelecionada?.materiais?.find(
      (m: any) => m.idMaterialComplementar === step.fkMaterialId
    );

    return (
      <div className="flex flex-col items-center justify-center p-6">
        <button
          onClick={() => {
            if (mat) {
              setMaterialSelecionado({ titulo: mat.titulo, url: mat.material });
              setModalOpen(true);
              registrarStepBackend(step);
            }
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Visualizar material
        </button>
      </div>
    );
  }

  if (step.tipo.startsWith("avaliacao")) {
    return (
      <AvaliacaoProva
        step={step}
        avaliacao={step.avaliacao}
        registrarStepBackend={registrarStepBackend}
        setAvaliacoesRespondidasMap={setAvaliacoesRespondidasMap}
        marcarConcluido={marcarConcluido}
        setVerDetalhes={setVerDetalhes}
        handleGerarCertificado={handleGerarCertificado}
        idCurso={idCurso}
      />
    );
  }

  return <div>Conteúdo não suportado</div>;
}

interface FooterProps {
  stepAtualIndex: number;
  setStepAtualIndex: React.Dispatch<React.SetStateAction<number>>;
  steps: Step[];
}

function FooterNavegacao({ stepAtualIndex, setStepAtualIndex, steps }: FooterProps) {
  return (
    <div className="flex items-center gap-6">
      {/* Botão Anterior */}
      <button
        disabled={stepAtualIndex === 0}
        onClick={() => setStepAtualIndex((i) => i - 1)}
        className={`flex items-center text-sm font-medium transition 
          ${stepAtualIndex > 0
            ? "text-blue-600 hover:text-blue-800 cursor-pointer"
            : "text-gray-300 cursor-not-allowed"}`}
      >
        <span className="mr-1">‹</span> Anterior
      </button>

      {/* Botão Próximo */}
      <button
        disabled={stepAtualIndex === steps.length - 1}
        onClick={() => setStepAtualIndex((i) => i + 1)}
        className={`flex items-center text-sm font-medium transition 
          ${stepAtualIndex < steps.length - 1
            ? "text-blue-600 hover:text-blue-800 cursor-pointer"
            : "text-gray-300 cursor-not-allowed"}`}
      >
        Próximo <span className="ml-1">›</span>
      </button>
    </div>
  );
}

export default function PlayCursoPage() {
  const { idCurso } = useParams();
  const [curso, setCurso] = useState<CursoCompleto | null>(null);
  const [stepsConcluidos, setStepsConcluidos] = useState<(string | number)[]>([]);
  const [stepAtualIndex, setStepAtualIndex] = useState<number>(0);
  const [materialSelecionado, setMaterialSelecionado] = useState<{ titulo: string; url: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [_avaliacaoIniciada, setAvaliacaoIniciada] = useState(false);
  const [_inicioAvaliacao, setInicioAvaliacao] = useState<Date | null>(null);
  const [_respostasSelecionadas, setRespostasSelecionadas] = useState<Record<number, string[] | number[]>>({});
  const [_verDetalhes, setVerDetalhes] = useState(false);
  const [avaliacoesRespondidasMap, setAvaliacoesRespondidasMap] = useState<Record<number, any>>({});

  useEffect(() => {
    const load = async () => {
      if (!idCurso) return;

      const data = await getCursoCompleto(Number(idCurso));
      setCurso(data);

      console.log("Curso Completo: ", data);

      // Mapear steps concluídos do backend
      const concluidos: (string | number)[] = [];

      data.steps?.forEach((s) => {
        let concluido = false;

        // Step de aula (vídeo/material/avaliacao no aulastep)
        if (s.idAula) {
          const aula = data.modulos.flatMap(m => m.aulas).find(a => a.idAula === s.idAula);
          const usuarioAula = aula?.aulausuarios?.[0];

          concluido = isStepConcluido(s, usuarioAula, {});
        }

        // Step de avaliação de curso
        if (s.tipo === "avaliacao_curso" || s.tipo === "avaliacao") {
          const tentativa = s.avaliacao?.avaliacoesUsuarios?.[0];
          concluido ||= tentativa?.status === "concluida";
        }

        if (concluido) {
          concluidos.push(s.idAulaStep);
        }
      });

      setStepsConcluidos(concluidos);
    };

    load();
  }, [idCurso]);

  useEffect(() => {
    if (!curso) return;

    const map: Record<number, any> = {};
    curso?.avaliacoes?.forEach(av => {
      const tentativa = av.avaliacoesUsuarios?.[0];
      if (tentativa) map[av.idAvaliacao!] = tentativa;
    });

    curso?.modulos?.forEach(m => {
      m.avaliacoes?.forEach(av => {
        const tentativa = av.avaliacoesUsuarios?.[0];
        if (tentativa) map[av.idAvaliacao!] = tentativa;
      });
      m.aulas?.forEach(a => {
        a.avaliacoes?.forEach(av => {
          const tentativa = av.avaliacoesUsuarios?.[0];
          if (tentativa) map[av.idAvaliacao!] = tentativa;
        });
      });
    });

    setAvaliacoesRespondidasMap(map);
  }, [curso]);

  const stepAtual: Step | null = curso?.steps?.[stepAtualIndex] ?? null;

  const registrarStepBackend = async (step: Step, progressoVideo?: number): Promise<void> => {
    try {
      if (!step.fkAvaliacaoId) {
        toast.error("Nenhuma avaliação encontrada!");
        return;
      }

      if (step.idAula) {
        await registrarStepAula({
          fkAulaId: step.idAula,
          idReferencia: step.fkAulaVideoId ?? step.fkAvaliacaoId ?? step.fkMaterialId,
          tipo: step.tipo as any,
          progressoVideo,
        });
      } else {
        await registrarStepCurso({
          idCurso: Number(idCurso),
          idReferencia: step.fkAvaliacaoId!,
          tipo: step.tipo as any,
          progressoVideo,
        });
      }

      setStepsConcluidos(prev =>
        prev.includes(step.idAulaStep) ? prev : [...prev, step.idAulaStep]
      );

    } catch (e) {
      console.error("Erro ao registrar step:", e);
    }
  };

  if (!curso) return <div>Carregando...</div>;

  return (
    <>
      {/* Header */}
      <div className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-11/12 mx-auto px-4 py-2 flex items-center gap-3">
          <button onClick={() => window.history.back()} className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <nav className="flex items-center text-sm text-gray-500">
            <Link to="/cursos/meuscursos" className="hover:text-gray-700">Meus Cursos</Link>
            <ChevronRight className="mx-2 h-4 w-4" />
            <span className="text-gray-800 font-medium truncate max-w-[40ch]">{curso.titulo}</span>
            {stepAtual?.idAula && (
              <>
                <ChevronRight className="mx-2 h-4 w-4" />
                <span className="text-gray-500 truncate max-w-[45ch]">
                  {curso.modulos.flatMap(m => m.aulas).find(a => a.idAula === stepAtual.idAula)?.titulo}
                </span>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="max-w-11/12 mx-auto py-2 flex gap-2">
        {/* Sidebar (com estilo antigo, mas usando steps globais agrupados) */}
        <SidebarCurso
          curso={curso}
          stepAtualIndex={stepAtualIndex}
          setStepAtualIndex={setStepAtualIndex}
          stepsConcluidos={stepsConcluidos}
        />

        {/* Conteúdo */}
        <section className="flex-1 min-w-0 max-h-[88vh] overflow-y-auto bg-white border border-gray-200 rounded-lg px-5 py-3 custom-scrollbar">
          <div className="w-full mb-3">
            <div className="flex items-center justify-between mb-3">
              {/* Título da Aula */}
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700 truncate max-w-[60%]">
                {stepAtual?.tipo === "avaliacao"
                  ? stepAtual.avaliacao?.titulo
                  : curso.modulos
                    .flatMap(m => m.aulas)
                    .find(a => a.idAula === stepAtual?.idAula)?.titulo}
              </h2>

              {/* Navegação */}
              <FooterNavegacao
                stepAtualIndex={stepAtualIndex}
                setStepAtualIndex={setStepAtualIndex}
                steps={curso.steps as Step[]}
              />
            </div>

            {/* Barra de progresso */}
            <div className="">
              <div className="w-full bg-gray-200 h-2 rounded-full mb-1">
                <div
                  className="bg-green-500 h-2 transition-all rounded-full"
                  style={{
                    width: `${(stepsConcluidos.length / (curso.steps?.length ?? 1)) * 100}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-start text-xs text-gray-500 italic">{stepsConcluidos.length} de {curso.steps?.length} etapas concluidas</p>
                <p className="text-end text-xs text-gray-400 italic">
                  {Math.floor((stepsConcluidos.length / (curso.steps?.length ?? 1)) * 100)}%
                </p>
              </div>
            </div>
          </div>

          <StepRenderer
            step={stepAtual}
            registrarStepBackend={registrarStepBackend}
            avaliacoesRespondidasMap={avaliacoesRespondidasMap}
            aulaSelecionada={curso.modulos.flatMap(m => m.aulas).find(a => a.idAula === stepAtual?.idAula)}
            setMaterialSelecionado={setMaterialSelecionado}
            setModalOpen={setModalOpen}
            setAvaliacoesRespondidasMap={setAvaliacoesRespondidasMap}
            marcarConcluido={(id) => setStepsConcluidos((prev) => prev.includes(id) ? prev : [...prev, id])}
            setVerDetalhes={setVerDetalhes}
            setAvaliacaoIniciada={setAvaliacaoIniciada}
            setInicioAvaliacao={(val) => setInicioAvaliacao(val)}
            setRespostasSelecionadas={setRespostasSelecionadas}
            idCurso={Number(idCurso)}
          />
        </section>
      </div>

      {materialSelecionado && (
        <ModalVisualizador
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          titulo={materialSelecionado.titulo}
          url={materialSelecionado.url}
        />
      )}
    </>
  );
}