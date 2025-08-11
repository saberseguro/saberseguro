// components/Formularios/FormAulaDetalhes.tsx
import { useState } from "react";
import type { Modulo, Aula, AulaVideo, MaterialComplementar, Avaliacao } from "../../types/EstruturaCurso";
import { makeAvaliacao } from "../../types/FactoriesCurso";
import CheckboxStatus, { Input, SelectInput, TextArea } from "./Inputs";
import { Trash2 } from "lucide-react";
import ToolTip from "../Auxiliares/ToolTip";

interface Props {
  modulo: Modulo; // pode ser útil se você quiser exibir também avaliações do módulo
  aula: Aula;
  onChange: (patch: Partial<Aula>) => void;
}

let tempId = -1;
const nextTempId = () => tempId--;

export default function FormAulaDetalhes({ modulo, aula, onChange }: Props) {
  const [tab, setTab] = useState<"dados" | "videos" | "materiais" | "avaliacoes">("dados");

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
          // opcional: ordem: (videos.length + 1)
        } as AulaVideo,
      ],
    });
  };

  const removeVideo = (idAulaVideo: number | undefined) => {
    if (idAulaVideo == null) return;
    onChange({
      videos: videos.filter((v) => v.idAulaVideo !== idAulaVideo),
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
    onChange({
      materiais: materiais.filter((m) => m.idMaterialComplementar !== id),
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
    onChange({
      avaliacoes: avaliacoesAula.filter((av) => av.idAvaliacao !== idAvaliacao),
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
                { value: "pdf", label: "PDF" },
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
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h5 className="font-semibold text-gray-700">Materiais ({materiais.length})</h5>
              <button
                type="button"
                onClick={addMaterial}
                className="px-3 py-1.5 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 cursor-pointer"
              >
                + Adicionar Material
              </button>
            </div>

            {materiais.length ? (
              <div className="space-y-2">
                {materiais.map((m) => (
                  <div key={m.idMaterialComplementar ?? Math.random()} className="grid gap-2 md:grid-cols-12 items-center">
                    <input
                      className="md:col-span-4 border border-gray-300 rounded px-3 py-2 text-sm"
                      placeholder="Título"
                      value={m.titulo}
                      onChange={(e) => updateMaterial(m.idMaterialComplementar, { titulo: e.target.value })}
                    />
                    <select
                      className="md:col-span-2 border border-gray-300 rounded px-3 py-2 text-sm"
                      value={m.tipo}
                      onChange={(e) => updateMaterial(m.idMaterialComplementar, { tipo: e.target.value as any })}
                    >
                      <option value="pdf">PDF</option>
                      <option value="doc">DOC</option>
                      <option value="ppt">PPT</option>
                      <option value="link">Link</option>
                      <option value="video">Video</option>
                      <option value="outro">Outros</option>
                    </select>
                    <input
                      className="md:col-span-5 border border-gray-300 rounded px-3 py-2 text-sm"
                      placeholder="URL/Arquivo"
                      value={m.material}
                      onChange={(e) => updateMaterial(m.idMaterialComplementar, { material: e.target.value })}
                    />
                    <div className="md:col-span-1 flex items-center justify-center gap-2">
                      <ToolTip text={(m.ativo ?? 1) === 1 ? "Inativar" : "Ativar"}>
                        <CheckboxStatus
                          checked={(m.ativo ?? 1) !== 1}
                          onChange={(checked) =>
                            updateMaterial(m.idMaterialComplementar, { ativo: checked ? 0 : 1 })
                          }
                        />
                      </ToolTip>
                      <ToolTip text="Excluir">
                        <button
                          type="button"
                          onClick={() => removeMaterial(m.idMaterialComplementar)}
                          className="px-2 py-1 text-sm text-red-500 rounded hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </ToolTip>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Nenhum material adicionado.</p>
            )}
          </div>
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
              <div className="overflow-auto border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-gray-600">
                      <th className="px-3 py-2 text-left">Título</th>
                      <th className="px-3 py-2 w-28 text-center">Tempo</th>
                      <th className="px-3 py-2 w-28 text-center">Aplicação</th>
                      <th className="px-3 py-2 w-20 text-center">Ativo</th>
                      <th className="px-3 py-2 w-28 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {avaliacoesAula.map((av) => (
                      <tr key={av.idAvaliacao ?? Math.random()} className="border-t">
                        <td className="px-3 py-2">
                          <input
                            className="w-full border rounded px-2 py-1"
                            value={av.titulo}
                            onChange={(e) => updateAvaliacaoAula(av.idAvaliacao, { titulo: e.target.value })}
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            className="w-full border rounded px-2 py-1"
                            value={av.tempoLimite ?? 0}
                            onChange={(e) =>
                              updateAvaliacaoAula(av.idAvaliacao, { tempoLimite: Number(e.target.value) || 0 })
                            }
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            className="w-full border rounded px-2 py-1"
                            value={av.tipoAplicacao ?? "PADRAO"}
                            onChange={(e) => updateAvaliacaoAula(av.idAvaliacao, { tipoAplicacao: e.target.value })}
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={(av.ativo ?? 1) === 1}
                            onChange={(e) => updateAvaliacaoAula(av.idAvaliacao, { ativo: e.target.checked ? 1 : 0 })}
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeAvaliacaoAula(av.idAvaliacao)}
                            className="px-2 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 cursor-pointer"
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Nenhuma avaliação da aula.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
