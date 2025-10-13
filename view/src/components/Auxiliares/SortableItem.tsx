// SortableItem.tsx
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";

interface Props {
  id: string;
  children: (bindDrag: ReturnType<typeof useSortable>) => ReactNode;
}

export default function SortableItem({ id, children }: Props) {
  const sortable = useSortable({ id });
  const { setNodeRef, transform, transition } = sortable;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children(sortable)}
    </div>
  );
}