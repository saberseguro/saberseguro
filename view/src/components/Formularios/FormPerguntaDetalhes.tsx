import { useState } from "react";
import type { Pergunta, Alternativa } from "../../types/EstruturaCurso";
import { makePergunta, makeAlternativa } from "../../types/FactoriesCurso";
import { SelectInput, TextArea, Input } from "./Inputs";
import CheckboxStatus from "./Inputs";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import ToolTip from "../Auxiliares/ToolTip";
import Swal from "sweetalert2";
import toast from "react-hot-toast";

interface Props {
  perguntas: Pergunta[];
  onChange: (perguntas: Pergunta[]) => void;
}

export default function FormPerguntasDetalhes({ perguntas, onChange }: Props) {
  const list = perguntas ?? [];
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);

  const toggleOpen = (idx: number) => {
    setOpenIndexes((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const addPergunta = () => {
    onChange([...(list), makePergunta()]);
    // opcional: abre a última pergunta adicionada
    setOpenIndexes((prev) => [...prev, list.length]);
  };

  const updatePerguntaByIdx = (idx: number, patch: Partial<Pergunta>) => {
    onChange(list.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  };

  const removePerguntaByIdx = (idx: number) => {
    Swal.fire({
      title: "Remover Pergunta?",
      text: "Esta pergunta e suas alternativas serão removidas.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Sim, remover",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        const newList = list.filter((_, i) => i !== idx);
        onChange(newList);
        setOpenIndexes((prev) =>
          prev
            .filter((i) => i !== idx)
            .map((i) => (i > idx ? i - 1 : i))
        );
        toast.success("Pergunta removida com sucesso!");
      }
    });
  };

  const addAlternativaByIdx = (idxPerg: number) => {
    onChange(
      list.map((p, i) =>
        i === idxPerg
          ? { ...p, alternativas: [...(p.alternativas ?? []), makeAlternativa()] }
          : p
      )
    );
  };

  const updateAlternativaByIndex = (
    idxPerg: number,
    idxAlt: number,
    patch: Partial<Alternativa>
  ) => {
    onChange(
      list.map((p, i) =>
        i === idxPerg
          ? {
            ...p,
            alternativas: (p.alternativas ?? []).map((a, j) =>
              j === idxAlt ? { ...a, ...patch } : a
            ),
          }
          : p
      )
    );
  };

  const removeAlternativaByIndex = (idxPerg: number, idxAlt: number) => {
    Swal.fire({
      title: "Remover Alternativa?",
      text: "Esta alternativa será removida da pergunta.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Sim, remover",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        onChange(
          list.map((p, i) =>
            i === idxPerg
              ? {
                ...p,
                alternativas: (p.alternativas ?? []).filter((_, j) => j !== idxAlt),
              }
              : p
          )
        );
        toast.success("Alternativa removida com sucesso!");
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h5 className="font-semibold text-gray-700">Perguntas ({list.length})</h5>
        <button
          type="button"
          onClick={addPergunta}
          className="px-3 py-1.5 text-sm bg-violet-600 text-white rounded hover:bg-violet-700 cursor-pointer flex items-center gap-1"
        >
          <Plus size={14} /> Pergunta
        </button>
      </div>

      {list.length ? (
        list.map((p, idxPerg) => {
          const isOpen = openIndexes.includes(idxPerg);
          const alternativas = p.alternativas ?? [];

          return (
            <div
              key={p.idPergunta ?? `temp-${idxPerg}`}
              className="border border-gray-300 rounded bg-gray-50"
            >
              {/* Cabeçalho colapsável */}
              <div
                className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100"
                onClick={() => toggleOpen(idxPerg)}
              >
                <div className="flex items-center gap-2">
                  {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span className="font-medium text-gray-700 w-full">
                    {p.enunciado?.trim()
                      ? p.enunciado.slice(0, 150)
                      : "Nova Pergunta"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">
                    {p.tipo === "dissertativa"
                      ? "Dissertativa"
                      : "Múltipla escolha"}
                  </span>

                  <ToolTip text="Remover pergunta">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // evita toggle
                        removePerguntaByIdx(idxPerg);
                      }}
                      className="text-red-600 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </ToolTip>
                </div>
              </div>

              {/* Conteúdo interno */}
              {isOpen && (
                <div className="p-3 space-y-3">
                  <div className="grid gap-2 md:grid-cols-6">
                    <div className="md:col-span-5">
                      <TextArea
                        label="Enunciado"
                        name={`enunciado-${idxPerg}`}
                        value={p.enunciado ?? ""}
                        onChange={(e) =>
                          updatePerguntaByIdx(idxPerg, { enunciado: e.target.value })
                        }
                        rows={4}
                        required
                      />
                    </div>

                    <div className="md:col-span-1">
                      <SelectInput
                        label="Tipo"
                        name={`tipo-${idxPerg}`}
                        value={p.tipo ?? "multipla"}
                        onChange={(e) =>
                          updatePerguntaByIdx(idxPerg, { tipo: e.target.value })
                        }
                        options={[
                          { value: "multipla", label: "Múltipla Escolha" },
                          { value: "dissertativa", label: "Dissertativa" },
                        ]}
                        required
                      />
                    </div>
                  </div>

                  {/* Alternativas apenas para múltipla */}
                  {(p.tipo ?? "multipla") === "multipla" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h6 className="font-medium">
                          Alternativas ({alternativas.length})
                        </h6>
                        <button
                          type="button"
                          onClick={() => addAlternativaByIdx(idxPerg)}
                          className="px-3 py-1.5 text-xs bg-amber-500 text-white rounded hover:bg-amber-600 cursor-pointer flex items-center gap-1"
                        >
                          <Plus size={12} /> Alternativa
                        </button>
                      </div>

                      {alternativas.length ? (
                        alternativas.map((a, idxAlt) => (
                          <div
                            key={a.idAlternativa ?? `alt-${idxPerg}-${idxAlt}`}
                            className="grid gap-2 md:grid-cols-12 items-center"
                          >
                            <div className="md:col-span-9">
                              <Input
                                label="Texto da alternativa"
                                name={`alt-texto-${idxPerg}-${idxAlt}`}
                                value={a.texto ?? ""}
                                onChange={(e) =>
                                  updateAlternativaByIndex(idxPerg, idxAlt, {
                                    texto: e.target.value,
                                  })
                                }
                                required
                                placeholder="Digite a alternativa"
                              />
                            </div>

                            <label className="md:col-span-2 inline-flex items-center gap-2 text-sm mt-6">
                              <CheckboxStatus
                                checked={(a.correta ?? 0) === 1}
                                onChange={(checked) =>
                                  updateAlternativaByIndex(idxPerg, idxAlt, {
                                    correta: checked ? 1 : 0,
                                  })
                                }
                              />
                              Correta
                            </label>

                            <div className="md:col-span-1 flex items-end justify-end mt-6">
                              <ToolTip text="Excluir alternativa">
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeAlternativaByIndex(idxPerg, idxAlt)
                                  }
                                  className="text-red-600 hover:text-red-700 cursor-pointer"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </ToolTip>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          Nenhuma alternativa.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      ) : (
        <p className="text-sm text-gray-500 italic">Nenhuma pergunta cadastrada.</p>
      )}
    </div>
  );
}