import { useEffect, useMemo, useState, type JSX } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import ReactPlayer from "react-player";
import { getCursoCompleto } from "../../services/apiCurso";
import type { CursoCompleto } from "../../types/EstruturaCurso";
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
} from "lucide-react";
import ModalVisualizador from "../../components/Modais/ModalVisualizador";
import { formatarMinutosEmHoras } from "../../auxiliares/formatters";

type Aba = "sobre" | "materiais";

export default function PlayCursoPage() {
  const { idCurso } = useParams();
  const [searchParams] = useSearchParams();
  const aulaInicialId = searchParams.get("aula");

  const navigate = useNavigate();

  const [curso, setCurso] = useState<CursoCompleto | null>(null);
  const [aulaSelecionada, setAulaSelecionada] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [abaAtiva, setAbaAtiva] = useState<Aba>("sobre");

  const [modalOpen, setModalOpen] = useState(false);
  const [materialSelecionado, setMaterialSelecionado] = useState<{ titulo: string; url: string } | null>(null);

  const [videoIndex, setVideoIndex] = useState(0);

  const currentVideoUrl =
    aulaSelecionada?.videos?.[videoIndex]?.url ?? aulaSelecionada?.url ?? null;

  useEffect(() => {
    setVideoIndex(0);
  }, [aulaSelecionada?.idAula]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getCursoCompleto(Number(idCurso));
        setCurso(data);

        console.log(data);

        const todasAulas = data.modulos.flatMap((m) => m.aulas);
        const aula = todasAulas.find((a) => String(a.idAula) === aulaInicialId) ?? todasAulas[0];
        setAulaSelecionada(aula ?? null);
      } finally {
        setLoading(false);
      }
    };

    if (idCurso) load();
  }, [idCurso, aulaInicialId]);

  const estatisticas = useMemo(() => {
    if (!curso) return { qtdAulas: 0, duracaoTotal: 0 };
    const qtdModulos = curso.modulos.length;
    const todasAulas = curso.modulos.flatMap((m) => m.aulas ?? []);
    const qtdAulas = todasAulas.length;
    const duracaoTotal = todasAulas.reduce((acc, a) => acc + Number(a.duracao || 0), 0);
    return { qtdModulos, qtdAulas, duracaoTotal };
  }, [curso]);

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
          {curso.modulos.map((mod) => (
            <div key={mod.idModulo} className="mb-4">
              <div className="px-1 text-[13px] font-semibold text-gray-700">{mod.titulo}</div>
              <ul className="mt-2 space-y-1">
                {mod.aulas.map((aula) => {
                  const isActive = aula.idAula === aulaSelecionada?.idAula;
                  const isVideo = aula.tipo === "video";
                  return (
                    <li key={aula.idAula}>
                      <button
                        onClick={() => setAulaSelecionada(aula)}
                        className={`group w-full text-left flex items-center gap-2 px-3 py-2 rounded-full border transition cursor-pointer
                          ${isActive ? "bg-blue-50 border-blue-200" : "bg-white hover:bg-gray-50 border-gray-200"}`}
                      >
                        <span className="shrink-0">
                          {isVideo ? (
                            <Video className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-gray-500"}`} />
                          ) : (
                            <FileText className={`w-4 h-4 ${isActive ? "text-green-600" : "text-gray-500"}`} />
                          )}
                        </span>
                        <span className={`text-xs line-clamp-1 ${isActive ? "text-blue-800 font-medium" : "text-gray-700"}`}>
                          {aula.titulo}
                        </span>
                        <span className="ml-auto flex items-center gap-1 text-[11px] text-gray-500">
                          <Clock className="w-3 h-3" />
                          {formatarMinutosEmHoras(aula.duracao).split("min")[0] || 0}m
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </aside>

        {/* Conteúdo principal */}
        <section className="flex-1 min-w-0 max-h-[88vh] overflow-y-auto bg-white border border-gray-200 rounded-lg px-5 py-3 custom-scrollbar">
          {/* Título da aula */}
          <div className="mb-2">
            <h2 className="text-xl sm:text-lg font-semibold text-gray-600">{aulaSelecionada?.titulo}</h2>

            {/* <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2 py-0.5 capitalize">
                <Play className="w-3 h-3" />
                {aulaSelecionada?.tipo}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2 py-0.5">
                <FileText className="w-3 h-3" />
                {aulaSelecionada?.materiais.length || 0} Arquivos
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2 py-0.5">
                <Clock className="w-3 h-3" />
                {formatarMinutosEmHoras(aulaSelecionada?.duracao)}
              </span>
            </div> */}
          </div>

          {/* Player */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-black flex justify-center items-center">
              {currentVideoUrl ? (
                <div className="w-full aspect-video rounded overflow-hidden shadow-md">
                  <ReactPlayer
                    src={String(currentVideoUrl)}
                    width="100%"
                    height="100%"
                    controls
                    playing={false}
                    style={{ backgroundColor: "black" }}
                    onEnded={() => {
                      const total = aulaSelecionada?.videos?.length ?? 0;
                      if (total > 0 && videoIndex < total - 1) {
                        setVideoIndex((i) => i + 1);
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="text-white flex items-center justify-center h-full">
                  Vídeo não disponível
                </div>
              )}
            </div>

            {aulaSelecionada?.steps?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-base font-semibold text-gray-800 mb-3">Etapas da Aula</h3>
                <ol className="space-y-3">
                  {aulaSelecionada.steps.map((step: any, idx: number) => {
                    const tipo = step.tipo?.toLowerCase();
                    const obrigatorio = step.obrigatorio === 1;
                    const ordem = idx + 1;

                    return (
                      <li
                        key={step.idAulaStep}
                        className="flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-2 bg-white shadow-sm"
                      >
                        <span className="text-xs text-gray-500 font-semibold">#{ordem}</span>

                        {/* Etapa: Vídeo */}
                        {tipo === "video" && (
                          <>
                            <Video className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-gray-800">Assistir vídeo</span>
                            <button
                              onClick={() => {
                                const index = aulaSelecionada.videos?.findIndex(
                                  (v: any) => v.idAulaVideo === step.fkAulaVideoId
                                );
                                if (index >= 0) setVideoIndex(index);
                              }}
                              className="ml-auto text-xs text-blue-700 hover:underline"
                            >
                              Assistir
                            </button>
                          </>
                        )}

                        {/* Etapa: Material */}
                        {tipo === "material" && (
                          <>
                            <FileText className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-gray-800">Ler material</span>
                            <button
                              onClick={() => {
                                const mat = aulaSelecionada.materiais?.find(
                                  (m: any) => m.idMaterialComplementar === step.fkMaterialId
                                );
                                if (mat) {
                                  setMaterialSelecionado({ titulo: mat.titulo, url: mat.material });
                                  setModalOpen(true);
                                }
                              }}
                              className="ml-auto text-xs text-green-700 hover:underline"
                            >
                              Visualizar
                            </button>
                          </>
                        )}

                        {/* Etapa: Avaliação */}
                        {tipo === "avaliacao" && (
                          <>
                            <File className="w-4 h-4 text-purple-600" />
                            <span className="text-sm text-gray-800">Realizar avaliação</span>
                            <button
                              onClick={() => {
                                alert("Abrir avaliação ID " + step.fkAvaliacaoId);
                                // Aqui você pode redirecionar para uma rota tipo `/avaliacao/${step.fkAvaliacaoId}`
                              }}
                              className="ml-auto text-xs text-purple-700 hover:underline"
                            >
                              Iniciar
                            </button>
                          </>
                        )}

                        {/* Badge obrigatório */}
                        {obrigatorio && (
                          <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold text-red-600 border border-red-200 rounded-full">
                            Obrigatório
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {/* Abas */}
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
          </div>
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

/* ------------------------------ Componentes auxiliares ------------------------------ */

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