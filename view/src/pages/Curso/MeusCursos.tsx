import { useEffect, useRef, useState } from "react";
import { Play, Clock, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import type { Curso } from "../../types/EstruturaCurso";
import ToolTip from "../../components/Auxiliares/ToolTip";
import { getMeusCursos } from "../../services/apiCurso";
import CursoSidePanel from "./CursoSidePanel";
import { useSearchParams } from "react-router-dom";

type CursoListItem = Pick<Curso, "idCurso" | "titulo" | "descricao" | "cargaHoraria" | "ativo"> & {
  thumbUrl?: string | null;
  categorias?: string[];
  progresso?: number;
  concluido?: boolean;
  ultimaAulaId?: number;
};

// Mensagem caso nao tenha cursos
function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center">
      <p className="text-gray-700 font-medium">Nenhum curso disponível no momento.</p>
      <p className="text-gray-500 text-sm mt-1">Peça ao seu gestor para atribuir cursos ou verifique seus vínculos.</p>
    </div>
  );
}

// Skeleton rápido enquanto carrega a primeira seção
function GridSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-48 bg-gray-200 animate-pulse rounded" />
      <div className="relative">
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="min-w-[220px] w-[220px]">
              <div className="aspect-video rounded-xl bg-gray-200 animate-pulse" />
              <div className="mt-3 h-4 w-3/4 bg-gray-200 animate-pulse rounded" />
              <div className="mt-2 h-3 w-1/2 bg-gray-200 animate-pulse rounded" />
              <div className="mt-3 h-8 w-full bg-gray-200 animate-pulse rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CarouselRow({ titulo, itens, onOpen }: { titulo: string; itens: CursoListItem[]; onOpen: (id: number) => void }) {
  const listRef = useRef<HTMLDivElement | null>(null);

  const scrollBy = (dir: "left" | "right") => {
    const el = listRef.current;
    if (!el) return;
    const cardWidth = 220 + 16; // largura aproximada + gap
    const delta = cardWidth * 3; // anda ~3 cards
    el.scrollBy({ left: dir === "left" ? -delta : delta, behavior: "smooth" });
  };

  const onWheel = (e: React.WheelEvent) => {
    // suporte a trackpad: arrasto vertical vira scroll horizontal
    const el = listRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollBy({ left: e.deltaY, behavior: "smooth" });
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") scrollBy("left");
    if (e.key === "ArrowRight") scrollBy("right");
  };

  return (
    <section aria-label={titulo} className="">
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-lg md:text-xl font-semibold text-gray-800">{titulo}</h2>
      </div>

      <div className="relative" onKeyDown={onKeyDown}>
        {/* Botão Esquerda */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
          <ToolTip text="Anterior" position="right">
            <button
              type="button"
              onClick={() => scrollBy("left")}
              className="bg-white/80 hover:bg-white shadow-lg border border-gray-200 rounded-full p-2 cursor-pointer"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </ToolTip>
        </div>

        {/* Lista horizontal */}
        <div
          ref={listRef}
          className="flex gap-4 overflow-x-auto scroll-smooth no-scrollbar pr-6 pl-6"
          onWheel={onWheel}
          tabIndex={0}
        >
          {itens.map((c) => (
            <CursoCard key={c.idCurso} curso={c} onOpen={onOpen} />
          ))}
        </div>

        {/* Botão Direita */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
          <ToolTip text="Próximo" position="left">
            <button
              type="button"
              onClick={() => scrollBy("right")}
              className="bg-white/80 hover:bg-white shadow-lg border border-gray-200 rounded-full p-2 cursor-pointer"
              aria-label="Próximo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </ToolTip>
        </div>
      </div>
    </section>
  );
}

const getProgressoClass = (progresso: number) => {
  if (progresso === 0) return "bg-gray-100 text-gray-500 border-gray-400";
  if (progresso < 100) return "bg-yellow-100 text-yellow-600 border-yellow-400";
  return "bg-green-100 text-green-600 border-green-400";
};

function CursoCard({ curso, onOpen }: { curso: CursoListItem; onOpen: (id: number) => void }) {
  const progresso = Math.max(0, Math.min(100, Number(curso.progresso ?? 0)));

  return (
    <div className="min-w-[240px] w-[240px] bg-white rounded-xl p-4">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-200">
        {curso.thumbUrl ? (
          <img
            src={curso.thumbUrl}
            alt={`Capa do curso ${curso.titulo}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-400">
            <Play className="w-10 h-10" />
          </div>
        )}
        {curso.categorias && curso.categorias.length > 0 && (
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {curso.categorias.slice(0, 2).map((cat, i) => (
              <span
                key={i}
                className="bg-black/70 text-white text-[10px] font-medium px-2 py-0.5 rounded-full"
              >
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3">
        <h3 className="text-sm font-bold text-sky-700 line-clamp-2">{curso.titulo}</h3>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{curso.descricao}</p>

        <div className="flex items-center gap-2 mt-2 select-none">
          <ToolTip text={`Carga Horária`}>
            <div className="flex items-center text-xs text-blue-600 gap-1 bg-sky-100 border border-blue-400 px-2 rounded-full">
              <Clock className="w-3 h-3" />
              <span className="italic">{Number(curso.cargaHoraria ?? 0)}h</span>
            </div>
          </ToolTip>

          <ToolTip text={`Progresso`}>
            <div
              className={`flex items-center text-xs gap-1 px-2 rounded-full border transition-colors duration-300 ease-in-out ${getProgressoClass(progresso)}`}
            >
              <TrendingUp className="w-3 h-3" />
              <span className="italic">{progresso ?? 0}%</span>
            </div>
          </ToolTip>
        </div>

        <button
          type="button"
          onClick={() => onOpen(curso.idCurso)}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-2 shadow-sm cursor-pointer"
        >
          Ver Curso
        </button>
      </div>
    </div>
  );
}

export default function MeusCursos() {
  const [cursos, setCursos] = useState<CursoListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedIdFromQS = searchParams.get("curso");
  const selectedId = selectedIdFromQS ? Number(selectedIdFromQS) : null;
  const panelOpen = selectedId != null && !Number.isNaN(selectedId);

  const openPanel = (id: number) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("curso", String(id));
      return p;
    }, { replace: false });
  };

  const closePanel = () => {
    // remove ?curso da URL
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.delete("curso");
      return p;
    }, { replace: false });
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErro(null);
        const lista = await getMeusCursos();
        const cursosAdaptados: CursoListItem[] = lista.map((c: any) => ({
          idCurso: c.idCurso,
          titulo: c.titulo,
          descricao: c.descricao,
          cargaHoraria: c.cargaHoraria,
          ativo: c.ativo,
          thumbUrl: c.thumbUrl ?? null,
          categorias: Array.isArray(c.categorias)
            ? c.categorias.map((cat: any) =>
              typeof cat === "string" ? cat : cat?.categoria?.nome ?? ""
            )
            : [],
          progresso: c.acessos?.[0]?.percentual ?? 0,
          concluido: c.acessos?.[0]?.concluido ?? false,
          ultimaAulaId: c.ultimaAulaId ?? undefined,
        }));

        setCursos(cursosAdaptados);
      } catch (e: any) {
        setErro(e?.message ?? "Falha ao carregar seus cursos.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const secoes = [
    { id: "meus-cursos", titulo: "Meus cursos", itens: cursos },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <header className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Meus Cursos</h1>
        <p className="text-gray-500 text-sm md:text-base">
          Cursos disponíveis para você, com base no seu cargo/setor e nas medidas de segurança.
        </p>
      </header>

      {loading && <GridSkeleton />}

      {!loading && erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
          Erro ao carregar cursos. Favor entrar em contato com o suporte.
        </div>
      )}

      {!loading && !erro && cursos.length === 0 && <EmptyState />}

      {!loading && !erro && cursos.length > 0 && (
        <div className="space-y-8">
          {secoes.map((sec) => (
            <CarouselRow key={sec.id} titulo={sec.titulo} itens={sec.itens} onOpen={openPanel} />
          ))}
        </div>
      )}

      {/* Sheet lateral */}
      <CursoSidePanel
        open={panelOpen}
        idCurso={selectedId}
        onClose={closePanel}
      />
    </div>
  );
}