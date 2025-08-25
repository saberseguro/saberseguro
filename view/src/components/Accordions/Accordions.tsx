// components/Curso/ModulosAccordion.tsx
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Video, FileText } from "lucide-react";
import type { Modulo } from "../../types/EstruturaCurso";

export function ModulosAccordion({ modulos }: { modulos: Modulo[] }) {
  return (
    <div className="space-y-3">
      {modulos.map((mod) => (
        <AccordionItem key={mod.idModulo} titulo={mod.titulo}>
          <ul className="mt-2 space-y-1 text-sm text-gray-700">
            {mod.aulas.map((aula) => {
              const isVideo = (aula.tipo ?? "").toString().toUpperCase() === "VIDEO";
              return (
                <li key={aula.idAula} className="flex items-center gap-2 py-1">
                  {isVideo ? (
                    <Video className="w-4 h-4 text-blue-500" />
                  ) : (
                    <FileText className="w-4 h-4 text-emerald-600" />
                  )}
                  <span className="leading-none">{aula.titulo}</span>
                </li>
              );
            })}
          </ul>
        </AccordionItem>
      ))}
    </div>
  );
}

function AccordionItem({
  titulo,
  children,
  defaultOpen = false,
}: {
  titulo: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number>(0);
  const panelId = useId(); // acessibilidade

  // mede o conteúdo para animar a altura
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    // atualiza altura ao abrir ou quando conteúdo muda
    const update = () => setHeight(el.scrollHeight);
    update();

    // observador para mudanças internas (caso lista mude dinamicamente)
    const obs = new MutationObserver(update);
    obs.observe(el, { childList: true, subtree: true });
    window.addEventListener("resize", update);

    return () => {
      obs.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [children, open]);

  return (
    <div className="">
      <button
        type="button"
        className="w-full flex items-center justify-between gap-3 px-4 py-1 text-left cursor-pointer"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="min-w-0">
          <div className="font-semibold text-gray-800 truncate">{titulo}</div>
        </div>

        <ChevronDown
          className={`w-5 h-5 shrink-0 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* painel com animação de altura */}
      <div
        id={panelId}
        ref={contentRef}
        style={{ maxHeight: open ? height : 0 }}
        className={`overflow-hidden transition-[max-height] duration-300 ease-out px-6`}
      >
        <div className={`px-4 ${open ? "opacity-100" : "opacity-0"} transition-opacity duration-200 border-l-2 border-gray-400`}>
          {children}
        </div>
      </div>
    </div>
  );
}