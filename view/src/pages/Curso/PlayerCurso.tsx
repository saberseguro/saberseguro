import { useEffect, useMemo, useState, type JSX } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import ReactPlayer from "react-player";
import { enviarAvaliacao, fetchResultadoAvaliacao, finalizarAvaliacaoBackend, finalizarCurso, getCursoCompleto, iniciarAvaliacao, registrarStepAula } from "../../services/apiCurso";
import type { CursoAcesso, CursoCompleto } from "../../types/EstruturaCurso";
import {
  ArrowLeft,
  ChevronRight,
  FileText,
  Play,
  Video,
  Clock,
  Info,
  Book,
  LibraryBig,
  File,
  FileChartLine,
  Link2,
  Files,
  CheckCircle,
  BookOpen,
  CircleCheck,
  CircleX,
  GraduationCap,
  ClipboardList,
} from "lucide-react";
import ModalVisualizador from "../../components/Modais/ModalVisualizador";
import { formatarMinutosEmHoras } from "../../auxiliares/formatters";
import toast from "react-hot-toast";

type Aba = "sobre" | "materiais";

export default function PlayCursoPage() {
  const { idCurso } = useParams();
  const [searchParams] = useSearchParams();
  const aulaInicialId = searchParams.get("aula");

  const navigate = useNavigate();

  const [curso, setCurso] = useState<CursoCompleto | null>(null);
  const [cursoFinalizado, setCursoFinalizado] = useState(false);
  const [aulaSelecionada, setAulaSelecionada] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [abaAtiva, setAbaAtiva] = useState<Aba>("sobre");

  const [stepAtualIndex, setStepAtualIndex] = useState(0);
  const [stepsConcluidos, setStepsConcluidos] = useState<number[]>([]);

  const stepAtual = aulaSelecionada?.steps?.[stepAtualIndex];

  const [modalOpen, setModalOpen] = useState(false);
  const [materialSelecionado, setMaterialSelecionado] = useState<{ titulo: string; url: string } | null>(null);

  // Avaliação
  const [avaliacaoCursoSelecionada, setAvaliacaoCursoSelecionada] = useState<any | null>(null);
  const [avaliacaoIniciada, setAvaliacaoIniciada] = useState(false);
  const [verDetalhes, setVerDetalhes] = useState(false);
  const [inicioAvaliacao, setInicioAvaliacao] = useState<Date | null>(null);
  const [respostasSelecionadas, setRespostasSelecionadas] = useState<{ [idPergunta: number]: number[] | string[] }>({});
  const [abaTentativaAtiva, setAbaTentativaAtiva] = useState<number | null>(null);
  const [tentativas, setTentativas] = useState<any[]>([]);
  const [tentativaSelecionada, setTentativaSelecionada] = useState<any | null>(null);

  const [avaliacoesRespondidasMap, setAvaliacoesRespondidasMap] = useState<
    Record<number, { nota: number | null; dataFim?: string }>
  >({});

  useEffect(() => {
    if (!aulaSelecionada?.steps) return;

    const usuarioAula = aulaSelecionada?.aulausuarios?.[0];

    const concluidos = aulaSelecionada?.steps
      ?.filter((step: any) => {
        if (!usuarioAula) return false;
        switch (step.tipo) {
          case "video": return usuarioAula.assistiuVideo === 1;
          case "material": return usuarioAula.baixouMateriais === 1;
          case "avaliacao": return usuarioAula.respondeuQuiz === 1;
          default: return false;
        }
      })
      .map((step: any) => step.idAulaStep) ?? [];

    setStepsConcluidos(concluidos);

    const indexNaoConcluido = aulaSelecionada?.steps.findIndex(
      (s: any) => !concluidos.includes(s.idAulaStep)
    );

    setStepAtualIndex(indexNaoConcluido >= 0 ? indexNaoConcluido : 0);
  }, [aulaSelecionada]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getCursoCompleto(Number(idCurso));
        setCurso(data);

        const finalizado = data.acessos?.some((ac: CursoAcesso) => ac.concluido === 1);
        setCursoFinalizado(finalizado ?? false);

        const mapResp: Record<number, { nota: number | null; dataFim?: string }> = {};

        // 🔹 Avaliações do curso
        for (const av of data.avaliacoes ?? []) {
          const au = av.avaliacoesUsuarios?.[0];
          if (au && typeof av.idAvaliacao === "number") {
            mapResp[av.idAvaliacao] = {
              nota: au.nota ?? null,
              dataFim: au.dataFim ?? undefined
            };
          }
        }

        for (const mod of data.modulos ?? []) {
          // Avaliações do módulo
          for (const av of mod.avaliacoes ?? []) {
            const au = av.avaliacoesUsuarios?.[0];
            if (au && typeof av.idAvaliacao === "number") {
              mapResp[av.idAvaliacao] = {
                nota: au.nota ?? null,
                dataFim: au.dataFim ?? undefined
              };
            }
          }

          // Avaliações das aulas
          for (const aula of mod.aulas ?? []) {
            for (const av of aula.avaliacoes ?? []) {
              const au = av.avaliacoesUsuarios?.[0];
              if (au && typeof av.idAvaliacao === "number") {
                mapResp[av.idAvaliacao] = {
                  nota: au.nota ?? null,
                  dataFim: au.dataFim ?? undefined
                };
              }
            }
          }
        }

        setAvaliacoesRespondidasMap(mapResp);

        const todasAulas = data.modulos.flatMap((m) => m.aulas);
        const aula = todasAulas.find((a) => String(a.idAula) === aulaInicialId) ?? todasAulas[0];

        const usuarioAula = aula?.aulausuarios?.[0];

        const concluidos = aula?.steps
          ?.filter((step: any) => {
            if (!usuarioAula) return false;

            switch (step.tipo) {
              case "video":
                return usuarioAula.assistiuVideo === 1;
              case "material":
                return usuarioAula.baixouMateriais === 1;
              case "avaliacao":
                return usuarioAula.respondeuQuiz === 1;
              default:
                return false;
            }
          })
          .map((step: any) => step.idAulaStep) ?? [];

        setStepsConcluidos(concluidos);
        if (!finalizado) {
          setAulaSelecionada(aula ?? null);
        }
      } finally {
        setLoading(false);
      }
    };

    if (idCurso) load();
  }, [idCurso, aulaInicialId]);

  useEffect(() => {
    const carregarTentativas = async () => {
      if (stepAtual?.fkAvaliacaoId) {
        try {
          const { tentativas } = await fetchResultadoAvaliacao(stepAtual.fkAvaliacaoId);
          setTentativas(tentativas);
          setAbaTentativaAtiva(tentativas[0]?.idAvaliacaoUsuario ?? null);
        } catch (e) {
          console.error("Erro ao buscar tentativas:", e);
        }
      }
    };

    carregarTentativas();
  }, [stepAtual]);

  useEffect(() => {
    if (abaTentativaAtiva && tentativas.length > 0) {
      const tentativa = tentativas.find(t => t.idAvaliacaoUsuario === abaTentativaAtiva);
      setTentativaSelecionada(tentativa ?? null);
    }
  }, [abaTentativaAtiva, tentativas]);

  function verificarConclusaoAula(aula: any): boolean {
    if (!aula?.steps?.length) return false;

    const obrigatorios = aula.steps.filter((s: any) => s.obrigatorio);
    if (obrigatorios.length === 0) return false;

    const usuarioAula = aula.aulausuarios?.[0];
    if (!usuarioAula) return false;

    return obrigatorios.every((s: any) => {
      switch (s.tipo) {
        case "video":
          return usuarioAula.assistiuVideo === 1;
        case "material":
          return usuarioAula.baixouMateriais === 1;
        case "avaliacao":
          return usuarioAula.respondeuQuiz === 1;
        default:
          return false;
      }
    });
  }

  const marcarConcluido = (idStep: number) => {
    setStepsConcluidos((prev) =>
      prev.includes(idStep) ? prev : [...prev, idStep]
    );
  };

  const registrarStepBackend = async (step: any, progressoVideo?: number) => {
    try {
      await registrarStepAula({
        fkAulaId: aulaSelecionada.idAula,
        idReferencia: step.fkAulaVideoId ?? step.fkAvaliacaoId ?? step.fkMaterialId,
        tipo: step.tipo,
        progressoVideo,
      });

      marcarConcluido(step.idAulaStep);

    } catch (e) {
      console.error("Erro ao registrar step:", e);
    }
  };

  const stepsObrigatoriosConcluidos = useMemo(() => {
    if (!aulaSelecionada?.steps) return false;
    return aulaSelecionada.steps
      .filter((s: any) => s.obrigatorio)
      .every((s: any) => stepsConcluidos.includes(s.idAulaStep));
  }, [aulaSelecionada, stepsConcluidos]);

  const todasAulas = useMemo(() => {
    return curso?.modulos.flatMap((mod) => mod.aulas) ?? [];
  }, [curso]);

  const indiceAtual = todasAulas.findIndex(
    (a) => a.idAula === aulaSelecionada?.idAula
  );

  // Verifica se o curso possui avaliação
  const cursoTemAvaliacao = (curso?.avaliacoes?.length ?? 0) > 0;

  // Verifica se todas as avaliações do curso foram concluídas
  const todasAvaliacoesCursoConcluidas = curso?.avaliacoes?.every((av) => {
    return !!(av.avaliacoesUsuarios && av.avaliacoesUsuarios.length > 0 && av.avaliacoesUsuarios[0].dataFim);
  }) ?? true;

  const aulaAnterior = indiceAtual > 0 ? todasAulas[indiceAtual - 1] : null;
  const proximaAula = indiceAtual < todasAulas.length - 1 ? todasAulas[indiceAtual + 1] : null;

  const selecionarResposta = (
    idPergunta: number,
    resposta: number | string,
    checked: boolean = true
  ) => {
    setRespostasSelecionadas((prev) => {
      const atuais = prev[idPergunta];

      if (typeof resposta === "string") {
        // Dissertativa: sobrescreve sempre com nova string
        return { ...prev, [idPergunta]: [resposta] };
      }

      // Questão objetiva
      const alternativasAtuais = Array.isArray(atuais) && typeof atuais[0] === "number"
        ? atuais as number[]
        : [];

      const atualizadas = checked
        ? [...alternativasAtuais, resposta]
        : alternativasAtuais.filter((id) => id !== resposta);

      return { ...prev, [idPergunta]: atualizadas };
    });
  };

  const iniciar = async (idAvaliacao: number) => {
    try {
      await iniciarAvaliacao(idAvaliacao);
      setInicioAvaliacao(new Date());
      setAvaliacaoIniciada(true);
    } catch (error) {
      console.error("Erro ao iniciar avaliação:", error);
    }
  };

  const handleFinalizarCurso = async () => {
    try {
      await finalizarCurso(Number(idCurso));
      setCursoFinalizado(true);
      setAulaSelecionada(null);
      toast.success("Curso finalizado com sucesso! Certificado liberado.");
    } catch (e) {
      console.error("Erro ao finalizar curso:", e);
      toast.error("Erro ao finalizar curso.");
    }
  };

  const finalizarAvaliacao = async () => {
    if (!inicioAvaliacao) return;

    const fim = new Date();
    const duracaoSegundos = Math.floor((fim.getTime() - inicioAvaliacao.getTime()) / 1000);

    const respostas = Object.entries(respostasSelecionadas).map(([idPergunta, alternativas]) => ({
      idPergunta: Number(idPergunta),
      alternativas,
    }));

    try {
      await enviarAvaliacao(stepAtual.fkAvaliacaoId, respostas, duracaoSegundos);
      await finalizarAvaliacaoBackend(stepAtual.fkAvaliacaoId);
      await registrarStepBackend(stepAtual);

      // Buscar resultado completo (todas as tentativas)
      const resultado = await fetchResultadoAvaliacao(stepAtual.fkAvaliacaoId);

      // Identificar a tentativa mais recente
      const tentativaMaisRecente = resultado.tentativas?.reduce((maisRecente, atual) => {
        const dataAtual = new Date(atual.dataFim).getTime();
        const dataMaisRecente = new Date(maisRecente.dataFim).getTime();
        return dataAtual > dataMaisRecente ? atual : maisRecente;
      });

      // Atualiza mapa de avaliações respondidas
      setAvaliacoesRespondidasMap(prev => ({
        ...prev,
        [stepAtual.fkAvaliacaoId]: { nota: tentativaMaisRecente?.nota ?? null }
      }));

      setVerDetalhes(true);

      toast.success("Avaliação enviada!");
      marcarConcluido(stepAtual.idAulaStep);

    } catch (e) {
      console.error("Erro ao finalizar avaliação:", e);
      toast.error("Erro ao enviar avaliação.");
    }
  };

  const refazerAvaliacao = async () => {
    if (!stepAtual?.fkAvaliacaoId) return;
    try {
      await iniciarAvaliacao(stepAtual.fkAvaliacaoId);
      setRespostasSelecionadas({});
      setAvaliacaoIniciada(true);
      setInicioAvaliacao(new Date());
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível iniciar novamente.");
    }
  };

  useEffect(() => {
    const carregarTentativas = async () => {
      if (avaliacaoCursoSelecionada?.idAvaliacao) {
        const { tentativas } = await fetchResultadoAvaliacao(avaliacaoCursoSelecionada.idAvaliacao);
        setTentativas(tentativas);
        setAbaTentativaAtiva(tentativas[0]?.idAvaliacaoUsuario ?? null);
      }
    };
    carregarTentativas();
  }, [avaliacaoCursoSelecionada]);

  const iniciarAvaliacaoCurso = async (idAvaliacao: number) => {
    try {
      await iniciarAvaliacao(idAvaliacao);
      setInicioAvaliacao(new Date());
      setAvaliacaoIniciada(true);
    } catch (error) {
      console.error("Erro ao iniciar avaliação do curso:", error);
      toast.error("Não foi possível iniciar a avaliação.");
    }
  };

  const finalizarAvaliacaoCurso = async () => {
    if (!inicioAvaliacao || !avaliacaoCursoSelecionada) return;

    const fim = new Date();
    const duracaoSegundos = Math.floor((fim.getTime() - inicioAvaliacao.getTime()) / 1000);

    const respostas = Object.entries(respostasSelecionadas).map(([idPergunta, alternativas]) => ({
      idPergunta: Number(idPergunta),
      alternativas,
    }));

    try {
      const idAvaliacao = avaliacaoCursoSelecionada.idAvaliacao;

      await enviarAvaliacao(idAvaliacao, respostas, duracaoSegundos);
      await finalizarAvaliacaoBackend(idAvaliacao);

      const resultado = await fetchResultadoAvaliacao(idAvaliacao);

      const tentativaMaisRecente = resultado.tentativas?.reduce((maisRecente, atual) => {
        const dataAtual = new Date(atual.dataFim).getTime();
        const dataMaisRecente = new Date(maisRecente.dataFim).getTime();
        return dataAtual > dataMaisRecente ? atual : maisRecente;
      });

      setAvaliacoesRespondidasMap(prev => ({
        ...prev,
        [idAvaliacao]: { nota: tentativaMaisRecente?.nota ?? null }
      }));

      setVerDetalhes(true);
      toast.success("Avaliação do curso enviada!");

      await handleFinalizarCurso();
      setAvaliacaoCursoSelecionada(null);

    } catch (e) {
      console.error("Erro ao finalizar avaliação do curso:", e);
      toast.error("Erro ao enviar avaliação do curso.");
    }
  };

  const refazerAvaliacaoCurso = async () => {
    if (!avaliacaoCursoSelecionada?.idAvaliacao) return;
    try {
      await iniciarAvaliacao(avaliacaoCursoSelecionada.idAvaliacao);
      setRespostasSelecionadas({});
      setAvaliacaoIniciada(true);
      setInicioAvaliacao(new Date());
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível iniciar novamente.");
    }
  };

  const estatisticas = useMemo(() => {
    if (!curso) return { qtdAulas: 0, duracaoTotal: 0 };
    const qtdModulos = curso.modulos.length;
    const todasAulas = curso.modulos.flatMap((m) => m.aulas ?? []);
    const qtdAulas = todasAulas.length;
    const duracaoTotal = todasAulas.reduce((acc, a) => acc + Number(a.duracao || 0), 0);
    return { qtdModulos, qtdAulas, duracaoTotal };
  }, [curso]);

  const avaliacaoCompleta = useMemo(() => {
    if (!stepAtual?.fkAvaliacaoId || !aulaSelecionada?.avaliacoes) return null;
    return aulaSelecionada.avaliacoes.find(
      (av: any) => av.idAvaliacao === stepAtual.fkAvaliacaoId
    );
  }, [stepAtual, aulaSelecionada]);

  const isUltimaAula = indiceAtual === todasAulas.length - 1;

  if (loading) return <div className="p-8">Carregando curso...</div>;
  if (!curso) return <div className="p-8 text-red-500">Curso não encontrado.</div>;

  return (
    <>
      {/* Header */}
      <div className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-11/12 mx-auto px-4 py-2 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <nav className="flex items-center text-sm text-gray-500">
            <Link to="/cursos/meuscursos" className="hover:text-gray-700">Meus Cursos</Link>
            <ChevronRight className="mx-2 h-4 w-4" />
            <span className="text-gray-800 font-medium truncate max-w-[40ch]">{curso.titulo}</span>
            {aulaSelecionada && (
              <>
                <ChevronRight className="mx-2 h-4 w-4" />
                <span className="text-gray-500 truncate max-w-[45ch]">{aulaSelecionada.titulo}</span>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="max-w-11/12 mx-auto py-2 flex gap-2">
        {/* Menu lateral */}
        <aside className="hidden lg:block w-72 shrink-0 bg-white border border-gray-200 rounded-lg px-3 py-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
          {/* Módulos + aulas + avaliações */}
          {curso.modulos.map((mod) => (
            <div key={mod.idModulo} className="mb-4">
              <div className="px-1 text-[13px] font-semibold text-gray-700">{mod.titulo}</div>
              {/* Aulas */}
              <ul className="mt-2 space-y-1">
                {mod.aulas.map((aula) => {
                  const isActive = aula.idAula === aulaSelecionada?.idAula;
                  const concluida = verificarConclusaoAula(aula);

                  return (
                    <li key={aula.idAula}>
                      <button
                        onClick={() => setAulaSelecionada(aula)}
                        className={`group w-full text-left flex items-center gap-2 px-3 py-2 rounded-full border transition cursor-pointer
                  ${isActive
                            ? "bg-blue-50 border-blue-200 text-blue-500"
                            : concluida
                              ? "bg-green-50 border-green-400 text-green-600 opacity-70"
                              : "bg-white hover:bg-gray-50 border-gray-200 text-gray-500"}`}
                      >
                        <Video className="w-4 h-4" />
                        <span className="text-xs line-clamp-1">{aula.titulo}</span>
                      </button>

                      {/* Avaliações da aula */}
                      {(aula.avaliacoes?.length ?? 0) > 0 && (
                        <ul className="ml-6 mt-1 space-y-1">
                          {aula.avaliacoes?.map((av) => {
                            const concluida = !!(av.avaliacoesUsuarios && av.avaliacoesUsuarios.length > 0 && av.avaliacoesUsuarios[0].dataFim);
                            return (
                              <li key={`aula-av-${av.idAvaliacao}`}>
                                <button
                                  onClick={() => {
                                    setAulaSelecionada(aula);
                                    setStepAtualIndex(aula.steps?.findIndex((s) => s.fkAvaliacaoId === av.idAvaliacao) ?? 0);
                                  }}
                                  className={`group w-full text-left flex items-center gap-2 px-3 py-2 rounded-full border transition cursor-pointer
                            ${concluida ? "bg-green-50 border-green-400 text-green-600 opacity-70" : "bg-white hover:bg-gray-50 border-gray-200 text-gray-500"}`}
                                >
                                  <ClipboardList className="w-4 h-4" />
                                  <span className="text-xs line-clamp-1">{av.titulo}</span>
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

              {/* Avaliações do módulo */}
              {(mod.avaliacoes?.length ?? 0) > 0 && (
                <ul className="mt-1 space-y-1">
                  {mod.avaliacoes?.map((av) => {
                    const concluida = !!(av.avaliacoesUsuarios && av.avaliacoesUsuarios.length > 0 && av.avaliacoesUsuarios[0].dataFim);

                    return (
                      <li key={`mod-av-${av.idAvaliacao}`}>
                        <button
                          onClick={() => {
                            setAulaSelecionada(null);
                            setStepAtualIndex(0);
                          }}
                          className={`group w-full text-left flex items-center gap-2 px-3 py-2 rounded-full border transition cursor-pointer
                          ${concluida
                              ? "bg-green-50 border-green-400 text-green-600 opacity-70"
                              : "bg-white hover:bg-gray-50 border-gray-200 text-gray-500"}`}
                        >
                          <ClipboardList className="w-4 h-4" />
                          <span className="text-xs line-clamp-1">{av.titulo}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

            </div>
          ))}

          {/* Avaliações do curso */}
          {curso.avaliacoes?.length > 0 && (
            <div className="mb-4">
              <div className="px-1 text-[13px] font-semibold text-gray-700">Avaliações do Curso</div>
              <ul className="mt-2 space-y-1">
                {curso.avaliacoes.map((av) => {
                  const concluida = !!(av.avaliacoesUsuarios && av.avaliacoesUsuarios.length > 0 && av.avaliacoesUsuarios[0].dataFim);
                  return (
                    <li key={`curso-av-${av.idAvaliacao}`}>
                      <button
                        onClick={() => {
                          setAulaSelecionada(null);
                          setStepAtualIndex(0);
                          setAvaliacaoCursoSelecionada(av);
                        }}
                        className={`group w-full text-left flex items-center gap-2 px-3 py-2 rounded-full border transition cursor-pointer
                        ${concluida ? "bg-green-50 border-green-400 text-green-600 opacity-70" : "bg-white hover:bg-gray-50 border-gray-200 text-gray-500"}`}
                      >
                        <ClipboardList className="w-4 h-4" />
                        <span className="text-xs line-clamp-1">{av.titulo}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>

        {/* Conteúdo principal */}
        <section className="flex-1 min-w-0 max-h-[88vh] overflow-y-auto bg-white border border-gray-200 rounded-lg px-5 py-3 custom-scrollbar">
          {cursoFinalizado && !aulaSelecionada && !avaliacaoCursoSelecionada ? (
            <div className="flex flex-col items-center justify-center gap-4 py-10 px-6">
              <div className="text-green-600">
                <GraduationCap className="w-12 h-12" />
              </div>

              <h2 className="text-2xl font-bold text-gray-700 text-center">
                Curso Concluído com Sucesso!
              </h2>

              <p className="text-center text-gray-700 max-w-md text-sm">
                Você completou todas as etapas obrigatórias deste curso. Parabéns pelo seu progresso e dedicação! Agora você pode emitir seu certificado de conclusão.
              </p>

              <Link
                to={`/certificado/${curso?.idCurso}`}
                className="mt-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition"
              >
                Emitir Certificado
              </Link>
            </div>
          ) : (
            <>
              {cursoFinalizado && !aulaSelecionada && !avaliacaoCursoSelecionada ? (
                <div className="flex flex-col items-center justify-center gap-4 py-10 px-6">
                  <div className="text-green-600">
                    <GraduationCap className="w-12 h-12" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-700 text-center">
                    Curso Concluído com Sucesso!
                  </h2>
                  <p className="text-center text-gray-700 max-w-md text-sm">
                    Você completou todas as etapas obrigatórias deste curso. Agora você pode emitir seu certificado de conclusão.
                  </p>
                  <Link
                    to={`/certificado/${curso?.idCurso}`}
                    className="mt-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition"
                  >
                    Emitir Certificado
                  </Link>
                </div>
              ) : avaliacaoCursoSelecionada ? (
                <>
                  <div className="w-full flex flex-col items-center justify-start bg-white text-left p-8 overflow-y-auto">
                    <div className="text-center rounded-lg w-full mb-4">
                      <h3 className="text-xl font-bold text-gray-800">
                        {avaliacaoCursoSelecionada.titulo}
                      </h3>
                    </div>

                    {/* Se já respondeu */}
                    {avaliacoesRespondidasMap[avaliacaoCursoSelecionada.idAvaliacao] && !avaliacaoIniciada ? (
                      <>
                        {!verDetalhes ? (
                          <>
                            <div className="flex gap-3">
                              <button
                                onClick={() => setVerDetalhes(true)}
                                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm shadow-sm cursor-pointer"
                              >
                                Ver resultados
                              </button>

                              {tentativas.some((t) => (t.nota ?? 0) >= 6) && (
                                <Link
                                  to={`/certificado/${curso?.idCurso}`}
                                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm shadow-sm cursor-pointer"
                                >
                                  Gerar Certificado
                                </Link>
                              )}
                            </div>

                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setVerDetalhes(false)}
                              className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm shadow-sm cursor-pointer"
                            >
                              Ocultar resultados
                            </button>
                          </>
                        )}
                      </>
                    ) : null}

                    {/* Início da avaliação */}
                    {!avaliacaoIniciada && !avaliacoesRespondidasMap[avaliacaoCursoSelecionada.idAvaliacao] && (
                      <button
                        onClick={() => iniciarAvaliacaoCurso(avaliacaoCursoSelecionada.idAvaliacao)}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm shadow-sm cursor-pointer"
                      >
                        Iniciar Avaliação do Curso
                      </button>
                    )}

                    {/* Detalhamento das tentativas */}
                    {verDetalhes && !avaliacaoIniciada && tentativas.length > 0 && (
                      <div className="w-full text-sm">
                        <p className="text-sm text-gray-600 font-semibold mb-3">Tentativas anteriores:</p>

                        {/* Abas */}
                        <div className="flex gap-2 border-b border-gray-200 pb-1 overflow-x-auto custom-scrollbar">
                          {tentativas.map((t, idx) => (
                            <button
                              key={t.idAvaliacaoUsuario}
                              onClick={() => setAbaTentativaAtiva(t.idAvaliacaoUsuario)}
                              className={`px-4 py-1 rounded-t-md border-b-2 text-sm transition cursor-pointer
                                ${abaTentativaAtiva === t.idAvaliacaoUsuario
                                  ? "border-blue-600 text-blue-700 font-medium"
                                  : "border-transparent text-gray-600 hover:text-gray-800"}`}
                            >
                              Tentativa {idx + 1}
                            </button>
                          ))}
                        </div>

                        {/* Conteúdo da aba ativa */}
                        {tentativaSelecionada && (
                          <div className="p-4 space-y-4">
                            <div>
                              <p className="text-gray-700 font-medium mb-1">
                                Nota: {tentativaSelecionada?.nota ?? "—"}
                                {typeof tentativaSelecionada?.nota === "number" && (
                                  <span
                                    className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${tentativaSelecionada.nota >= 6
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"}`}
                                  >
                                    {tentativaSelecionada.nota >= 6 ? "Aprovado" : "Reprovado"}
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500">
                                Finalizada em:{" "}
                                {tentativaSelecionada?.dataFim
                                  ? new Date(tentativaSelecionada.dataFim).toLocaleString()
                                  : "—"}
                              </p>
                            </div>

                            {tentativaSelecionada.resultado.map((pergunta: any, idx: number) => {
                              const isDissertativa =
                                !Array.isArray(pergunta.alternativas) || pergunta.alternativas.length === 0;

                              return (
                                <div key={pergunta.idPergunta} className="p-4 bg-white rounded-lg border border-gray-200">
                                  <p className="font-medium text-gray-800 mb-2">
                                    {idx + 1}. {pergunta.enunciado}
                                  </p>

                                  {isDissertativa ? (
                                    <div className="mt-2 p-3 bg-gray-100 rounded border border-gray-300 text-sm text-gray-800 whitespace-pre-wrap">
                                      {pergunta.respostaTexto || <span className="italic text-gray-400">Sem resposta</span>}
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {pergunta.alternativas.map((alt: any) => {
                                        const correta = alt.correta;
                                        const selecionada = alt.selecionada;

                                        let style = "border border-gray-300 bg-white text-gray-800";
                                        let icon = null;

                                        if (correta && selecionada) {
                                          style = "border border-green-600 bg-green-50 text-green-800 font-semibold";
                                          icon = <CircleCheck className="w-4 h-4 text-green-600" />;
                                        } else if (!correta && selecionada) {
                                          style = "border border-red-500 bg-red-50 text-red-700 font-semibold";
                                          icon = <CircleX className="w-4 h-4 text-red-500" />;
                                        } else if (correta) {
                                          style = "border border-green-500 bg-green-50 text-green-800";
                                          icon = <CircleCheck className="w-4 h-4 text-green-500" />;
                                        }

                                        return (
                                          <div
                                            key={alt.idAlternativa}
                                            className={`flex justify-between items-center px-4 py-2 rounded-lg transition ${style}`}
                                          >
                                            <span className="text-sm">{alt.texto}</span>
                                            {icon}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Refazer e Emitir Certificado */}
                            <div className="flex justify-center gap-4 mt-6">
                              <button
                                onClick={refazerAvaliacaoCurso}
                                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 text-sm shadow-sm cursor-pointer"
                              >
                                Refazer Avaliação
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Responder avaliação */}
                    {avaliacaoIniciada && (
                      <div className="w-full space-y-6">
                        {avaliacaoCursoSelecionada.perguntas?.map((pergunta: any, idx: number) => (
                          <div key={pergunta.idPergunta} className="px-4 py-2 rounded border-1 border-gray-200 shadow">
                            <p className="font-medium text-gray-800 mb-1">{idx + 1}. {pergunta.enunciado}</p>
                            {pergunta.tipo === "dissertativa" ? (
                              <textarea
                                placeholder="Digite sua resposta..."
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none"
                                rows={4}
                                onChange={(e) => selecionarResposta(pergunta.idPergunta, e.target.value)}
                              />
                            ) : (
                              pergunta.alternativas.map((alt: any) => (
                                <label key={alt.idAlternativa} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`pergunta_${pergunta.idPergunta}`}
                                    value={alt.idAlternativa}
                                    onChange={() => selecionarResposta(pergunta.idPergunta, alt.idAlternativa, true)}
                                  />
                                  {alt.texto}
                                </label>
                              ))
                            )}
                          </div>
                        ))}

                        <div className="text-center">
                          <button
                            onClick={finalizarAvaliacaoCurso}
                            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm shadow-sm cursor-pointer"
                          >
                            Finalizar Avaliação do Curso
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Título da aula */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between gap-4 py-2">
                      <h2 className="text-xl sm:text-lg font-semibold text-gray-600">{aulaSelecionada?.titulo}</h2>
                      <div className="flex justify-between items-center gap-6">
                        {/* Botão Anterior */}
                        <button
                          onClick={() => aulaAnterior && setAulaSelecionada(aulaAnterior)}
                          disabled={!aulaAnterior}
                          className={`flex items-center text-sm font-medium transition
                  ${aulaAnterior ? "text-gray-700 hover:text-black" : "text-gray-300 cursor-not-allowed"}`}
                        >
                          <span className="text-lg mr-1">‹</span> Anterior
                        </button>

                        {isUltimaAula ? (
                          cursoTemAvaliacao ? (
                            todasAvaliacoesCursoConcluidas ? (
                              // ✅ Avaliação já feita → finalizar curso
                              <button
                                onClick={handleFinalizarCurso}
                                disabled={!stepsObrigatoriosConcluidos}
                                className={`flex items-center text-sm font-medium transition
                              ${stepsObrigatoriosConcluidos
                                    ? "text-blue-600 hover:text-blue-800 cursor-pointer"
                                    : "text-gray-300 cursor-not-allowed"}`}
                              >
                                Finalizar Curso <span className="text-lg ml-1">›</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  const avaliacao = curso?.avaliacoes?.[0];
                                  if (avaliacao) {
                                    setAulaSelecionada(null);
                                    setAvaliacaoCursoSelecionada(avaliacao);
                                    setStepAtualIndex(0);
                                  }
                                }}
                                disabled={!stepsObrigatoriosConcluidos}
                                className={`flex items-center text-sm font-medium transition
                              ${stepsObrigatoriosConcluidos
                                    ? "text-blue-600 hover:text-blue-800 cursor-pointer"
                                    : "text-gray-300 cursor-not-allowed"}`}
                              >
                                Fazer Avaliação do Curso <span className="text-lg ml-1">›</span>
                              </button>
                            )
                          ) : (
                            // 🚀 Curso sem avaliação → finalizar normalmente
                            <button
                              onClick={handleFinalizarCurso}
                              disabled={!stepsObrigatoriosConcluidos}
                              className={`flex items-center text-sm font-medium transition
                            ${stepsObrigatoriosConcluidos
                                  ? "text-blue-600 hover:text-blue-800 cursor-pointer"
                                  : "text-gray-300 cursor-not-allowed"}`}
                            >
                              Finalizar Curso <span className="text-lg ml-1">›</span>
                            </button>
                          )
                        ) : (
                          // 👉 Próxima aula
                          <button
                            onClick={() => proximaAula && stepsObrigatoriosConcluidos && setAulaSelecionada(proximaAula)}
                            disabled={!proximaAula || !stepsObrigatoriosConcluidos}
                            className={`flex items-center text-sm font-medium transition
                          ${proximaAula && stepsObrigatoriosConcluidos
                                ? "text-blue-600 hover:text-blue-800 cursor-pointer"
                                : "text-gray-300 cursor-not-allowed"}`}
                          >
                            Próxima <span className="text-lg ml-1">›</span>
                          </button>
                        )}

                      </div>

                    </div>

                    {/* Linha de etapas com progresso */}
                    {aulaSelecionada?.steps?.length > 0 && (
                      <div className="mt-1">
                        {/* Barra de progresso (opcional abaixo da linha de etapas) */}
                        <div className="mb-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{
                                width: `${(stepsConcluidos.length / aulaSelecionada.steps.length) * 100}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1 text-xs text-gray-600">
                          {aulaSelecionada.steps.map((step: any, idx: number) => {
                            const tipo = step.tipo?.toLowerCase();
                            const concluido = stepsConcluidos.includes(step.idAulaStep);
                            const atual = idx === stepAtualIndex;

                            const icon =
                              tipo === "video" ? <Video className="w-3 h-3" /> :
                                tipo === "material" ? <FileText className="w-3 h-3" /> :
                                  tipo === "avaliacao" ? <File className="w-3 h-3" /> :
                                    <Info className="w-3 h-3" />;

                            const statusIcon = concluido ? "✅" : atual ? "▶️" : "⬜";

                            const podeAcessar = (() => {
                              if (concluido) return true;
                              if (idx === stepAtualIndex) return true;

                              const anterioresObrigatorios = aulaSelecionada.steps
                                .slice(0, idx)
                                .filter((s: any) => s.obrigatorio);

                              const anterioresConcluidos = anterioresObrigatorios.every((s: any) =>
                                stepsConcluidos.includes(s.idAulaStep)
                              );

                              return anterioresConcluidos;
                            })();


                            return (
                              <button
                                key={step.idAulaStep}
                                onClick={() => {
                                  if (podeAcessar) setStepAtualIndex(idx);
                                }}
                                disabled={!podeAcessar}
                                title={podeAcessar ? "Clique para acessar esta etapa" : "Etapa bloqueada"}
                                className={`inline-flex items-center gap-1 border rounded-full px-2 py-0.5 text-xs transition
                          ${atual ? "border-blue-500 bg-blue-50 text-blue-700 cursor-pointer" :
                                    concluido ? "border-green-300 bg-green-50 text-green-700 cursor-pointer" :
                                      "border-gray-300 bg-white text-gray-500 cursor-pointer"}
                          ${!podeAcessar ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}
                        `}
                              >
                                <span>{statusIcon}</span>
                                {icon}
                                <span className="capitalize">{tipo}</span>
                                {idx < aulaSelecionada.steps.length - 1 && (
                                  <span className="mx-1 text-gray-400">→</span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                      </div>
                    )}

                  </div>

                  {/* Conteudo da Aula (Video, Material ou Avaliação) */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-black flex justify-center items-center">
                      {stepAtual?.tipo === "video" && (
                        <div className="w-full aspect-video rounded overflow-hidden shadow-md">
                          <ReactPlayer
                            src={
                              aulaSelecionada?.videos?.find(
                                (v: any) => v.idAulaVideo === stepAtual.fkAulaVideoId
                              )?.url ?? ""
                            }
                            width="100%"
                            height="100%"
                            controls
                            playing={false}
                            style={{ backgroundColor: "black" }}
                            config={{
                              youtube: {
                                playerVars: { modestbranding: 1, rel: 0 },
                              } as any,
                            }}
                            onEnded={() => {
                              if (!stepsConcluidos.includes(stepAtual.idAulaStep)) {
                                registrarStepBackend(stepAtual, 100);
                              }

                              // Tenta ir para o próximo se existir
                              const proximo = aulaSelecionada?.steps?.[stepAtualIndex + 1];
                              if (proximo) {
                                setTimeout(() => setStepAtualIndex((i) => i + 1), 300);
                              }
                            }}

                          />
                        </div>
                      )}

                      {stepAtual?.tipo === "material" && (
                        <div className="w-full aspect-video flex items-center justify-center bg-white text-center p-4">
                          <button
                            onClick={() => {
                              const mat = aulaSelecionada?.materiais?.find(
                                (m: any) => m.idMaterialComplementar === stepAtual.fkMaterialId
                              );
                              if (mat) {
                                setMaterialSelecionado({ titulo: mat.titulo, url: mat.material });
                                setModalOpen(true);
                                marcarConcluido(stepAtual.idAulaStep);
                                setTimeout(() => {
                                  setStepAtualIndex((i) => i + 1);
                                }, 300);
                              }
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            Visualizar material
                          </button>
                        </div>
                      )}

                      {stepAtual?.tipo === "avaliacao" && (() => {
                        const idAv = stepAtual?.fkAvaliacaoId as number | undefined;
                        const jaRespondida = !!(idAv && avaliacoesRespondidasMap[idAv]);

                        return (
                          <div className="w-full flex flex-col items-center justify-start bg-white text-left p-8 overflow-y-auto">
                            {/* Cabeçalho fixo */}
                            <div className="text-center rounded-lg w-full mb-4">
                              <div className="flex items-center justify-center gap-2 text-purple-600 mb-2">
                                <h3 className="text-xl font-bold text-gray-800">
                                  {avaliacaoCompleta?.titulo}
                                </h3>
                              </div>

                              <div className="flex items-center gap-3 justify-center text-xs text-gray-600 mt-2 mb-6">
                                {/* Quantidade de Perguntas */}
                                <div className="flex items-center gap-1 px-3 py-1 bg-gray-50 border border-gray-200 rounded-full">
                                  <BookOpen className="w-4 h-4 text-purple-600" />
                                  <span className="font-medium">{avaliacaoCompleta?.perguntas?.length ?? 0} pergunta{avaliacaoCompleta?.perguntas?.length === 1 ? "" : "s"}</span>
                                </div>

                                {/* Tempo estimado */}
                                <div className="flex items-center gap-1 px-3 py-1 bg-gray-50 border border-gray-200 rounded-full">
                                  <Clock className="w-4 h-4 text-blue-600" />
                                  <span className="font-medium">{avaliacaoCompleta?.tempo_limite ?? 0} min</span>
                                </div>

                                {/* Tipo da avaliação */}
                                <div className="flex items-center gap-1 px-3 py-1 bg-gray-50 border border-gray-200 rounded-full">
                                  {avaliacaoCompleta?.tipoAplicacao === "quiz" ? (
                                    <ClipboardList className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  )}
                                  <span className="font-medium capitalize">
                                    {avaliacaoCompleta?.tipoAplicacao}
                                  </span>
                                </div>
                              </div>

                              {!jaRespondida ? (
                                <>
                                  {!avaliacaoIniciada && (
                                    <button
                                      onClick={() => {
                                        const id = avaliacaoCompleta?.idAvaliacao;
                                        if (id) iniciar(id);
                                        else toast.error("Nenhuma avaliação encontrada.");
                                      }}
                                      className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm shadow-sm cursor-pointer"
                                    >
                                      Iniciar avaliação
                                    </button>
                                  )}
                                </>
                              ) : !avaliacaoIniciada && (
                                <>
                                  <button
                                    onClick={() => setVerDetalhes(!verDetalhes)}
                                    className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm shadow-sm cursor-pointer"
                                  >
                                    {verDetalhes ? "Ocultar resultados" : "Ver resultados"}
                                  </button>
                                </>
                              )}
                            </div>

                            {/* 1 - Tentativas */}
                            {verDetalhes && !avaliacaoIniciada && avaliacoesRespondidasMap[stepAtual.fkAvaliacaoId]?.nota !== undefined && (
                              <div className="w-full text-sm ">
                                <p className="text-sm text-gray-600 font-semibold mb-3">Tentativas anteriores:</p>

                                {/* Abas */}
                                <div className="w-full flex flex-wrap gap-2 border-b border-gray-200 pb-1 overflow-x-auto custom-scrollbar">
                                  {avaliacaoCompleta?.avaliacoesUsuarios?.map((av: any, idx: number) => (
                                    <button
                                      key={av.idAvaliacaoUsuario}
                                      onClick={() => setAbaTentativaAtiva(av.idAvaliacaoUsuario)}
                                      className={`px-4 py-1 rounded-t-md border-b-2 text-sm transition cursor-pointer
                                ${abaTentativaAtiva === av.idAvaliacaoUsuario
                                          ? "border-blue-600 text-blue-700 font-medium"
                                          : "border-transparent text-gray-600 hover:text-gray-800"}
                                `}
                                    >
                                      Tentativa {idx + 1}
                                    </button>
                                  ))}
                                </div>

                                {/* Conteúdo da aba ativa */}
                                {tentativaSelecionada && (
                                  <div className="p-4 space-y-4">
                                    <div>
                                      <p className="text-gray-700 font-medium mb-1">
                                        Nota: {tentativaSelecionada?.nota ?? "—"}
                                        {typeof tentativaSelecionada?.nota === "number" && (
                                          <span
                                            className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${tentativaSelecionada.nota >= 6
                                              ? "bg-green-100 text-green-700"
                                              : "bg-red-100 text-red-700"}`}
                                          >
                                            {tentativaSelecionada.nota >= 6 ? "Aprovado" : "Reprovado"}
                                          </span>
                                        )}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Finalizada em:{" "}
                                        {tentativaSelecionada?.dataFim
                                          ? new Date(tentativaSelecionada.dataFim).toLocaleString()
                                          : "—"}
                                      </p>
                                    </div>

                                    {tentativaSelecionada.resultado.map((pergunta: any, idx: number) => {
                                      const isDissertativa = !Array.isArray(pergunta.alternativas) || pergunta.alternativas.length === 0;

                                      return (
                                        <div key={pergunta.idPergunta} className="p-4 bg-white rounded-lg border border-gray-200">
                                          <p className="font-medium text-gray-800 mb-2">
                                            {idx + 1}. {pergunta.enunciado}
                                          </p>

                                          {isDissertativa ? (
                                            <div className="mt-2 p-3 bg-gray-100 rounded border border-gray-300 text-sm text-gray-800 whitespace-pre-wrap">
                                              {pergunta.respostaTexto || <span className="italic text-gray-400">Sem resposta</span>}
                                            </div>
                                          ) : (
                                            <div className="space-y-2">
                                              {pergunta.alternativas.map((alt: any) => {
                                                const correta = alt.correta;
                                                const selecionada = alt.selecionada;

                                                let style = "border border-gray-300 bg-white text-gray-800";
                                                let icon = null;

                                                if (correta && selecionada) {
                                                  style = "border border-green-600 bg-green-50 text-green-800 font-semibold";
                                                  icon = <span className="text-green-600 text-lg"><CircleCheck className="w-4 h-4" /></span>;
                                                } else if (!correta && selecionada) {
                                                  style = "border border-red-500 bg-red-50 text-red-700 font-semibold";
                                                  icon = <span className="text-red-500 text-lg"><CircleX className="w-4 h-4" /></span>;
                                                } else if (correta) {
                                                  style = "border border-green-500 bg-green-50 text-green-800";
                                                  icon = <span className="text-green-500 text-lg"><CircleCheck className="w-4 h-4" /></span>;
                                                }

                                                return (
                                                  <div
                                                    key={alt.idAlternativa}
                                                    className={`flex justify-between items-center px-4 py-2 rounded-lg transition ${style}`}
                                                  >
                                                    <span className="text-sm">{alt.texto}</span>
                                                    {icon}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Refazer botão */}
                                <div className="text-center">
                                  <button
                                    onClick={refazerAvaliacao}
                                    className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 text-sm shadow-sm cursor-pointer"
                                  >
                                    Refazer avaliação
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* 2 - Responder Avaliação */}
                            {avaliacaoIniciada && (
                              <div className="w-full space-y-6">
                                {avaliacaoCompleta?.perguntas?.map((pergunta: any, idx: number) => (
                                  <div
                                    key={pergunta.idPergunta}
                                    className="px-4 py-2 rounded border-1 border-gray-200 shadow"
                                  >
                                    <p className="font-medium text-gray-800 mb-1 select-none">
                                      {idx + 1}. {pergunta.enunciado}
                                    </p>
                                    <div className="border-b border-gray-300 mb-2"></div>
                                    <div className="space-y-2">
                                      {pergunta.tipo === "dissertativa" ? (
                                        <textarea
                                          placeholder="Digite sua resposta aqui..."
                                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none"
                                          rows={4}
                                          onChange={(e) =>
                                            selecionarResposta(pergunta.idPergunta, e.target.value)
                                          }
                                        />
                                      ) : (
                                        pergunta.alternativas.map((alt: any) => (
                                          <label
                                            key={alt.idAlternativa}
                                            className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer bg-gray-50 border border-gray-200 px-2 py-1 rounded"
                                          >
                                            <input
                                              type="radio"
                                              name={`pergunta_${pergunta.idPergunta}`}
                                              value={alt.idAlternativa}
                                              onChange={(e) =>
                                                selecionarResposta(pergunta.idPergunta, alt.idAlternativa, e.target.checked)
                                              }
                                              className="accent-blue-600 cursor-pointer w-3.5 h-3.5"
                                            />
                                            <span>{alt.texto}</span>
                                          </label>
                                        ))
                                      )}
                                    </div>

                                  </div>
                                ))}

                                <div className="text-center">
                                  <button
                                    onClick={finalizarAvaliacao}
                                    className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm shadow-sm cursor-pointer"
                                  >
                                    Finalizar avaliação
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                    </div>

                    {/* Abas */}
                    {!avaliacaoIniciada && (
                      <>
                        <div className="px-4 sm:px-6">
                          <Tabs abaAtiva={abaAtiva} setAbaAtiva={setAbaAtiva} />

                          {/* Conteúdo das abas */}
                          <div className="py-4">
                            {abaAtiva === "sobre" && (
                              <Sobre descricao={aulaSelecionada?.descricao} curso={curso} estatisticas={estatisticas} />
                            )}

                            {abaAtiva === "materiais" && (
                              <ListaMateriais
                                materiais={aulaSelecionada?.materiais ?? []}
                                abrirMaterial={(titulo, url) => {
                                  setMaterialSelecionado({ titulo, url });
                                  setModalOpen(true);
                                }}
                              />
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}

            </>
          )}
        </section>
      </div>

      {/* Modal de visualização de materiais */}
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

function Tabs({ abaAtiva, setAbaAtiva }: { abaAtiva: Aba; setAbaAtiva: (a: Aba) => void }) {
  const items: { id: Aba; label: string; icon: React.ReactNode }[] = [
    { id: "sobre", label: "Sobre", icon: <Info className="w-4 h-4" /> },
    { id: "materiais", label: "Materiais", icon: <Files className="w-4 h-4" /> },
  ];

  return (
    <div className="mt-3 border-b border-gray-200">
      <div className="flex gap-1">
        {items.map((t) => {
          const active = abaAtiva === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setAbaAtiva(t.id)}
              className={`whitespace-nowrap px-3 py-2 text-sm border-b-2 -mb-px transition cursor-pointer
                ${active ? "border-blue-600 text-blue-700" : "border-transparent text-gray-600 hover:text-gray-900"}`}
            >
              <span className="inline-flex items-center gap-2">
                {t.icon}
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Sobre({ descricao, curso, estatisticas }: { descricao?: string; curso: CursoCompleto, estatisticas: any }) {

  return (
    <>
      <div className="grid md:grid-cols-3 gap-6 mt-1">
        {/* Descrição */}
        <div className="md:col-span-2">
          <h3 className="text-base font-semibold text-gray-800 mb-2">Descrição da aula</h3>
          <p className="text-xs text-gray-700 whitespace-pre-wrap">
            {descricao || "Sem descrição para esta aula."}
          </p>
        </div>

        {/* Card lateral */}
        <div className="space-y-2">
          <h1 className="text-base font-semibold text-gray-800 mb-2">Sobre o Curso</h1>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="space-y-3 text-sm">
              <Linha titulo="Módulos" valor={`${estatisticas.qtdModulos}`} icon={<LibraryBig className="w-4 h-4" />} />
              <Linha titulo="Aulas" valor={`${estatisticas.qtdAulas}`} icon={<Book className="w-4 h-4" />} />
              <Linha titulo="Duração Total" valor={formatarMinutosEmHoras(estatisticas.duracaoTotal)} icon={<Clock className="w-4 h-4" />} />
            </div>
          </div>
        </div>

      </div>

      <div className="border-b border-gray-300 mt-4 mb-2"></div>

      {/* Sobre o Instrutor */}
      <div className="space-y-2">
        <h1 className="text-base font-semibold text-gray-800 mb-1">Instrutor</h1>

        <div className="flex items-center gap-3 py-2">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 overflow-hidden flex items-center justify-center">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(curso.responsaveltecnico?.nome || "Instrutor")}&background=green&color=fff&size=128`}
              alt="Avatar do instrutor"
              className="w-full h-full object-cover"
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-900 leading-none">
              {curso.responsaveltecnico?.nome}
            </p>
            <p className="text-xs text-gray-500 leading-tight">
              {curso.responsaveltecnico?.funcao} - {curso.responsaveltecnico?.registro}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function Linha({ titulo, valor, icon }: { titulo: string; valor: string, icon?: React.ReactNode }) {
  return (
    <div>
      <div className="text-gray-500 text-xs">{titulo}</div>
      <div className="flex items-end gap-1 mt-0.5">
        <span className="text-gray-500">{icon}</span>
        <div className="font-medium text-gray-800 leading-none">{valor}</div>
      </div>
    </div>
  );
}

function ListaMateriais({ materiais, abrirMaterial, }: { materiais: { idMaterialComplementar: number; titulo: string; material: string, tipo: string }[]; abrirMaterial: (titulo: string, url: string) => void; }) {
  if (!materiais?.length) {
    return <p className="text-sm text-gray-500 italic mt-2">Nenhum material disponível para esta aula.</p>;
  }

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-800 mb-2">Materiais Complementares</h3>
      <ul className="mt-2 space-y-2">
        {materiais.map((m) => (
          <li key={m.idMaterialComplementar} className="px-2">
            <button
              onClick={() => abrirMaterial(m.titulo, m.material)}
              className="flex items-center gap-2 text-sm text-gray-700 hover:underline cursor-pointer"
            >
              {getIconeMaterial(m.tipo)}
              <span className="truncate">{m.titulo}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function getIconeMaterial(tipo: string): JSX.Element {
  switch (tipo) {
    case "pdf":
      return <FileText className="w-4 h-4 text-blue-600" />;
    case "doc":
      return <File className="w-4 h-4 text-green-600" />;
    case "ppt":
      return <FileChartLine className="w-4 h-4 text-orange-500" />;
    case "link":
      return <Link2 className="w-4 h-4 text-purple-600" />;
    case "video":
      return <Play className="w-4 h-4 text-red-600" />;
    case "outro":
    default:
      return <File className="w-4 h-4 text-gray-500" />;
  }
}