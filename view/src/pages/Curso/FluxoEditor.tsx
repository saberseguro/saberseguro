import { DndContext, closestCenter } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { GripVertical, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import toast from "react-hot-toast";

import {
  criarStep,
  editarStep,
  excluirStep,
  reordenarSteps,
} from "../../services/apiAula";

import type {
  AulaStep,
  AulaVideo,
  MaterialComplementar,
  Avaliacao,
} from "../../types/EstruturaCurso";
import SortableItem from "../../components/Auxiliares/SortableItem";
import { SelectInput } from "../../components/Formularios/Inputs";
import { nextTempId } from "../../auxiliares/nextTempoId";

interface FluxoEditorProps {
  idAula: number;
  steps: AulaStep[];
  setSteps: React.Dispatch<React.SetStateAction<AulaStep[]>>;
  videos: AulaVideo[];
  materiais: MaterialComplementar[];
  avaliacoes: Avaliacao[];
  color?: string;
}

export function FluxoEditor({
  idAula,
  steps,
  setSteps,
  videos,
  materiais,
  avaliacoes,
  color,
}: FluxoEditorProps) {
  const isTemp = (id: any) => typeof id === "string" && id.startsWith("TMP-");

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = steps.findIndex((s) => `step-${s.idAulaStep}` === active.id);
    const newIndex = steps.findIndex((s) => `step-${s.idAulaStep}` === over.id);

    const reordered = steps.map((s) => ({ ...s }));
    reordered.splice(newIndex, 0, reordered.splice(oldIndex, 1)[0]);

    const normalized = reordered.map((s, i) => ({
      ...s,
      ordem: i + 1,
    }));

    setSteps(normalized);

    await reordenarSteps(
      idAula,
      normalized
        .filter((s) => !isTemp(s.idAulaStep))
        .map((s) => ({
          idAulaStep: Number(s.idAulaStep),
          ordem: s.ordem,
        }))
    );
  }

  const adicionarStep = async (tipo: AulaStep["tipo"] = "video") => {
    const tempId = nextTempId();

    // adicionar local primeiro
    setSteps(prev => [
      ...prev,
      {
        idAulaStep: tempId,
        tipo,
        obrigatorio: 1,
        ordem: prev.length + 1,
      },
    ]);

    // salvar no backend
    const criado = await criarStep(idAula, {
      tipo,
      obrigatorio: 1,
      fkAulaVideoId: null,
      fkMaterialId: null,
      fkAvaliacaoId: null,
    });

    // substituir o TMP pelo real usando prevSteps
    setSteps(prev =>
      prev.map(s => (s.idAulaStep === tempId ? criado : s))
    );
  };


  const atualizarStepBackend = async (step: AulaStep) => {
    if (isTemp(step.idAulaStep)) return;
    await editarStep(Number(step.idAulaStep), {
      tipo: step.tipo,
      ordem: step.ordem,
      obrigatorio: step.obrigatorio,
      fkAulaVideoId: step.fkAulaVideoId || null,
      fkMaterialId: step.fkMaterialId || null,
      fkAvaliacaoId: step.fkAvaliacaoId || null,
    });
  };

  const removerStep = (id: number | string) => {
    Swal.fire({
      title: "Tem certeza?",
      text: "Esta etapa será removida da aula.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      const atualizados = steps
        .filter((s) => s.idAulaStep !== id)
        .map((s, i) => ({ ...s, ordem: i + 1 }));

      setSteps(atualizados);

      if (!isTemp(id)) {
        await excluirStep(Number(id));
      }

      await reordenarSteps(
        idAula,
        atualizados
          .filter((s) => !isTemp(s.idAulaStep))
          .map((s) => ({
            idAulaStep: Number(s.idAulaStep),
            ordem: s.ordem,
          }))
      );

      toast.success("Etapa removida!");
    });
  };

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
              className={`${color ?? "bg-blue-500 hover:bg-blue-600"} text-white text-sm px-3 py-2 rounded cursor-pointer`}
            >
              + Adicionar Etapa
            </button>
          </div>

          {steps.map((step, i) => (
            <SortableItem key={`step-${step.idAulaStep}`} id={`step-${step.idAulaStep}`}>
              {({ attributes, listeners }) => (
                <div className="bg-gray-100 border border-gray-300 rounded-md p-4 mb-4">
                  <div className="flex items-center gap-2">

                    {/* Drag handle */}
                    <div
                      {...attributes}
                      {...listeners}
                      className="cursor-grab text-gray-400"
                      title="Arraste para reordenar"
                    >
                      <GripVertical />
                    </div>

                    {/* Tipo */}
                    <SelectInput
                      name={`tipo-${i}`}
                      value={step.tipo}
                      onChange={async (e) => {
                        const tipo = e.target.value as AulaStep["tipo"];

                        const updated = steps.map((s, idx) =>
                          idx === i
                            ? {
                              ...s,
                              tipo,
                              fkAulaVideoId: null,
                              fkMaterialId: null,
                              fkAvaliacaoId: null,
                            }
                            : s
                        );

                        setSteps(updated);
                        await atualizarStepBackend(updated[i]);
                      }}
                      options={[
                        { label: "Vídeo", value: "video" },
                        { label: "Material", value: "material" },
                        { label: "Avaliação", value: "avaliacao" },
                      ]}
                    />

                    {/* Vídeo */}
                    {step.tipo === "video" && (
                      <SelectInput
                        name={`video-${i}`}
                        value={step.fkAulaVideoId?.toString() ?? ""}
                        onChange={async (e) => {
                          const updated = steps.map((s, idx) =>
                            idx === i
                              ? { ...s, fkAulaVideoId: Number(e.target.value) }
                              : s
                          );

                          setSteps(updated);
                          await atualizarStepBackend(updated[i]);
                        }}
                        options={videos.map((v) => ({
                          value: v.idAulaVideo!.toString(),
                          label: v.url,
                        }))}
                      />
                    )}

                    {/* Material */}
                    {step.tipo === "material" && (
                      <SelectInput
                        name={`material-${i}`}
                        value={step.fkMaterialId?.toString() ?? ""}
                        onChange={async (e) => {
                          const updated = steps.map((s, idx) =>
                            idx === i
                              ? { ...s, fkMaterialId: Number(e.target.value) }
                              : s
                          );

                          setSteps(updated);
                          await atualizarStepBackend(updated[i]);
                        }}
                        options={materiais.map((m) => ({
                          value: m.idMaterialComplementar!.toString(),
                          label: m.titulo ?? m.material,
                        }))}
                      />
                    )}

                    {/* Avaliação */}
                    {step.tipo === "avaliacao" && (
                      <SelectInput
                        name={`avaliacao-${i}`}
                        value={step.fkAvaliacaoId?.toString() ?? ""}
                        onChange={async (e) => {
                          const updated = steps.map((s, idx) =>
                            idx === i
                              ? { ...s, fkAvaliacaoId: Number(e.target.value) }
                              : s
                          );

                          setSteps(updated);
                          await atualizarStepBackend(updated[i]);
                        }}
                        options={avaliacoes.map((a) => ({
                          value: a.idAvaliacao!.toString(),
                          label: a.titulo ?? `Avaliação ${a.idAvaliacao}`,
                        }))}
                      />
                    )}

                    {/* Excluir */}
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-600 cursor-pointer"
                      onClick={() => removerStep(step.idAulaStep)}
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
