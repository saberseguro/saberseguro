import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Clock, User, Plus, LinkIcon, Pencil, CalendarClock } from "lucide-react";
import { getCursoPorId } from "../../services/apiCurso";
import toast from "react-hot-toast";
import type { CertificadoModelo, Curso, Modulo } from "../../types/EstruturaCurso";
import Loading from "../../components/Loading";
import { formatarMinutosEmHoras } from "../../auxiliares/formatters";
import SortableContextWrapper from "../../components/SortableContextWrapper";
import SortableAvaliacoes from "../../components/SortableAvaliacoes";
import { getCertificadosModelo, vincularCertificadoAoCurso } from "../../services/apiCertificadoModelo";
import { SearchableSelect } from "../../components/Formularios/Inputs";

export default function CursoViewPage({ idCurso }: { idCurso: number }) {
  const navigate = useNavigate();
  const [curso, setCurso] = useState<Curso | null>(null);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<"detalhes" | "modulos" | "avaliacoes" | "certificados">("detalhes");
  const [modelos, setModelos] = useState<CertificadoModelo[]>([]);
  const [modeloSelecionado, setModeloSelecionado] = useState<number | null>(null);

  useEffect(() => {
    getCursoPorId(idCurso)
      .then(setCurso)
      .catch(() => {
        toast.error("Erro ao carregar curso");
        navigate("/cursos");
      })
      .finally(() => setLoading(false));

    getCertificadosModelo()
      .then(setModelos)
      .catch(() => toast.error("Erro ao buscar modelos de certificado"));
  }, [idCurso]);

  if (loading) return <Loading />;

  if (!curso) return <p className="text-center text-gray-500">Curso não encontrado.</p>;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {/* Botão Voltar */}
          <button
            onClick={() => navigate("/cursos/gerenciar")}
            className="flex items-center justify-center p-2 hover:bg-gray-200 rounded-full transition cursor-pointer"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>

          <div>
            <h1 className="text-3xl font-bold text-gray-800">{curso.titulo}</h1>
          </div>
        </div>

        {/* Botão Editar */}
        <button
          onClick={() => navigate(`/cursos/${curso.idCurso}?modo=editar`)}
          className="flex items-center gap-2 text-blue-600 cursor-pointer hover:bg-gray-200 px-3 py-1.5 rounded-md hover:opacity-90 transition"
        >
          <Edit size={16} />
          Editar
        </button>
      </div>

      <div className="w-full">
        <div className="bg-white rounded-lg border border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Informações do Curso
          </h2>

          {/* Abas */}
          <div className="flex border-b border-gray-300 mb-4">
            {[
              { key: "detalhes", label: "Detalhes" },
              { key: "modulos", label: `Módulos (${curso.modulos?.length ?? 0})` },
              { key: "avaliacoes", label: `Avaliações (${curso.avaliacoes?.length ?? 0})` },
              { key: "certificados", label: `Certificado` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setAba(tab.key as any)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition cursor-pointer ${aba === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Conteúdo das Abas */}
          {aba === "detalhes" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">
                  Descrição
                </h3>
                <p className="text-gray-500 text-sm">{curso.descricao || "Sem descrição"}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 bg-gray-50 rounded-md p-3">
                  <Clock className="text-blue-500 w-5 h-5" />
                  <div>
                    <p className="text-xs text-gray-500">Carga Horária</p>
                    <p className="text-sm font-medium text-gray-700">
                      {formatarMinutosEmHoras(curso.cargaHoraria)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-md p-3">
                  <User className="text-purple-500 w-5 h-5" />
                  <div>
                    <p className="text-xs text-gray-500">Responsável</p>
                    <p className="text-sm font-medium text-gray-700">
                      {curso.responsaveltecnico?.nome || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-md p-3">
                  <CalendarClock className="text-green-500 w-5 h-5" />
                  <div>
                    <p className="text-xs text-gray-500">Prazo (dias)</p>
                    <p className="text-sm font-medium text-gray-700">
                      {curso.prazo || "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {aba === "modulos" && (
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold text-gray-700">
                  Módulos do Curso ({curso.modulos?.length || 0})
                </h2>
                <button
                  onClick={() =>
                    navigate(`/cursos/${idCurso}/modulo/novo?ordem=${curso.modulos?.length + 1}`)
                  }
                  className="flex items-center gap-2 bg-blue-600 text-sm text-white px-4 py-2 rounded-md hover:opacity-90 cursor-pointer"
                >
                  <Plus size={16} /> Adicionar Módulo
                </button>
              </div>
              {curso.modulos?.length ? (
                <>
                  <SortableContextWrapper
                    items={curso.modulos}
                    onReorder={(novos: Modulo[]) =>
                      setCurso((prev) => (prev ? { ...prev, modulos: novos } : prev))
                    }
                  />
                </>
              ) : (
                <p className="text-sm text-gray-500">Nenhum módulo encontrado.</p>
              )}
            </div>
          )}

          {aba === "avaliacoes" && (
            <div className="space-y-3">

              <div className="flex justify-between items-center">
                <h5 className="font-semibold text-gray-700">
                  Avaliações ({curso.avaliacoes?.length ?? 0})
                </h5>

                <button
                  onClick={() =>
                    navigate(`/cursos/${idCurso}/avaliacao/novo?tipo=CURSO`)
                  }
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  + Adicionar Avaliação
                </button>
              </div>

              {curso.avaliacoes?.length ? (
                <SortableAvaliacoes
                  items={curso.avaliacoes}
                  onReorder={(novas) =>
                    setCurso((prev) => (prev ? { ...prev, avaliacoes: novas } : prev))
                  }
                  tipo="curso"
                />
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Nenhuma avaliação encontrada.
                </p>
              )}

            </div>
          )}

          {aba === "certificados" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-700">Modelo de Certificado</h2>

              {curso.certificadomodelo ? (
                <div className="flex items-center justify-between gap-4 bg-gray-50 border border-gray-200 p-4 rounded-md">
                  <p className="text-sm text-gray-600">
                    Modelo vinculado: <span className="font-medium text-gray-800">{curso.certificadomodelo.titulo}</span>
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        navigate(`/cursos/${idCurso}/certificados/${curso.certificadomodelo?.idCertificadoModelo}/editar`)
                      }
                      className="p-2 text-sm text-blue-500 rounded-full hover:bg-blue-100 flex items-center gap-1 cursor-pointer"
                    >
                      <Pencil size={14} />
                    </button>

                    {/* <button
                      onClick={() => {
                        setCurso((prev) => ({
                          ...prev!,
                          fkCertificadoModeloId: null,
                          certificadomodelo: null,
                        }));
                        toast.success("Modelo desvinculado do curso.");
                      }}
                      className="px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 cursor-pointer"
                    >
                      Desvincular
                    </button> */}
                  </div>
                </div>
              ) : (
                <>
                  <SearchableSelect
                    label="Selecionar Modelo"
                    value={modeloSelecionado ?? ""}
                    options={modelos.map((m) => ({
                      value: m.idCertificadoModelo,
                      label: m.titulo,
                    }))}
                    onChange={(e) => setModeloSelecionado(Number(e))}

                  />

                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate(`/certificados/novo?fkCursoId=${curso.idCurso}`)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-2 cursor-pointer"
                    >
                      <Plus size={16} /> Criar novo modelo
                    </button>

                    <button
                      disabled={!modeloSelecionado}
                      onClick={async () => {
                        if (!modeloSelecionado || !curso?.idCurso) return;

                        const modelo = modelos.find((m) => m.idCertificadoModelo === modeloSelecionado);
                        if (!modelo) return;

                        try {
                          // Chamada à API para vincular o modelo
                          await vincularCertificadoAoCurso(curso.idCurso, modelo.idCertificadoModelo);

                          // Atualiza o estado local do curso
                          setCurso((prev) => ({
                            ...prev!,
                            fkCertificadoModeloId: modelo.idCertificadoModelo,
                            certificadomodelo: modelo,
                          }));

                          // Limpa a seleção
                          setModeloSelecionado(null);
                          toast.success("Modelo vinculado com sucesso.");
                        } catch (err) {
                          console.error(err);
                          toast.error("Erro ao vincular modelo ao curso.");
                        }
                      }}

                      className={`px-4 py-2 text-sm rounded flex items-center gap-2 cursor-pointer ${modeloSelecionado
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                        }`}
                    >
                      <LinkIcon size={16} /> Vincular modelo
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
