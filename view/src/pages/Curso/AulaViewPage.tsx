import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Video,
  FileText,
  ClipboardList,
  GitBranch,
  Trash,
  Pencil,
} from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import Loading from "../../components/Loading";
import {
  getAulaPorId,
} from "../../services/apiAula";
import {
  getVideosDaAula,
  criarVideo,
  editarVideo,
  excluirVideo,
  getMateriaisDaAula,
  getStepsDaAula,
} from "../../services/apiAula";
import { FluxoEditor } from "../../components/Formularios/FormAulaDetalhes";
import ToolTip from "../../components/Auxiliares/ToolTip";
import type { Aula, AulaVideo, MaterialComplementar, AulaStep } from "../../types/EstruturaCurso";
import { MateriaisEditor } from "../../components/Formularios/MateriaisEditor";

function VideoItem({
  video,
  onSave,
  onRemove,
}: {
  video: AulaVideo;
  onSave: (id: number, url: string) => Promise<void>;
  onRemove: (id: number) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editUrl, setEditUrl] = useState(video.url ?? "");

  const handleSave = async () => {
    if (!editUrl.trim()) {
      toast.error("Informe uma URL válida");
      return;
    }
    await onSave(video.idAulaVideo as number, editUrl);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditUrl(video.url ?? "");
  };

  return (
    <div
      className={`flex gap-2 items-center rounded border p-2 ${isEditing
          ? "bg-white border-blue-400"
          : "bg-gray-50 hover:bg-gray-100 border-gray-200"
        }`}
    >
      <input
        disabled={!isEditing}
        className={`flex-1 border rounded px-3 py-2 text-sm ${isEditing
            ? "border-gray-300"
            : "border-transparent bg-transparent text-gray-700 cursor-default"
          }`}
        placeholder="URL do vídeo"
        value={editUrl}
        onChange={(e) => setEditUrl(e.target.value)}
      />

      {!isEditing ? (
        <>
          <ToolTip text="Editar vídeo">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-blue-500 rounded hover:text-blue-700 cursor-pointer"
            >
              <Pencil size={16} />
            </button>
          </ToolTip>

          <ToolTip text="Excluir vídeo">
            <button
              onClick={() => onRemove(video.idAulaVideo || 0)}
              className="p-2 text-red-500 rounded hover:text-red-600 cursor-pointer"
            >
              <Trash size={16} />
            </button>
          </ToolTip>
        </>
      ) : (
        <>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-green-500 text-white text-sm rounded hover:bg-green-600 cursor-pointer"
          >
            Salvar
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 cursor-pointer"
          >
            Cancelar
          </button>
        </>
      )}
    </div>
  );
}


export default function AulaViewPage() {
  const { id, idModulo, idAula } = useParams();
  const navigate = useNavigate();
  const [aba, setAba] = useState<"videos" | "materiais" | "avaliacoes" | "fluxo">("videos");
  const [loading, setLoading] = useState(true);
  const [aula, setAula] = useState<Aula | null>(null);

  const [videos, setVideos] = useState<AulaVideo[]>([]);
  const [isEditingVideo, setIsEditingVideo] = useState(false);
  const [_updateVideo, setUpdateVideo] = useState<Partial<AulaVideo> | null>(null);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [materiais, setMateriais] = useState<MaterialComplementar[]>([]);
  // const [isEditingMaterial, setIsEditingMaterial] = useState(false);
  const [steps, setSteps] = useState<AulaStep[]>([]);
  // const [isEditingStep, setIsEditingStep] = useState(false);

  useEffect(() => {
    async function carregarTudo() {
      try {
        setLoading(true);
        const aula = await getAulaPorId(Number(idAula));
        const [v, m, s] = await Promise.all([
          getVideosDaAula(Number(idAula)),
          getMateriaisDaAula(Number(idAula)),
          getStepsDaAula(Number(idAula)),
        ]);
        setAula(aula);
        setVideos(v);
        setMateriais(m);
        setSteps(s);
      } catch (err) {
        toast.error("Erro ao carregar aula");
      } finally {
        setLoading(false);
      }
    }
    carregarTudo();
  }, [idAula]);

  if (loading) return <Loading />;
  if (!aula) return <p className="text-center text-gray-500">Aula não encontrada.</p>;

  // Handlers específicos
  const handleAddVideo = () => setIsEditingVideo(true);

  const handleSaveVideos = async () => {
    if (!newVideoUrl.trim()) return;
    const novo = await criarVideo(Number(idAula), { url: newVideoUrl });
    setVideos((v) => [...v, novo]);
    setNewVideoUrl("");
    setIsEditingVideo(false);
  };

  const handleRemoveVideo = async (id: number) => {
    const confirmar = await Swal.fire({
      title: "Remover vídeo?",
      text: "Esta ação não pode ser desfeita.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonText: "Cancelar",
      confirmButtonText: "Sim, remover",
      reverseButtons: true,
    });
    if (!confirmar.isConfirmed) return;
    await excluirVideo(id);
    setVideos((v) => v.filter((x) => x.idAulaVideo !== id));
  };

  return (
    <div className="p-4">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/cursos/${id}/modulo/${idModulo}`)}
            className="p-2 hover:bg-gray-200 rounded-full transition"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{aula.titulo}</h1>
            <p className="text-gray-500 text-sm">{aula.descricao}</p>
          </div>
        </div>
        <button
          onClick={() =>
            navigate(`/cursos/${id}/modulo/${idModulo}/aula/${idAula}/editar`)
          }
          className="flex items-center gap-2 text-blue-600 cursor-pointer hover:bg-gray-200 px-3 py-1.5 rounded-md"
        >
          <Edit size={16} /> Editar
        </button>
      </div>

      {/* ABAS */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex border-b border-gray-300 mb-4">
          {[
            { key: "videos", label: "Vídeos", icon: Video, color: "blue-600" },
            { key: "materiais", label: "Materiais", icon: FileText, color: "yellow-600" },
            { key: "avaliacoes", label: "Avaliações", icon: ClipboardList, color: "green-600" },
            { key: "fluxo", label: "Fluxo", icon: GitBranch, color: "purple-500" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = aba === tab.key;
            const activeColor = tab.color;

            return (
              <button
                key={tab.key}
                onClick={() => setAba(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition cursor-pointer
                  ${isActive
                    ? `border-${activeColor} text-${activeColor}`
                    : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
              >
                <Icon
                  size={14}
                  className={`${isActive ? `text-${activeColor}` : "text-gray-500 group-hover:text-gray-700"}`}
                />
                {tab.label}
              </button>
            );
          })}
        </div>


        {/* CONTEÚDO DAS ABAS */}
        {aba === "videos" && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h5 className="font-semibold text-gray-700">
                Vídeos ({videos.length})
              </h5>
              <button
                onClick={handleAddVideo}
                disabled={isEditingVideo}
                className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Adicionar Vídeo
              </button>
            </div>

            {/* Mini formulário para adicionar novo vídeo */}
            {isEditingVideo && (
              <div className="flex gap-2 items-center border border-gray-200 p-3 rounded-md bg-gray-50">
                <input
                  type="text"
                  placeholder="URL do vídeo"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                />
                <button
                  onClick={handleSaveVideos}
                  className="px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => {
                    setIsEditingVideo(false);
                    setNewVideoUrl("");
                  }}
                  className="px-3 py-2 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            )}

            {/* Lista de vídeos existentes */}
            {videos.length ? (
              <div className="space-y-2">
                {videos.map((v) => (
                  <VideoItem
                    key={v.idAulaVideo}
                    video={v}
                    onSave={async (id, url) => {
                      try {
                        await editarVideo(id, { url });
                        setVideos((prev) =>
                          prev.map((x) =>
                            x.idAulaVideo === id ? { ...x, url } : x
                          )
                        );
                        toast.success("Vídeo atualizado com sucesso!");
                      } catch {
                        toast.error("Erro ao salvar alterações do vídeo");
                      }
                    }}
                    onRemove={handleRemoveVideo}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                Nenhum vídeo adicionado.
              </p>
            )}
          </div>
        )}


        {aba === "materiais" && (
          <MateriaisEditor
            materiais={materiais}
            setMateriais={setMateriais}
            aulaId={Number(idAula)}
            setUploadsPendentes={() => { }}
          />
        )}

        {aba === "fluxo" && (
          <FluxoEditor
            steps={steps}
            setSteps={async (updated) => {
              setSteps(updated);
            }}
            videos={videos}
            materiais={materiais}
            avaliacoes={[]}
            color={"bg-purple-500 hover:bg-purple-600"}
          />
        )}

        {aba === "avaliacoes" && (
          <p className="text-sm text-gray-500 italic">
            As avaliações da aula são gerenciadas separadamente.
          </p>
        )}
      </div>
    </div>
  );
}
