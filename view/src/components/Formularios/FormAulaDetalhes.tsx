// components/Formularios/FormAulaDetalhes.tsx
import { useEffect, useState } from "react";
import type { Modulo, Aula, AulaVideo, MaterialComplementar, Avaliacao, AulaStep } from "../../types/EstruturaCurso";
import { makeAvaliacao } from "../../types/FactoriesCurso";
import CheckboxStatus, { Input, SelectInput, TextArea } from "./Inputs";
import { GripVertical, Trash2, UploadCloud } from "lucide-react";
import ToolTip from "../Auxiliares/ToolTip";
import FormAvaliacao from "./FormAvaliacao";
import { uploadMaterialArquivo } from "../../services/upload";
import SortableItem from "../Auxiliares/SortableItem";
import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

interface Props {
  modulo: Modulo;
  aula: Aula;
  onChange: (patch: Partial<Aula>) => void;
  setUploadsPendentes: (tem: boolean) => void;
}

let tempId = -1;
const nextTempId = () => tempId--;

function MateriaisEditor({
  materiais,
  onUpdate,
  onAdd,
  onRemove,
  aulaId,
  setUploadsPendentes
}: {
  materiais: MaterialComplementar[];
  onUpdate: (id: number | undefined, patch: Partial<MaterialComplementar>) => void;
  onAdd: () => void;
  onRemove: (id: number | undefined) => void;
  aulaId?: number | null;
  setUploadsPendentes: (tem: boolean) => void;
}) {
  const [progressMap, setProgressMap] = useState<Record<number, number>>({});
  const [uploadingMap, setUploadingMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const algumUpload = Object.values(uploadingMap).some((v) => v === true);
    setUploadsPendentes(algumUpload);
  }, [uploadingMap]);

  const handleFile = async (m: MaterialComplementar, file: File) => {
    const id = m.idMaterialComplementar ?? -1;

    try {
      setUploadingMap((s) => ({ ...s, [id]: true }));
      setProgressMap((s) => ({ ...s, [id]: 0 }));

      const { url } = await uploadMaterialArquivo(file, {
        pasta: "materiais",
        aulaId: aulaId ?? m.fkAulaId ?? "aula",
        onProgress: (p) =>
          setProgressMap((s) => ({ ...s, [id]: p })),
      });

      // grava a URL pública no campo material
      onUpdate(m.idMaterialComplementar, { material: url });

    } catch (err: any) {
      alert(err?.message ?? "Falha no upload do material");
    } finally {
      setUploadingMap((s) => ({ ...s, [id]: false }));
      setProgressMap((s) => ({ ...s, [id]: 0 }));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h5 className="font-semibold text-gray-700">Materiais ({materiais.length})</h5>
        <button
          type="button"
          onClick={onAdd}
          className="px-3 py-1.5 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 cursor-pointer"
        >
          + Adicionar Material
        </button>
      </div>

      {materiais.length ? (
        <div className="space-y-2">
          {materiais.map((m) => {
            const id = m.idMaterialComplementar ?? -1;
            const uploading = uploadingMap[id] === true;
            const progress = progressMap[id] ?? 0;
            const isLink = (m.tipo ?? "").toLowerCase() === "link";

            return (
              <div key={id} className="grid gap-2 md:grid-cols-12 items-center">
                {/* Título */}
                <input
                  className="md:col-span-4 border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="Título"
                  value={m.titulo ?? ""}
                  onChange={(e) => onUpdate(m.idMaterialComplementar, { titulo: e.target.value })}
                />

                {/* Tipo */}
                <select
                  className="md:col-span-2 border border-gray-300 rounded px-3 py-2 text-sm"
                  value={(m.tipo ?? "").toLowerCase()}
                  onChange={(e) => onUpdate(m.idMaterialComplementar, { tipo: e.target.value as any })}
                >
                  <option value="pdf">PDF</option>
                  <option value="doc">DOC</option>
                  <option value="ppt">PPT</option>
                  <option value="link">Link</option>
                  <option value="video">Video</option>
                  <option value="outro">Outros</option>
                </select>

                {/* Campo de material: URL para 'link'; upload de arquivo para demais */}
                <div className="md:col-span-5">
                  {isLink ? (
                    <input
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      placeholder="https://..."
                      value={m.material ?? ""}
                      onChange={(e) => onUpdate(m.idMaterialComplementar, { material: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <label className={`inline-flex items-center gap-2 px-3 py-2 rounded border text-sm cursor-pointer ${uploading ? "opacity-60 pointer-events-none" : "hover:bg-gray-50"}`}>
                        <UploadCloud className="w-4 h-4" />
                        <span>{m.material ? "Trocar arquivo" : "Selecionar arquivo"}</span>
                        <input
                          type="file"
                          accept={acceptByTipo(m.tipo)}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFile(m, file);
                          }}
                        />
                      </label>

                      {/* Preview/link atual (se já tem) */}
                      {m.material && (
                        <a
                          href={m.material}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline truncate max-w-[240px]"
                          title={m.material}
                        >
                          {m.material}
                        </a>
                      )}
                    </div>
                  )}

                  {/* barra de progresso */}
                  {uploading && (
                    <div className="mt-2 h-2 w-full bg-gray-200 rounded">
                      <div className="h-2 bg-blue-600 rounded" style={{ width: `${progress}%` }} />
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="md:col-span-1 flex items-center justify-center gap-2">
                  <ToolTip text={(m.ativo ?? 1) === 1 ? "Inativar" : "Ativar"}>
                    <CheckboxStatus
                      checked={(m.ativo ?? 1) !== 1}
                      onChange={(checked) => onUpdate(m.idMaterialComplementar, { ativo: checked ? 0 : 1 })}
                    />
                  </ToolTip>
                  <ToolTip text="Excluir">
                    <button
                      type="button"
                      onClick={() => onRemove(m.idMaterialComplementar)}
                      className="px-2 py-1 text-sm text-red-500 rounded hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </ToolTip>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">Nenhum material adicionado.</p>
      )}
    </div>
  );
}

function acceptByTipo(tipo?: string) {
  const t = (tipo ?? "").toLowerCase();
  if (t === "pdf") return "application/pdf";
  if (t === "doc") return ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (t === "ppt") return ".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation";
  if (t === "video") return "video/*";
  return "*/*";
}

export default function FormAulaDetalhes({ aula, onChange, setUploadsPendentes }: Props) {
  const [tab, setTab] = useState<"dados" | "videos" | "materiais" | "avaliacoes" | "fluxo">("dados");

  // Normalizações para evitar possibly undefined
  const videos = aula.videos ?? [];
  const materiais = aula.materiais ?? [];
  const avaliacoesAula = aula.avaliacoes ?? [];

  // --- Vídeos ---
  const updateVideo = (idAulaVideo: number | undefined, patch: Partial<AulaVideo>) => {
    if (idAulaVideo == null) return;
    onChange({
      videos: videos.map((v) => (v.idAulaVideo === idAulaVideo ? { ...v, ...patch } : v)),
    });
  };

  const addVideo = () => {
    onChange({
      videos: [
        ...videos,
        {
          idAulaVideo: nextTempId(),
          url: "",
        } as AulaVideo,
      ],
    });
  };

  const removeVideo = (idAulaVideo: number | undefined) => {
    if (idAulaVideo == null) return;

    Swal.fire({
      title: "Remover Vídeo?",
      text: "Este vídeo será excluído da aula.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Sim, remover",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        onChange({
          videos: videos.filter((v) => v.idAulaVideo !== idAulaVideo),
        });
        toast.success("Vídeo removido com sucesso!");
      }
    });
  };

  // --- Materiais ---
  const updateMaterial = (id: number | undefined, patch: Partial<MaterialComplementar>) => {
    if (id == null) return;
    onChange({
      materiais: materiais.map((m) => (m.idMaterialComplementar === id ? { ...m, ...patch } : m)),
    });
  };

  const addMaterial = () => {
    onChange({
      materiais: [
        ...materiais,
        {
          idMaterialComplementar: nextTempId(),
          titulo: "Novo material",
          tipo: "LINK",
          material: "",
          ativo: 1,
        },
      ],
    });
  };

  const removeMaterial = (id: number | undefined) => {
    if (id == null) return;

    Swal.fire({
      title: "Remover Material?",
      text: "Este material será excluído da aula.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Sim, remover",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        onChange({
          materiais: materiais.filter((m) => m.idMaterialComplementar !== id),
        });
        toast.success("Material removido com sucesso!");
      }
    });
  };

  // --- Avaliações (NÍVEL AULA) ---
  const addAvaliacaoAula = () => {
    const ordem = avaliacoesAula.length + 1;
    const nova = makeAvaliacao(ordem);
    nova.idAvaliacao = nextTempId();
    nova.fkAulaId = aula.idAula;
    onChange({ avaliacoes: [...avaliacoesAula, nova] });
  };

  const updateAvaliacaoAula = (idAvaliacao: number | undefined, patch: Partial<Avaliacao>) => {
    if (idAvaliacao == null) return;
    onChange({
      avaliacoes: avaliacoesAula.map((av) => (av.idAvaliacao === idAvaliacao ? { ...av, ...patch } : av)),
    });
  };

  const removeAvaliacaoAula = (idAvaliacao: number | undefined) => {
    if (idAvaliacao == null) return;

    Swal.fire({
      title: "Remover Avaliação?",
      text: "Essa avaliação será excluída da aula.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Sim, remover",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        onChange({
          avaliacoes: avaliacoesAula.filter((av) => av.idAvaliacao !== idAvaliacao),
        });
        toast.success("Avaliação removida com sucesso!");
      }
    });
  };

  return (
    <div className="space-y-3">
      {/* Abas internas */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: "dados", label: "Dados" },
          { id: "videos", label: "Vídeos" },
          { id: "materiais", label: "Materiais" },
          { id: "avaliacoes", label: "Avaliações" },
          { id: "fluxo", label: "Fluxo" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as any)}
            className={`px-3 py-2 text-sm rounded-t-md border cursor-pointer ${tab === t.id
              ? "bg-white border-gray-200 border-b-white font-medium"
              : "bg-gray-50 border-transparent hover:bg-gray-100"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      <div className="rounded-md border border-t-0 border-gray-200 bg-white p-3">
        {tab === "dados" && (
          <div className="grid gap-3 md:grid-cols-2">
            {/* Descrição */}
            <div className="col-span-2">
              <TextArea
                label="Descrição"
                name="descricao"
                value={aula.descricao ?? ""}
                onChange={(e) => onChange({ descricao: e.target.value })}
                required={false}
                rows={3}
                placeholder="Descrição da aula"
              />
            </div>

            {/* Tipo (enum/seleção) */}
            <SelectInput
              label="Tipo"
              name="tipo"
              value={aula.tipo ?? ""}
              onChange={(e) => onChange({ tipo: e.target.value })}
              required={true}
              options={[
                { value: "video", label: "Vídeo" },
              ]}
            />

            {/* Duração (número em minutos) */}
            <div>
              <Input
                label="Duração (min)"
                name="duracao"
                type="number"
                value={Number.isFinite(aula.duracao) ? String(aula.duracao) : ""}
                onChange={(e) => onChange({ duracao: Number(e.target.value) || 0 })}
                required={true}
              />
            </div>
          </div>
        )}

        {tab === "videos" && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h5 className="font-semibold text-gray-700">Vídeos ({videos.length})</h5>
              <button
                type="button"
                onClick={addVideo}
                className="px-3 py-1.5 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 cursor-pointer"
              >
                + Adicionar Vídeo
              </button>
            </div>

            {videos.length ? (
              <div className="space-y-2">
                {videos.map((v) => (
                  <div key={v.idAulaVideo ?? Math.random()} className="flex gap-2 items-center">
                    <input
                      className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                      placeholder="URL do vídeo"
                      value={v.url}
                      onChange={(e) => updateVideo(v.idAulaVideo, { url: e.target.value })}
                    />
                    <ToolTip text="Excluir">
                      <button
                        type="button"
                        onClick={() => removeVideo(v.idAulaVideo)}
                        className="px-2 py-2 text-sm text-red-500 rounded hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </ToolTip>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Nenhum vídeo adicionado.</p>
            )}
          </div>
        )}

        {tab === "materiais" && (
          <MateriaisEditor
            materiais={materiais}
            onUpdate={(id, patch) => updateMaterial(id, patch)}
            onAdd={addMaterial}
            onRemove={removeMaterial}
            aulaId={aula.idAula}
            setUploadsPendentes={setUploadsPendentes}
          />
        )}

        {tab === "avaliacoes" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="font-semibold text-gray-700">Avaliações da aula ({avaliacoesAula.length})</h5>
              <button
                type="button"
                onClick={addAvaliacaoAula}
                className="px-3 py-1.5 text-sm bg-violet-600 text-white rounded hover:bg-violet-700 cursor-pointer"
              >
                + Avaliação
              </button>
            </div>

            {avaliacoesAula.length ? (
              <div className="space-y-3">
                {avaliacoesAula.map((av) => (
                  <FormAvaliacao
                    key={av.idAvaliacao ?? Math.random()}
                    avaliacao={av}
                    onChange={(patch) =>
                      updateAvaliacaoAula(av.idAvaliacao, patch)
                    }
                    onRemove={() => removeAvaliacaoAula(av.idAvaliacao)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Nenhuma avaliação da aula.</p>
            )}
          </div>
        )}

        {tab === "fluxo" && (
          <FluxoEditor
            steps={aula.steps ?? []}
            videos={videos}
            materiais={materiais}
            avaliacoes={avaliacoesAula}
            setSteps={(steps) => onChange({ steps: steps })}
          />
        )}

      </div>
    </div>
  );
}

interface FluxoEditorProps {
  steps: AulaStep[];
  setSteps: (steps: AulaStep[]) => void;
  videos: AulaVideo[];
  materiais: MaterialComplementar[];
  avaliacoes: Avaliacao[];
}

function FluxoEditor({ steps, setSteps, videos, materiais, avaliacoes }: FluxoEditorProps) {
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = steps.findIndex((s) => `step-${s.idAulaStep}` === active.id);
    const newIndex = steps.findIndex((s) => `step-${s.idAulaStep}` === over.id);

    const reordered: AulaStep[] = arrayMove(steps, oldIndex, newIndex).map((step, i): AulaStep => ({
      ...step,
      ordem: i + 1,
    }));

    setSteps(reordered);
  }

  const adicionarStep = (tipo: AulaStep["tipo"] = "video") => {
    const jaExisteStepSemItem = steps.some((s) => {
      if (s.tipo !== tipo) return false;
      if (tipo === "video" && !s.fkAulaVideoId) return true;
      if (tipo === "material" && !s.fkMaterialId) return true;
      if (tipo === "avaliacao" && !s.fkAvaliacaoId) return true;
      return false;
    });

    if (jaExisteStepSemItem) {
      toast.error(`Já existe uma etapa de ${tipo} sem item selecionado.`);
      return;
    }

    const novoStep: AulaStep = {
      idAulaStep: nextTempId(),
      tipo,
      ordem: steps.length + 1,
      obrigatorio: 1,
    };

    setSteps([...steps, novoStep]);
  };

  const removerStep = (id: number | string) => {
    if (id === undefined || id === null) return toast.error("Erro ao excluir item do fluxo!");

    Swal.fire({
      title: "Tem certeza?",
      text: "Esta etapa será removida da aula.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Sim, remover",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        try {
          const atualizados = steps
            .filter((s) => s.idAulaStep !== id)
            .map((s, index) => ({
              ...s,
              ordem: index + 1,
            }));

          setSteps(atualizados);
          toast.success("Etapa removida com sucesso!");
        } catch (error) {
          console.error(error);
          toast.error("Erro ao remover etapa.");
        }
      }
    });
  }

  return (
    <div className="space-y-4">
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={steps.map((step) => `step-${step.idAulaStep}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => adicionarStep("video")}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-2 rounded cursor-pointer"
            >
              + Adicionar Etapa
            </button>
          </div>
          {steps.map((step, i) => (
            <SortableItem key={`step-${step.idAulaStep}`} id={`step-${step.idAulaStep}`}>
              {({ attributes, listeners }) => (
                <div className="bg-white border border-gray-300 rounded-md p-4 mb-4">
                  <div className="flex items-center gap-2">
                    {/* handle de drag */}
                    <div
                      {...attributes}
                      {...listeners}
                      className="cursor-grab text-gray-400"
                      title="Arraste para reordenar"
                    >
                      <GripVertical />
                    </div>

                    {/* selects e botões */}
                    <SelectInput
                      name={`tipo-${i}`}
                      value={step.tipo}
                      onChange={(e) => {
                        const tipo = e.target.value as AulaStep["tipo"];
                        const updated = steps.map((s, idx) =>
                          idx === i
                            ? { ...s, tipo, fkAulaVideoId: null, fkMaterialId: null, fkAvaliacaoId: null }
                            : s
                        );
                        setSteps(updated);
                      }}
                      options={[
                        { label: "Vídeo", value: "video" },
                        { label: "Material", value: "material" },
                        { label: "Avaliação", value: "avaliacao" },
                      ]}
                    />

                    {step.tipo === "video" && (
                      <SelectInput
                        name={`video-${i}`}
                        value={step.fkAulaVideoId?.toString() ?? ""}
                        onChange={(e) => {
                          const updated = steps.map((s, idx) =>
                            idx === i ? { ...s, fkAulaVideoId: Number(e.target.value) } : s
                          );
                          setSteps(updated);
                        }}
                        options={videos.map((v) => ({
                          value: v.idAulaVideo!.toString(),
                          label: v.url,
                        }))}
                      />
                    )}

                    {step.tipo === "material" && (
                      <SelectInput
                        name={`material-${i}`}
                        value={step.fkMaterialId?.toString() ?? ""}
                        onChange={(e) => {
                          const updated = steps.map((s, idx) =>
                            idx === i ? { ...s, fkMaterialId: Number(e.target.value) } : s
                          );
                          setSteps(updated);
                        }}
                        options={materiais.map((m) => ({
                          value: m.idMaterialComplementar!.toString(),
                          label: m.titulo ?? m.material,
                        }))}
                      />
                    )}

                    {step.tipo === "avaliacao" && (
                      <SelectInput
                        name={`avaliacao-${i}`}
                        value={step.fkAvaliacaoId?.toString() ?? ""}
                        onChange={(e) => {
                          const updated = steps.map((s, idx) =>
                            idx === i ? { ...s, fkAvaliacaoId: Number(e.target.value) } : s
                          );
                          setSteps(updated);
                        }}
                        options={avaliacoes.map((a) => ({
                          value: a.idAvaliacao!.toString(),
                          label: a.titulo ?? `Avaliação ${a.idAvaliacao}`,
                        }))}
                      />
                    )}

                    {/* botão de excluir (fora da área de drag) */}
                    <button
                      className="text-red-500 hover:text-red-600 cursor-pointer"
                      type="button"
                      onClick={() => removerStep(step.idAulaStep!)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </SortableItem>
          ))}

        </SortableContext>
      </DndContext>
    </div>
  );
}
