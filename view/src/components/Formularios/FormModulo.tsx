import { useMemo, useState } from "react";
import type { Curso, Modulo, Aula } from "../../types/EstruturaCurso";
import FormAulaDetalhes from "./FormAulaDetalhes";
import { makeAvaliacao } from "../../types/FactoriesCurso";
import { ChevronDown, ChevronUp, Trash2, GripVertical, Plus } from "lucide-react";
import ToolTip from "../Auxiliares/ToolTip";
import CheckboxStatus, { Input } from "./Inputs";

// dnd-kit
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatarMinutosEmHoras } from "../../auxiliares/formatters";
import { withCalculatedCargaHoraria } from "../../auxiliares/cursoCalc";
import FormAvaliacao from "./FormAvaliacao";
import Swal from "sweetalert2";
import toast from "react-hot-toast";

interface Props {
  curso: Curso & { modulos: Modulo[] };
  setCurso: React.Dispatch<React.SetStateAction<Curso & { modulos: Modulo[] }>>;
  setLoading: (loading: boolean) => void;
  setUploadsPendentes: (tem: boolean) => void;
}

let tempId = -1;
const nextTempId = () => tempId--;

// Util para renumerar ordem após reorder
function renumerarOrdem<T extends { ordem?: number }>(arr: T[]): T[] {
  return arr.map((item, idx) => ({ ...item, ordem: idx + 1 }));
}

// --- Sortable Itens (Módulo e Aula) ---
function SortableRowWrapper({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    boxShadow: isDragging ? "0 6px 20px rgba(0,0,0,0.12)" : undefined,
    background: isDragging ? "#fff" : undefined,
  } as React.CSSProperties;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

type AbaModulo = "aulas" | "avaliacoes";

export default function FormModulos({ curso, setCurso, setUploadsPendentes }: Props) {
  const [expandedModuloId, setExpandedModuloId] = useState<number | null>(null);
  const [expandedAulaId, setExpandedAulaId] = useState<number | null>(null);

  // Estado de aba ativa por módulo
  const [modTabs, setModTabs] = useState<Record<number, AbaModulo>>({});

  const getAba = (idModulo?: number) =>
    idModulo != null ? modTabs[idModulo] ?? "aulas" : "aulas";

  const setAba = (idModulo: number | undefined, aba: AbaModulo) => {
    if (idModulo == null) return;
    setModTabs((prev) => ({ ...prev, [idModulo]: aba }));
  };

  // dnd sensors
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // ids dos módulos como strings (dnd-kit exige ids estáveis)
  const moduloIds = useMemo(
    () =>
      (curso.modulos ?? [])
        .slice()
        .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
        .map((m) => String(m.idModulo)),
    [curso.modulos]
  );

  const addModulo = () => {
    const novo: Modulo = {
      idModulo: nextTempId(),
      titulo: "Novo módulo",
      ordem: (curso.modulos?.length ?? 0) + 1,
      ativo: 1,
      aulas: [],
      avaliacoes: [],
      cargaHoraria: 0,
    };
    setCurso((c) => ({ ...c, modulos: [...(c.modulos ?? []), novo] }));
    setExpandedModuloId(novo.idModulo ?? null);
    setAba(novo.idModulo, "aulas");
  };

  const updateModulo = (idModulo: number | undefined, patch: Partial<Modulo>) => {
    if (idModulo == null) return;
    setCurso((c) => ({
      ...c,
      modulos: (c.modulos ?? []).map((m) => (m.idModulo === idModulo ? { ...m, ...patch } : m)),
    }));
  };

  const removeModulo = (idModulo: number | undefined) => {
    if (idModulo == null) return;

    Swal.fire({
      title: "Tem certeza?",
      text: "O módulo e todas as suas aulas serão removidos.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Sim, remover",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        setCurso((c) => {
          const sem = (c.modulos ?? []).filter((m) => m.idModulo !== idModulo);
          return { ...c, modulos: renumerarOrdem(sem) };
        });

        if (expandedModuloId === idModulo) {
          setExpandedModuloId(null);
        }

        setModTabs((prev) => {
          const { [idModulo!]: _, ...rest } = prev;
          return rest;
        });

        toast.success("Módulo removido com sucesso!");
      }
    });
  };

  const toggleAtivoModulo = (idModulo: number | undefined, atual: number | undefined) => {
    if (idModulo == null) return;
    const novoAtivo = (atual ?? 1) === 1 ? 0 : 1;
    updateModulo(idModulo, { ativo: novoAtivo });
  };

  const addAula = (idModulo: number | undefined) => {
    if (idModulo == null) return;
    const nova: Aula = {
      idAula: nextTempId(),
      titulo: "Nova aula",
      descricao: "",
      ordem: 1,
      ativo: 1,
      videos: [],
      materiais: [],
      avaliacoes: [],
      tipo: "video",
      duracao: 0,
    };
    setCurso((c) => ({
      ...c,
      modulos: (c.modulos ?? []).map((m) =>
        m.idModulo === idModulo ? { ...m, aulas: renumerarOrdem([...(m.aulas ?? []), { ...nova }]) } : m
      ),
    }));
    setExpandedAulaId(nova.idAula ?? null);
    setAba(idModulo, "aulas");
  };

  const updateAula = (
    idModulo: number | undefined,
    idAula: number | undefined,
    patch: Partial<Aula>
  ) => {
    if (idModulo == null || idAula == null) return;
    setCurso((c) => {
      const c2: Curso & { modulos: Modulo[] } = {
        ...c,
        modulos: (c.modulos ?? []).map((m) =>
          m.idModulo === idModulo
            ? { ...m, aulas: (m.aulas ?? []).map((a) => (a.idAula === idAula ? { ...a, ...patch } : a)) }
            : m
        ),
      };
      return withCalculatedCargaHoraria(c2);
    });
  };

  const removeAula = (idModulo: number | undefined, idAula: number | undefined) => {
    if (idModulo == null || idAula == null) return;

    Swal.fire({
      title: "Remover Aula?",
      text: "Esta aula será removida do módulo.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Sim, remover",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        setCurso((c) => ({
          ...c,
          modulos: (c.modulos ?? []).map((m) =>
            m.idModulo === idModulo
              ? { ...m, aulas: renumerarOrdem((m.aulas ?? []).filter((a) => a.idAula !== idAula)) }
              : m
          ),
        }));

        if (expandedAulaId === idAula) {
          setExpandedAulaId(null);
        }

        toast.success("Aula removida com sucesso!");
      }
    });
  };

  // Avaliação do MÓDULO
  const addAvaliacaoModulo = (idModulo: number | undefined) => {
    if (idModulo == null) return;

    setCurso((c) => {
      const modulosAtualizados = (c.modulos ?? []).map((m) => {
        if (m.idModulo !== idModulo) return m;

        const ordem = (m.avaliacoes?.length ?? 0) + 1;
        const novaAvaliacao = makeAvaliacao(Number(ordem));
        novaAvaliacao.fkModuloId = idModulo;

        return {
          ...m,
          avaliacoes: [...(m.avaliacoes ?? []), novaAvaliacao],
        };
      });

      return { ...c, modulos: modulosAtualizados };
    });

    setAba(idModulo, "avaliacoes");
  };

  // --- Drag End Handlers ---
  const handleModuloDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setCurso((c) => {
      const list = (c.modulos ?? []).slice().sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
      const oldIndex = list.findIndex((m) => String(m.idModulo) === String(active.id));
      const newIndex = list.findIndex((m) => String(m.idModulo) === String(over.id));
      const moved = arrayMove(list, oldIndex, newIndex);
      return { ...c, modulos: renumerarOrdem(moved) };
    });
  };

  const handleAulaDragEnd = (idModulo: number) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setCurso((c) => ({
      ...c,
      modulos: (c.modulos ?? []).map((m) => {
        if (m.idModulo !== idModulo) return m;
        const aulas = (m.aulas ?? []).slice().sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
        const oldIndex = aulas.findIndex((a) => String(a.idAula) === String(active.id));
        const newIndex = aulas.findIndex((a) => String(a.idAula) === String(over.id));
        const moved = arrayMove(aulas, oldIndex, newIndex);
        return { ...m, aulas: renumerarOrdem(moved) };
      }),
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-700">
          Módulos ({curso.modulos?.length ?? 0})
        </h3>
        <button
          type="button"
          onClick={addModulo}
          className="px-3 py-2 text-sm bg-sky-600 text-white rounded-md hover:bg-sky-700 cursor-pointer flex items-center gap-1"
        >
          <Plus size={16} /> Adicionar módulo
        </button>
      </div>

      {/* DnD Módulos */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleModuloDragEnd}>
        <SortableContext items={moduloIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {(curso.modulos ?? [])
              .slice()
              .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
              .map((m) => {
                const moduloKey = String(m.idModulo);
                const abaAtiva = getAba(m.idModulo);
                return (
                  <SortableRowWrapper key={moduloKey} id={moduloKey}>
                    <div className="rounded-md border border-gray-200 bg-white shadow-sm">
                      {/* Cabeçalho do módulo */}
                      <div className="flex flex-wrap items-center gap-2 p-4 border-b border-gray-100">
                        {/* Drag handle visual */}
                        <div className="cursor-grab text-gray-400" title="Arraste para reordenar">
                          <GripVertical />
                        </div>

                        <div className="flex-1 min-w-56">
                          <Input
                            name="titulo"
                            value={m.titulo ?? ""}
                            onChange={(e) => updateModulo(m.idModulo, { titulo: e.target.value })}
                            required={false}
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <p className="text-xs">Carga horária: </p>
                          <p className="text-xs font-bold">
                            {formatarMinutosEmHoras(m.cargaHoraria)}
                          </p>
                        </div>

                        <ToolTip text={`${(m.ativo ?? 1) === 1 ? "Inativar" : "Ativar"}`}>
                          {/* Se teu CheckboxStatus entende "checked = inativo", mantemos invertido */}
                          <CheckboxStatus
                            checked={(m.ativo ?? 1) !== 1}
                            onChange={() => toggleAtivoModulo(m.idModulo, m.ativo)}
                          />
                        </ToolTip>

                        <button
                          type="button"
                          onClick={() => removeModulo(m.idModulo)}
                          className="text-sm text-red-600 hover:text-red-700 rounded cursor-pointer pl-1"
                        >
                          <ToolTip text="Excluir">
                            <Trash2 size={16} />
                          </ToolTip>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedModuloId(
                              expandedModuloId === (m.idModulo ?? null) ? null : (m.idModulo ?? null)
                            )
                          }
                          className="rounded cursor-pointer text-gray-400 hover:text-gray-500"
                        >
                          {expandedModuloId === (m.idModulo ?? null) ? (
                            <ChevronDown size={20} />
                          ) : (
                            <ChevronUp size={20} />
                          )}
                        </button>
                      </div>

                      {/* Conteúdo do módulo com ABAS */}
                      {expandedModuloId === (m.idModulo ?? null) && (
                        <div className="p-4 space-y-4">
                          {/* Abas */}
                          <div className="border-b border-gray-200">
                            <nav className="-mb-px flex gap-4" aria-label="Abas módulo">
                              <button
                                type="button"
                                onClick={() => setAba(m.idModulo, "aulas")}
                                className={`px-3 py-2 text-sm border-b-2 ${abaAtiva === "aulas"
                                  ? "border-sky-600 text-sky-700"
                                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                  }`}
                              >
                                Aulas {(m.aulas?.length ?? 0) > 0 ? `(${m.aulas!.length})` : "(0)"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setAba(m.idModulo, "avaliacoes")}
                                className={`px-3 py-2 text-sm border-b-2 ${abaAtiva === "avaliacoes"
                                  ? "border-sky-600 text-sky-700"
                                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                  }`}
                              >
                                Avaliações do módulo ({(m.avaliacoes ?? []).length})
                              </button>
                            </nav>
                          </div>

                          {/* CONTEÚDO: AULAS */}
                          {abaAtiva === "aulas" && (
                            <section>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-700">
                                  Aulas {(m.aulas?.length ?? 0) > 0 ? `(${m.aulas!.length})` : "(0)"}
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => addAula(m.idModulo)}
                                  className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer flex items-center gap-1"
                                >
                                  <Plus size={14} /> Adicionar Aula
                                </button>
                              </div>

                              {(m.aulas ?? []).length ? (
                                // DnD Aulas (somente dentro deste módulo)
                                <DndContext
                                  sensors={sensors}
                                  collisionDetection={closestCenter}
                                  onDragEnd={handleAulaDragEnd(m.idModulo!)}
                                >
                                  <SortableContext
                                    items={(m.aulas ?? [])
                                      .slice()
                                      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
                                      .map((a) => String(a.idAula))}
                                    strategy={verticalListSortingStrategy}
                                  >
                                    <div className="rounded border border-gray-200 divide-y divide-gray-300">
                                      {(m.aulas ?? [])
                                        .slice()
                                        .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
                                        .map((a) => {
                                          const aulaKey = String(a.idAula);
                                          return (
                                            <SortableRowWrapper key={aulaKey} id={aulaKey}>
                                              <div className="bg-white">
                                                {/* Linha compacta */}
                                                <div className="flex flex-wrap items-center gap-3 p-3">
                                                  <div
                                                    className="cursor-grab text-gray-400"
                                                    title="Arraste para reordenar"
                                                  >
                                                    <GripVertical />
                                                  </div>

                                                  <div className="flex-1 min-w-56">
                                                    <Input
                                                      name="titulo"
                                                      value={a.titulo ?? ""}
                                                      onChange={(e) =>
                                                        updateAula(m.idModulo, a.idAula, { titulo: e.target.value })
                                                      }
                                                      required={false}
                                                      placeholder="Título da aula"
                                                    />
                                                  </div>

                                                  <ToolTip text={`${(a.ativo ?? 1) === 1 ? "Inativar" : "Ativar"}`}>
                                                    <CheckboxStatus
                                                      checked={(a.ativo ?? 1) !== 1}
                                                      onChange={() => toggleAtivoModulo(a.idAula, a.ativo)}
                                                    />
                                                  </ToolTip>

                                                  <button
                                                    type="button"
                                                    onClick={() => removeAula(m.idModulo, a.idAula)}
                                                    className="text-sm text-red-600 hover:text-red-700 rounded cursor-pointer pl-1"
                                                  >
                                                    <ToolTip text="Excluir">
                                                      <Trash2 size={16} />
                                                    </ToolTip>
                                                  </button>

                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      setExpandedAulaId(
                                                        expandedAulaId === (a.idAula ?? null)
                                                          ? null
                                                          : (a.idAula ?? null)
                                                      )
                                                    }
                                                    className="rounded cursor-pointer text-gray-400 hover:text-gray-500"
                                                  >
                                                    {expandedAulaId === (a.idAula ?? null) ? (
                                                      <ChevronDown size={20} />
                                                    ) : (
                                                      <ChevronUp size={20} />
                                                    )}
                                                  </button>
                                                </div>

                                                {/* Detalhes da aula */}
                                                {expandedAulaId === (a.idAula ?? null) && (
                                                  <div className="p-3 bg-gray-50 border-t border-gray-300">
                                                    <FormAulaDetalhes
                                                      modulo={m}
                                                      aula={a}
                                                      onChange={(patch) =>
                                                        updateAula(m.idModulo, a.idAula, patch)
                                                      }
                                                      setUploadsPendentes={setUploadsPendentes}
                                                    />
                                                  </div>
                                                )}
                                              </div>
                                            </SortableRowWrapper>
                                          );
                                        })}
                                    </div>
                                  </SortableContext>
                                  <DragOverlay />
                                </DndContext>
                              ) : (
                                <p className="text-sm text-gray-500 italic">Nenhuma aula adicionada.</p>
                              )}
                            </section>
                          )}

                          {/* CONTEÚDO: AVALIAÇÕES DO MÓDULO */}
                          {abaAtiva === "avaliacoes" && (
                            <section className="space-y-3">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-700">
                                  Avaliações do módulo ({(m.avaliacoes ?? []).length})
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => addAvaliacaoModulo(m.idModulo)}
                                  className="px-3 py-1.5 text-sm bg-violet-600 text-white rounded hover:bg-violet-700 cursor-pointer flex items-center gap-1"
                                >
                                  <Plus size={14} /> Adicionar Avaliação
                                </button>
                              </div>

                              {(m.avaliacoes ?? []).length ? (
                                <div className="space-y-3">
                                  {(m.avaliacoes ?? []).map((av) => (
                                    <FormAvaliacao
                                      key={av.idAvaliacao ?? Math.random()}
                                      avaliacao={av}
                                      onChange={(patch) =>
                                        updateModulo(m.idModulo, {
                                          avaliacoes: (m.avaliacoes ?? []).map((it) =>
                                            it.idAvaliacao === av.idAvaliacao ? { ...it, ...patch } : it
                                          ),
                                        })
                                      }
                                      onRemove={() =>
                                        updateModulo(m.idModulo, {
                                          avaliacoes: (m.avaliacoes ?? []).filter((it) => it.idAvaliacao !== av.idAvaliacao),
                                        })
                                      }
                                    />
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 italic">Nenhuma avaliação cadastrada.</p>
                              )}
                            </section>
                          )}
                        </div>
                      )}
                    </div>
                  </SortableRowWrapper>
                );
              })}
          </div>
        </SortableContext>
        <DragOverlay />
      </DndContext>
    </div>
  );
}