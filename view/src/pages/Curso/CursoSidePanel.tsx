import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import CursoDetails from "./CursoDetails";

interface CursoSidePanelProps {
  open: boolean;
  idCurso: number | null;
  onClose: () => void;
  title?: string;
}

export default function CursoSidePanel({ open, idCurso, onClose, title = "Detalhes do Curso" }: CursoSidePanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Fechar com ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Evita scroll do body quando aberto (opcional)
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = original; };
    }
  }, [open]);

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-[60] ${open ? "" : "pointer-events-none"}`}
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
      />

      {/* Painel (sheet) */}
      <div
        ref={panelRef}
        className={`
          absolute right-0 top-0 h-full bg-white shadow-2xl border-l border-gray-200 md:rounded-l-md
          w-full md:w-5/12
          flex flex-col
          transition-transform duration-300 ease-out
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Painel de curso"
      >
        {/* Header */}
        <div className="shrink-0 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com scroll interno */}
        <div className="grow overflow-y-auto">
          {idCurso != null && open ? (
            <CursoDetails idCurso={idCurso} />
          ) : (
            <div className="p-6 text-sm text-gray-500">Selecione um curso.</div>
          )}
        </div>
      </div>
    </div>
  );
}
