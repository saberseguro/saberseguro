import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Video, FileText } from "lucide-react";
import type { Modulo } from "../../types/EstruturaCurso";

export function ModulosAccordion({
  modulos,
}: {
  modulos: Modulo[];
}) {
  return (
    <div className="space-y-3">
      {modulos.map((mod) => {
        return (
          <AccordionItem
            key={mod.idModulo}
            titulo={
              <div className="flex items-center gap-2">
                <span>{mod.titulo}</span>
              </div>
            }
          >
            <ul className="mt-2 space-y-1 text-sm text-gray-700">
              {mod.aulas.map((aula) => {
                const isVideo = (aula.tipo ?? "").toString().toUpperCase() === "VIDEO";
                const avaliacoesAula = (aula.steps ?? []).filter(
                  (s) => s.tipo === "avaliacao" && s.avaliacao
                );

                return (
                  <li key={aula.idAula} className="relative py-1 group">
                    {/* Linha vertical da aula */}
                    <div className="absolute left-0 top-0 bottom-0" />

                    {/* Aula */}
                    <div className="flex items-center gap-2">
                      {isVideo ? (
                        <Video className="w-4 h-4 text-blue-500" />
                      ) : (
                        <FileText className="w-4 h-4 text-emerald-600" />
                      )}
                      <span className="leading-none">{aula.titulo}</span>
                    </div>

                    {/* Sublista de avaliações */}
                    {avaliacoesAula.length > 0 && (
                      <ul className="ml-2 mt-2 space-y-1">
                        {avaliacoesAula.map((step) => (
                          <li
                            key={`aval-aula-${step.avaliacao?.idAvaliacao}`}
                            className="relative pl-4"
                          >
                            {/* Linha vertical da avaliação */}
                            <div className="absolute left-0 top-0 bottom-0 w-px border-l-2 border-gray-400" />
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-emerald-600" />
                              <span className="leading-none">
                                {step.avaliacao?.titulo}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* AVALIAÇÕES DO MÓDULO */}
            {(mod.avaliacoes ?? []).map((aval) => (
              <li key={`aval-mod-${aval.idAvaliacao}`} className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" /> Avaliação do módulo: {aval.titulo}
              </li>
            ))}

          </AccordionItem>
        );
      })}
    </div>
  );
}

function AccordionItem({
  titulo,
  children,
  defaultOpen = false,
}: {
  titulo: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number>(0);
  const panelId = useId();

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const update = () => setHeight(el.scrollHeight);
    update();

    const obs = new MutationObserver(update);
    obs.observe(el, { childList: true, subtree: true });
    window.addEventListener("resize", update);

    return () => {
      obs.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [children, open]);

  return (
    <div>
      <button
        type="button"
        className="w-full flex items-center justify-between gap-3 px-4 py-1 text-left cursor-pointer"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="min-w-0 font-semibold text-gray-800 truncate">{titulo}</div>
        <ChevronDown
          className={`w-5 h-5 shrink-0 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""
            }`}
        />
      </button>

      <div
        id={panelId}
        ref={contentRef}
        style={{ maxHeight: open ? height : 0 }}
        className={`overflow-hidden transition-[max-height] duration-300 ease-out px-6`}
      >
        <div
          className={`px-4 ${open ? "opacity-100" : "opacity-0"
            } transition-opacity duration-200 border-l-2 border-gray-400`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}