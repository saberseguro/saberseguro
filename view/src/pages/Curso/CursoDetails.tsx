import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import { getCursoCompleto } from "../../services/apiCurso";
import type { CursoCompleto } from "../../types/EstruturaCurso";
import { ModulosAccordion } from "../../components/Accordions/Accordions";

interface CursoDetailsProps {
  idCurso: number;
}

export default function CursoDetails({ idCurso }: CursoDetailsProps) {
  const navigate = useNavigate();
  const [curso, setCurso] = useState<CursoCompleto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getCursoCompleto(Number(idCurso));
        if (mounted) setCurso(data);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (idCurso) load();
    return () => { mounted = false; };
  }, [idCurso]);

  if (loading) return <div className="p-6">Carregando curso...</div>;
  if (!curso) return <div className="p-6 text-red-500">Curso não encontrado.</div>;

  return (
    <div className="px-6 py-4">
      {/* Header */}
      <h1 className="text-2xl font-bold mb-2">{curso.titulo}</h1>
      <p className="text-gray-600">{curso.descricao}</p>
      <p className="text-sm text-gray-500">Carga horária: {curso.cargaHoraria}h</p>

      {/* Responsável Técnico */}
      {curso.responsaveltecnico && (
        <p className="text-sm text-gray-500 mb-4">
          Responsável Técnico: {curso.responsaveltecnico.nome}
        </p>
      )}

      {/* Categorias */}
      {curso.categorias?.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Categorias:</h3>
          <div className="flex flex-wrap gap-2">
            {curso.categorias.map((c, i) => (
              <span
                key={i}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
              >
                {c.categoria.nome}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Iniciar Curso */}
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium p-3 rounded mb-6 w-full flex items-center justify-center gap-2 cursor-pointer"
        onClick={() => navigate(`/cursos/playcurso/${curso.idCurso}`)}
      >
        <Play size={16} />
        <span className="leading-none">Iniciar Curso</span>
      </button>

      <h2 className="text-lg font-semibold text-gray-900 mb-2">Conteúdo do curso</h2>
      <ModulosAccordion modulos={curso.modulos} />
    </div>
  );
}
