import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, GripVertical } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { reordenarModulos } from "../services/apiModulo";
import toast from "react-hot-toast";
import type { Modulo } from "../types/EstruturaCurso";
import { useState } from "react";

interface Props {
  items: Modulo[];
  onReorder: (novos: Modulo[]) => void;
}

export default function SortableContextWrapper({ items, onReorder }: Props) {
  const sensors = useSensors(useSensor(PointerSensor));
  const [saving, setSaving] = useState(false);

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    // se estiver salvando ou sem mudança real, cancela
    if (!over || active.id === over.id || saving) return;

    const oldIndex = items.findIndex((i: any) => i.idModulo === active.id);
    const newIndex = items.findIndex((i: any) => i.idModulo === over.id);

    const newOrder = arrayMove(items, oldIndex, newIndex).map((m: any, index: number) => ({
      ...m,
      ordem: index + 1,
    }));

    onReorder(newOrder);

    setSaving(true);
    try {
      await toast.promise(
        reordenarModulos(newOrder),
        {
          loading: "Salvando nova ordem...",
          success: "Ordem atualizada com sucesso!",
          error: "Erro ao salvar ordem",
        }
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={items.map((i: any) => i.idModulo)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="space-y-2">
          {items.map((modulo: any) => (
            <SortableItem key={modulo.idModulo} modulo={modulo} saving={saving} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({ modulo, saving }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: modulo.idModulo,
  });
  const navigate = useNavigate();
  const { id } = useParams();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="p-3 bg-gray-50 rounded-md border border-gray-100 flex justify-between items-center shadow-sm hover:shadow transition"
    >
      <div className="flex items-center gap-3">
        <button
          {...(!saving ? listeners : {})}
          {...(!saving ? attributes : {})}
          className="cursor-grab text-gray-400 hover:text-gray-600"
          title="Arrastar"
        >
          <GripVertical size={16} />
        </button>

        <div>
          <p className="text-gray-700 font-medium">{modulo.titulo}</p>
          <p className="text-xs text-gray-500">
            {modulo.aulas?.length ?? 0} aulas
          </p>
        </div>
      </div>

      <button
        onClick={() =>
          navigate(`/cursos/${id}/modulo/${modulo.idModulo}`)
        }
        className="text-blue-500 hover:bg-gray-200 p-1 rounded-full transition cursor-pointer"
        title="Ver módulo"
      >
        <Eye size={18} />
      </button>
    </li>
  );
}
