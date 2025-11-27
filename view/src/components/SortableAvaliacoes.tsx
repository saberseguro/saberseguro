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
import { GripVertical, Eye, ClipboardList } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import type { Avaliacao } from "../types/EstruturaCurso";

interface Props {
  items: Avaliacao[];
  onReorder: (novas: Avaliacao[]) => void;
  tipo?: "curso" | "modulo" | "aula";
  idModulo?: number;
  idAula?: number;
}

export default function SortableAvaliacoes({ items, onReorder, tipo, idModulo, idAula }: Props) {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((a) => a.idAvaliacao === active.id);
    const newIndex = items.findIndex((a) => a.idAvaliacao === over.id);

    const novas = arrayMove(items, oldIndex, newIndex).map((a, i) => ({
      ...a,
      ordem: i + 1,
    }));

    onReorder(novas);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={items.map((i) => i.idAvaliacao!)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="space-y-3">
          {items.map((avaliacao) => (
            <SortableAvaliacao
              key={avaliacao.idAvaliacao}
              avaliacao={avaliacao}
              tipo={tipo}
              idModulo={idModulo}
              idAula={idAula}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableAvaliacao({
  avaliacao,
  tipo,
  idModulo,
  idAula,
}: {
  avaliacao: Avaliacao;
  tipo?: "curso" | "modulo" | "aula";
  idModulo?: number;
  idAula?: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: avaliacao.idAvaliacao!,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const { id } = useParams();
  const navigate = useNavigate();

  const handleNavigate = () => {
    if (tipo === "aula") {
      navigate(`/cursos/${id}/modulo/${idModulo}/aula/${idAula}/avaliacao/${avaliacao.idAvaliacao}`);
    } else {
      navigate(`/cursos/${id}/avaliacao/${avaliacao.idAvaliacao}`);
    }
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="p-4 bg-gray-50 border border-gray-100 rounded-md flex justify-between items-center hover:shadow-sm transition"
    >
      <div className="flex items-center gap-3">
        <button
          {...listeners}
          {...attributes}
          className="cursor-grab text-gray-400 hover:text-gray-600"
          title="Arrastar"
        >
          <GripVertical size={16} />
        </button>

        <div>
          <p className="font-semibold text-gray-700 flex items-center gap-2">
            <ClipboardList size={16} className="text-blue-500" />
            {avaliacao.titulo || "Sem título"}
          </p>
        </div>
      </div>

      <button
        onClick={handleNavigate}
        className="text-gray-600 hover:text-blue-600 cursor-pointer"
        title="Ver avaliação"
      >
        <Eye size={18} />
      </button>
    </li>
  );
}