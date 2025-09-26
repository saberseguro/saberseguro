import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, GraduationCap, Play, UserCircle } from "lucide-react";
import { getCursoCompleto } from "../../services/apiCurso";
import type { CursoCompleto } from "../../types/EstruturaCurso";
import { ModulosAccordion } from "../../components/Accordions/Accordions";

interface CursoDetailsProps {
  idCurso: number;
}

function getCorProgresso(percentual: number): string {
  if (percentual === 0) return "#d1d5db";
  if (percentual < 30) return "#a3e635";
  if (percentual < 60) return "#4ade80";
  if (percentual < 90) return "#22c55e";
  return "#16a34a";
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

  const percentual = curso.acessos?.[0]?.percentual ?? 0;

  let textoBotao = "Iniciar Curso";
  let corBotao = "bg-blue-600 hover:bg-blue-700";
  let IconeBotao = Play;

  if (percentual === 0) {
    textoBotao = "Iniciar Curso";
  } else if (percentual < 100) {
    textoBotao = "Continuar Curso";
  } else {
    textoBotao = "Gerar Certificado";
    corBotao = "bg-green-600 hover:bg-green-700";
    IconeBotao = GraduationCap;
  }

  return (
    <div className="px-6 py-4">
      {/* Barra de Progresso */}
      {typeof percentual === 'number' && (
        <div className="mb-2">
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300`}
              style={{
                width: `${percentual}%`,
                backgroundColor: getCorProgresso(percentual),
              }}
            />
          </div>
          <div className="mt-1 text-right text-xs text-gray-500 italic">
            {percentual}%
          </div>
        </div>
      )}

      {/* Header */}
      <h1 className="text-2xl font-bold mb-1">{curso.titulo}</h1>

      {/* Carga horária & Responsável Técnico */}
      <div className="flex items-center gap-2 mb-2">
        {/* Carga horária */}
        <div className="flex items-center text-xs text-gray-600 gap-1 bg-gray-100 px-2 py-1 rounded-full">
          <Clock size={14} className="text-gray-400" />
          <span>{curso.cargaHoraria}h</span>
        </div>

        {/* Responsável Técnico */}
        {curso.responsaveltecnico && (
          <div className="flex items-center text-xs text-gray-600 gap-1 bg-gray-100 px-2 py-1 rounded-full">
            <UserCircle size={14} className="text-gray-400" />
            <span>{curso.responsaveltecnico.nome}</span>
          </div>
        )}
      </div>

      {/* Descrição */}
      <p className="text-gray-600 text-sm mb-4">Descrição: {curso.descricao}</p>

      {/* Categorias */}
      {curso.categorias?.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Categorias:</h3>
          <div className="flex flex-wrap gap-2">
            {curso.categorias.map((c, i) => (
              <span
                key={i}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
              >
                {c.categoria.nome}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Iniciar Curso */}
      <button
        className={`${corBotao} text-white font-medium p-3 rounded mb-6 w-full flex items-center justify-center gap-2 cursor-pointer`}
        onClick={() => navigate(`/cursos/playcurso/${curso.idCurso}`)}
      >
        <IconeBotao size={16} />
        <span className="leading-none">{textoBotao}</span>
      </button>

      <h2 className="text-lg font-semibold text-gray-900 mb-2">Conteúdo do curso</h2>
      <ModulosAccordion modulos={curso.modulos} />
    </div>
  );
}
