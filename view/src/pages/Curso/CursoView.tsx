import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCursoCompleto } from "../../services/apiCurso";
import type { CursoCompleto } from "../../types/EstruturaCurso";
import { Video } from "lucide-react";

export default function CursoView() {
  const { idCurso } = useParams();
  const navigate = useNavigate();
  const [curso, setCurso] = useState<CursoCompleto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getCursoCompleto(Number(idCurso));
        setCurso(data);
      } finally {
        setLoading(false);
      }
    };

    if (idCurso) load();
  }, [idCurso]);

  if (loading) return <div className="p-8">Carregando curso...</div>;
  if (!curso) return <div className="p-8 text-red-500">Curso não encontrado.</div>;

  return (
    <div className="mx-auto px-6 py-4 bg-white rounded-md">
      <h1 className="text-2xl font-bold mb-2">{curso.titulo}</h1>
      <p className="text-gray-600 mb-2">{curso.descricao}</p>
      <p className="text-sm text-gray-500 mb-2">
        Carga horária: {curso.cargaHoraria}h
      </p>

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

      {curso.responsaveltecnico && (
        <p className="text-sm text-gray-500 mb-4">
          Responsável Técnico: {curso.responsaveltecnico.nome}
        </p>
      )}

      <button
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded mb-6"
        onClick={() => navigate(`/play/${curso.idCurso}`)}
      >
        Iniciar Curso
      </button>

      <div className="space-y-4">
        {curso.modulos.map((mod) => (
          <div key={mod.idModulo}>
            <h2 className="text-lg font-semibold text-gray-800">{mod.titulo}</h2>
            <ul className="pl-4 mt-1 space-y-1 list-disc text-sm text-gray-700">
              {mod.aulas.map((aula) => (
                <li key={aula.idAula} className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-blue-500" />
                  {aula.titulo}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
