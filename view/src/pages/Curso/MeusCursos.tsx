import { useEffect, useState } from "react";
import { Play, Clock, TrendingUp, CheckCircle } from "lucide-react";
import type { Curso } from "../../types/EstruturaCurso";
import ToolTip from "../../components/Auxiliares/ToolTip";
import { getMeusCursos } from "../../services/apiCurso";
import CursoSidePanel from "./CursoSidePanel";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { formatarMinutosEmHoras } from "../../auxiliares/formatters";
import FiltrosCursos from "../../components/Filtros/FiltrosCursos";

type CursoListItem = Pick<Curso, "idCurso" | "titulo" | "descricao" | "cargaHoraria" | "ativo"> & {
  thumbUrl?: string | null;
  categorias?: string[];
  progresso?: number;
  concluido?: boolean;
  ultimaAulaId?: number;
};

// Mensagem caso não tenha cursos
function EmptyState() {
  return (
    <div className="rounded-2xl p-10 text-center">
      <p className="text-gray-700 font-medium">Nenhum curso disponível no momento.</p>
      <p className="text-gray-500 text-sm mt-1">Peça ao seu gestor para liberar cursos para você.</p>
    </div>
  );
}

function EmptyStateSearch() {
  return (
    <div className="rounded-2xl p-10 text-center">
      <p className="text-gray-700 font-medium">Nenhum curso encontrado.</p>
      <p className="text-gray-500 text-sm mt-1">Pesquise novamente usando outro termo.</p>
    </div>
  );
}

// Skeleton enquanto carrega
function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="min-w-[240px] bg-white rounded-xl p-4 animate-pulse">
          <div className="aspect-video bg-gray-200 rounded-xl mb-3" />
          <div className="h-4 w-3/4 bg-gray-200 mb-2 rounded" />
          <div className="h-3 w-1/2 bg-gray-200 mb-4 rounded" />
          <div className="h-8 w-full bg-gray-200 rounded" />
        </div>
      ))}
    </div>
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
    <div className="bg-white rounded-xl p-4 flex flex-col shadow-sm border border-gray-100 hover:shadow-md transition">
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

      <div className="mt-3 flex flex-col flex-1">
        <h3 className="text-sm font-bold text-sky-700 line-clamp-2">{curso.titulo}</h3>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{curso.descricao}</p>

        <div className="flex items-center gap-2 mt-2 select-none mb-3">
          <ToolTip text="Carga Horária">
            <div className="flex items-center text-xs text-blue-600 gap-1 bg-sky-100 border border-blue-400 px-2 rounded-full">
              <Clock className="w-3 h-3" />
              <span className="italic">{formatarMinutosEmHoras(curso.cargaHoraria)}</span>
            </div>
          </ToolTip>

          <ToolTip text="Progresso">
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
          className={`mt-auto w-full inline-flex items-center justify-center gap-2 rounded-md text-white text-sm font-semibold px-3 py-2 shadow-sm cursor-pointer
            ${progresso === 100
              ? "bg-green-600 hover:bg-green-700"
              : "bg-blue-600 hover:bg-blue-700"}`}
        >
          {progresso === 100 ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Concluído
            </>
          ) : (
            "Ver Curso"
          )}
        </button>
      </div>
    </div>
  );
}

export default function MeusCursos() {
  const { user } = useAuth();
  const [cursos, setCursos] = useState<CursoListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtros, setFiltros] = useState<any>({});

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
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.delete("curso");
      return p;
    }, { replace: false });
  };

  useEffect(() => {
    if (!user?.fkEmpresaId) return;
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

        cursosAdaptados.sort((a, b) => {
          if (a.concluido === b.concluido) return 0;
          return a.concluido ? 1 : -1;
        });

        console.log(lista);

        setCursos(cursosAdaptados);
      } catch (e: any) {
        setErro(e?.message ?? "Falha ao carregar seus cursos.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const cursosFiltrados = cursos.filter((c) =>
    c.titulo.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Meus Cursos</h1>
        <p className="text-gray-500 text-sm md:text-base">
          Veja os cursos disponíveis para você e acompanhe seu progresso.
        </p>
      </header>

      {/* 🔍 Filtros e Pesquisa */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
        <FiltrosCursos busca={busca} setBusca={setBusca} filtros={filtros} setFiltros={setFiltros} />
      </div>

      {/* Conteúdo */}
      {loading && <GridSkeleton />}
      {!loading && erro && (
        <EmptyState />
      )}
      {!loading && !erro && cursosFiltrados.length === 0 && <EmptyStateSearch />}

      {!loading && !erro && cursosFiltrados.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {cursosFiltrados.map((curso) => (
            <CursoCard key={curso.idCurso} curso={curso} onOpen={openPanel} />
          ))}
        </div>
      )}

      {/* Painel lateral */}
      <CursoSidePanel open={panelOpen} idCurso={selectedId} onClose={closePanel} />
    </div>
  );
}
