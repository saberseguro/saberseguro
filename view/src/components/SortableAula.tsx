import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Eye, Clock } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import { reordenarAulas } from "../services/apiAula";

export default function SortableAulas({
  items,
  onReorder,
}: {
  items: any[];
  onReorder: (novas: any[]) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor));
  const { idModulo } = useParams();
  const [saving, setSaving] = useState(false);

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id || saving) return;

    const oldIndex = items.findIndex((a) => a.idAula === active.id);
    const newIndex = items.findIndex((a) => a.idAula === over.id);

    const novas = arrayMove(items, oldIndex, newIndex).map((a, index) => ({
      ...a,
      ordem: index + 1,
    }));

    onReorder(novas);

    setSaving(true);
    try {
      await toast.promise(
        reordenarAulas(novas),
        {
          loading: "Salvando nova ordem das aulas...",
          success: "Ordem das aulas atualizada!",
          error: "Erro ao salvar ordem",
        }
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.idAula)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-3">
          {items.map((aula) => (
            <SortableAula key={aula.idAula} aula={aula} saving={saving} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableAula({ aula, saving }: { aula: any; saving: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: aula.idAula,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const { id, idModulo } = useParams();
  const navigate = useNavigate();

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="p-4 bg-gray-50 border border-gray-100 rounded-md flex justify-between items-center hover:shadow-sm transition"
    >
      <div className="flex items-center gap-3">
        <button
          {...(!saving ? listeners : {})}
          {...(!saving ? attributes : {})}
          disabled={saving}
          className={`${
            saving ? "cursor-not-allowed opacity-50" : "cursor-grab"
          } text-gray-400 hover:text-gray-600`}
          title="Arrastar"
        >
          <GripVertical size={16} />
        </button>

        <div>
          <p className="font-semibold text-gray-700">{aula.titulo}</p>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <Clock size={12} /> {aula.duracao || 0} minutos
          </p>
        </div>
      </div>

      <button
        onClick={() =>
          navigate(`/cursos/${id}/modulo/${idModulo}/aula/${aula.idAula}`)
        }
        className="text-gray-600 hover:text-blue-600 cursor-pointer"
        title="Ver aula"
      >
        <Eye size={18} />
      </button>
    </li>
  );
}