import { useEffect, useState } from "react";
import { UploadCloud, Trash2, Pencil } from "lucide-react";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import ToolTip from "../Auxiliares/ToolTip";
import { criarMaterial, editarMaterial, excluirMaterial } from "../../services/apiAula";
import type { MaterialComplementar } from "../../types/EstruturaCurso";
import { deleteMaterialArquivo, uploadMaterialArquivo } from "../../services/upload";

function acceptByTipo(tipo?: string) {
  switch ((tipo ?? "").toLowerCase()) {
    case "pdf":
      return ".pdf";
    case "doc":
      return ".doc,.docx";
    case "ppt":
      return ".ppt,.pptx";
    case "video":
      return "video/*";
    default:
      return "*/*";
  }
}

type SetMateriaisType = React.Dispatch<React.SetStateAction<MaterialComplementar[]>>;

interface MateriaisEditorProps {
  materiais: MaterialComplementar[];
  setMateriais: SetMateriaisType;
  aulaId: number;
  setUploadsPendentes: (tem: boolean) => void;
}

export function MateriaisEditor({
  materiais,
  setMateriais,
  aulaId,
  setUploadsPendentes,
}: MateriaisEditorProps) {
  const [progressMap, setProgressMap] = useState<Record<number, number>>({});
  const [uploadingMap, setUploadingMap] = useState<Record<number, boolean>>({});
  const [isEditingMaterial, setIsEditingMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    titulo: "",
    tipo: "link",
    material: "",
  });
  const [uploadingNovo, setUploadingNovo] = useState(false);
  const [progressNovo, setProgressNovo] = useState(0);

  useEffect(() => {
    const algumUpload =
      Object.values(uploadingMap).some((v) => v === true) || uploadingNovo;
    setUploadsPendentes(algumUpload);
  }, [uploadingMap, uploadingNovo, setUploadsPendentes]);

  const handleFile = async (
    m: MaterialComplementar,
    file: File,
    onUploaded?: (url: string) => void
  ) => {
    const id = m.idMaterialComplementar;
    if (!id) {
      console.warn("Material sem ID — upload abortado.");
      toast.error("Não é possível enviar arquivo sem ID do material.");
      return;
    }

    try {

      // Marca upload
      setUploadingMap((s) => ({ ...s, [id]: true }));
      setProgressMap((s) => ({ ...s, [id]: 0 }));

      // Exclui o arquivo anterior (se existir)
      if (m.material) {
        try {
          await deleteMaterialArquivo(m.material);
          toast.success("Arquivo antigo excluido com sucesso!");
        } catch (err) {
          toast.error("Erro ao excluir o arquivo antigo");
          console.warn("Falha ao remover arquivo antigo:", err);
        }
      }

      // Faz o upload com caminho único por material
      const { url } = await uploadMaterialArquivo(file, {
        pasta: "materiais",
        aulaId: `${aulaId ?? "aula"}/${id}`,
        onProgress: (p: number) => setProgressMap((s) => ({ ...s, [id]: p })),
      });

      // Atualiza no backend
      await editarMaterial(id, { material: url });

      // Atualiza lista geral
      setMateriais((prev) =>
        prev.map((x) =>
          x.idMaterialComplementar === id ? { ...x, material: url } : x
        )
      );

      // Atualiza estado local (modo edição)
      onUploaded?.(url);

      toast.success("Arquivo atualizado com sucesso!");
    } catch (err: any) {
      console.error("❌ Erro ao enviar arquivo:", err);
      toast.error(err?.message ?? "Falha no upload do material");
    } finally {
      setUploadingMap((s) => ({ ...s, [id]: false }));
      setProgressMap((s) => ({ ...s, [id]: 0 }));
    }
  };

  const handleUploadNovo = async (file: File) => {
    try {
      setUploadingNovo(true);
      setProgressNovo(0);

      const { url } = await uploadMaterialArquivo(file, {
        pasta: "materiais",
        aulaId: aulaId ?? "aula",
        onProgress: (p: number) => setProgressNovo(p),
      });

      setNewMaterial((prev) => ({ ...prev, material: url }));
      toast.success("Arquivo enviado com sucesso!");
    } catch (err: any) {
      toast.error(err?.message ?? "Falha no upload do arquivo");
    } finally {
      setUploadingNovo(false);
      setProgressNovo(0);
    }
  };

  const handleAddMaterial = async () => {
    if (!newMaterial.titulo.trim()) {
      toast.error("Informe o título do material");
      return;
    }
    if (!newMaterial.material.trim()) {
      toast.error("Informe ou envie o material");
      return;
    }
    try {
      const novo = await criarMaterial(aulaId, {
        ...newMaterial,
        ativo: 1,
      });
      setMateriais((prev) => [...prev, novo]);
      toast.success("Material adicionado!");
      setNewMaterial({ titulo: "", tipo: "LINK", material: "" });
      setIsEditingMaterial(false);
    } catch {
      toast.error("Erro ao criar material");
    }
  };

  const handleUpdateMaterial = async (
    id: number,
    patch: Partial<MaterialComplementar>
  ) => {
    try {
      const materialAtual = materiais.find(
        (x) => x.idMaterialComplementar === id
      );

      const mudouArquivo =
        patch.material &&
        materialAtual?.material &&
        patch.material !== materialAtual.material;

      if (mudouArquivo) {
        try {
          await deleteMaterialArquivo(materialAtual.material);
          toast.success("Arquivo antigo excluido com sucesso!");
        } catch (err) {
          toast.error("Erro ao excluir o arquivo antigo");
          console.warn("Falha ao excluir o arquivo antigo:", err);
        }
      }

      // 🔹 Atualiza no backend
      await editarMaterial(id, patch);

      // 🔹 Atualiza no estado local
      setMateriais((prev) =>
        prev.map((x) =>
          x.idMaterialComplementar === id ? { ...x, ...patch } : x
        )
      );

      toast.success("Material atualizado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar material");
    }
  };

  const handleRemoveMaterial = async (id: number) => {
    const confirmar = await Swal.fire({
      title: "Remover Material?",
      text: "O arquivo também será removido do servidor.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Sim, remover",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (!confirmar.isConfirmed) return;

    try {
      const materialAtual = materiais.find(
        (m) => m.idMaterialComplementar === id
      );

      if (materialAtual?.material) {
        try {
          await deleteMaterialArquivo(materialAtual.material);
          toast.success("Arquivo removido com sucesso!");
        } catch (err) {
          toast.error("Erro ao remover arquivo do Firebase");
          console.warn("Falha ao remover arquivo do Firebase:", err);
        }
      }

      await excluirMaterial(id);

      setMateriais((prev) =>
        prev.filter((m) => m.idMaterialComplementar !== id)
      );

      toast.success("Material removido com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir material");
    }
  };

  return (
    <div className="space-y-3">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h5 className="font-semibold text-gray-700">
          Materiais ({materiais.length})
        </h5>
        <button
          onClick={() => setIsEditingMaterial(true)}
          disabled={isEditingMaterial}
          className="px-3 py-1.5 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Adicionar Material
        </button>
      </div>

      {/* MINI FORMULÁRIO DE CRIAÇÃO */}
      {isEditingMaterial && (
        <div className="flex flex-col md:flex-row flex-wrap gap-2 items-center border border-gray-200 p-3 rounded-md bg-gray-50">
          <input
            type="text"
            placeholder="Título"
            value={newMaterial.titulo}
            onChange={(e) =>
              setNewMaterial((p) => ({ ...p, titulo: e.target.value }))
            }
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <select
            value={newMaterial.tipo}
            onChange={(e) =>
              setNewMaterial((p) => ({ ...p, tipo: e.target.value }))
            }
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="link">Link</option>
            <option value="pdf">PDF</option>
            <option value="doc">DOC</option>
            <option value="ppt">PPT</option>
            <option value="video">Vídeo</option>
            <option value="outro">Outro</option>
          </select>

          {/* Se for LINK → campo texto | caso contrário → upload */}
          {newMaterial.tipo === "link" ? (
            <input
              type="text"
              placeholder="URL do material"
              value={newMaterial.material}
              onChange={(e) =>
                setNewMaterial((p) => ({ ...p, material: e.target.value }))
              }
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
            />
          ) : (
            <div className="flex items-center gap-2">
              <label
                className={`inline-flex items-center gap-2 px-3 py-2 rounded border text-sm cursor-pointer ${uploadingNovo
                  ? "opacity-60 pointer-events-none"
                  : "hover:bg-gray-50"
                  }`}
              >
                <UploadCloud className="w-4 h-4" />
                <span>
                  {newMaterial.material
                    ? "Trocar arquivo"
                    : "Selecionar arquivo"}
                </span>
                <input
                  type="file"
                  accept={acceptByTipo(newMaterial.tipo)}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadNovo(file);
                  }}
                />
              </label>
              {newMaterial.material && (
                <a
                  href={newMaterial.material}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 hover:underline truncate max-w-[200px]"
                >
                  {newMaterial.material}
                </a>
              )}
            </div>
          )}

          {/* Barra de progresso no upload novo */}
          {uploadingNovo && (
            <div className="mt-2 h-2 w-full bg-gray-200 rounded">
              <div
                className="h-2 bg-blue-600 rounded"
                style={{ width: `${progressNovo}%` }}
              />
            </div>
          )}

          <button
            onClick={handleAddMaterial}
            disabled={uploadingNovo}
            className="px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer disabled:opacity-50"
          >
            Adicionar
          </button>
          <button
            onClick={() => {
              setIsEditingMaterial(false);
              setNewMaterial({ titulo: "", tipo: "LINK", material: "" });
            }}
            className="px-3 py-2 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400 cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* LISTA DE MATERIAIS */}
      {materiais.length ? (
        <div className="space-y-2">
          {materiais.map((m) => {
            const id = m.idMaterialComplementar!;
            const uploading = uploadingMap[id] === true;
            const progress = progressMap[id] ?? 0;
            const isLink = (m.tipo ?? "").toLowerCase() === "link";

            // 🔹 Estado de edição individual
            const [isEditing, setIsEditing] = useState(false);
            const [editData, setEditData] = useState({
              titulo: m.titulo ?? "",
              tipo: m.tipo ?? "link",
              material: m.material ?? "",
              ativo: m.ativo ?? 1,
            });

            // 🔹 Salvar alterações
            const handleSaveMaterial = async () => {
              try {
                await handleUpdateMaterial(id, editData);
                setIsEditing(false);
              } catch (err) {
                toast.error("Erro ao salvar alterações");
              }
            };

            // 🔹 Cancelar edição (volta pro estado original)
            const handleCancelEdit = () => {
              setIsEditing(false);
              setEditData({
                titulo: m.titulo ?? "",
                tipo: m.tipo ?? "link",
                material: m.material ?? "",
                ativo: m.ativo ?? 1,
              });
            };

            return (
              <div
                key={id}
                className={`grid gap-2 md:grid-cols-12 items-center rounded border  p-2 ${isEditing ? 'bg-white border-green-400' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`}
              >
                {/* TÍTULO */}
                <input
                  disabled={!isEditing}
                  className={`md:col-span-4 border rounded px-3 py-2 text-sm ${isEditing ? "border-gray-300" : "border-transparent bg-transparent text-gray-700 cursor-default"
                    }`}
                  value={editData.titulo}
                  onChange={(e) =>
                    setEditData((p) => ({ ...p, titulo: e.target.value }))
                  }
                />

                {/* TIPO */}
                <select
                  disabled={!isEditing}
                  className={`md:col-span-2 border rounded px-3 py-2 text-sm ${isEditing ? "border-gray-300" : "border-transparent bg-transparent text-gray-700 cursor-default"
                    }`}
                  value={editData.tipo}
                  onChange={(e) =>
                    setEditData((p) => ({ ...p, tipo: e.target.value }))
                  }
                >
                  <option value="pdf">PDF</option>
                  <option value="doc">DOC</option>
                  <option value="ppt">PPT</option>
                  <option value="link">Link</option>
                  <option value="video">Vídeo</option>
                  <option value="outro">Outros</option>
                </select>

                {/* MATERIAL */}
                <div className="md:col-span-4">
                  {isLink ? (
                    <input
                      disabled={!isEditing}
                      className={`w-full border rounded px-3 py-2 text-sm ${isEditing ? "border-gray-300" : "border-transparent bg-transparent text-gray-700 cursor-default"
                        }`}
                      placeholder="https://..."
                      value={editData.material}
                      onChange={(e) =>
                        setEditData((p) => ({ ...p, material: e.target.value }))
                      }
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <label
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded border text-sm cursor-pointer ${!isEditing
                          ? "opacity-50 pointer-events-none"
                          : uploading
                            ? "opacity-60 pointer-events-none"
                            : "hover:bg-gray-50"
                          }`}
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>
                          {editData.material ? "Trocar arquivo" : "Selecionar arquivo"}
                        </span>
                        <input
                          type="file"
                          accept={acceptByTipo(editData.tipo)}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file)
                              handleFile(
                                { ...m, material: editData.material } as MaterialComplementar,
                                file,
                                (url) => setEditData((p) => ({ ...p, material: url }))
                              );
                          }}
                        />
                      </label>
                      {editData.material && (
                        <a
                          href={editData.material}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline truncate max-w-[200px]"
                          title={editData.material}
                        >
                          {editData.material}
                        </a>
                      )}
                    </div>
                  )}
                  {uploading && (
                    <div className="mt-2 h-2 w-full bg-gray-200 rounded">
                      <div
                        className="h-2 bg-blue-600 rounded"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* AÇÕES */}
                <div className="md:col-span-2 flex items-center justify-end gap-2 px-2">
                  {!isEditing ? (
                    <>
                      <ToolTip text="Editar">
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="text-blue-500 rounded hover:text-blue-700 cursor-pointer"
                        >
                          <Pencil size={16} />
                        </button>
                      </ToolTip>
                      <ToolTip text="Excluir">
                        <button
                          type="button"
                          onClick={() => handleRemoveMaterial(id)}
                          className="text-sm text-red-500 rounded hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </ToolTip>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleSaveMaterial}
                        disabled={uploading}
                        className={`px-3 py-2 text-sm rounded text-white ${uploading
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-500 hover:bg-green-600"
                          }`}
                      >
                        Salvar
                      </button>

                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">
          Nenhum material adicionado.
        </p>
      )}
    </div>
  );
}