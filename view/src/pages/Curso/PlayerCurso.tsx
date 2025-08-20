import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getCursoCompleto } from "../../services/apiCurso"; // Crie esse endpoint
import type { CursoCompleto } from "../../types/EstruturaCurso"; // Curso com módulos, aulas, etc
import { Video, FileText, ChevronRight } from "lucide-react";

export default function PlayCursoPage() {
  const { idCurso } = useParams();
  const [searchParams] = useSearchParams();
  const aulaInicialId = searchParams.get("aula");

  const [curso, setCurso] = useState<CursoCompleto | null>(null);
  const [aulaSelecionada, setAulaSelecionada] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getCursoCompleto(Number(idCurso));
        setCurso(data);

        // Seleciona aula inicial (última assistida ou primeira)
        const todasAulas = data.modulos.flatMap((m) => m.aulas);
        const aula = todasAulas.find((a) => String(a.idAula) === aulaInicialId)
          ?? todasAulas[0];
        setAulaSelecionada(aula);
      } finally {
        setLoading(false);
      }
    };

    if (idCurso) load();
  }, [idCurso, aulaInicialId]);

  if (loading) return <div className="p-8">Carregando curso...</div>;
  if (!curso) return <div className="p-8 text-red-500">Curso não encontrado.</div>;

  return (
    <div className="flex h-screen">
      {/* Sidebar de aulas */}
      <aside className="w-64 bg-gray-100 p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">{curso.titulo}</h2>
        {curso.modulos.map((mod) => (
          <div key={mod.idModulo} className="mb-4">
            <h3 className="text-sm font-bold text-gray-700">{mod.titulo}</h3>
            <ul className="mt-2 space-y-1">
              {mod.aulas.map((aula) => (
                <li
                  key={aula.idAula}
                  onClick={() => setAulaSelecionada(aula)}
                  className={`cursor-pointer px-2 py-1 rounded text-sm hover:bg-blue-100 ${
                    aula.idAula === aulaSelecionada?.idAula ? "bg-blue-200 font-medium" : ""
                  }`}
                >
                  <Video className="inline w-4 h-4 mr-1" />
                  {aula.titulo}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>

      {/* Player principal */}
      <main className="flex-1 p-6 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-2">{aulaSelecionada?.titulo}</h2>

        <div className="aspect-video bg-black mb-4 rounded-lg overflow-hidden">
          {aulaSelecionada?.urlVideo ? (
            <video
              src={aulaSelecionada.urlVideo}
              controls
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-white flex items-center justify-center h-full">Vídeo não disponível</div>
          )}
        </div>

        <p className="text-gray-700 whitespace-pre-wrap">{aulaSelecionada?.descricao}</p>

        {/* (Opcional) materiais da aula */}
        {aulaSelecionada?.materiais?.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium text-gray-800 mb-2">Materiais:</h3>
            <ul className="list-disc list-inside text-sm text-blue-600">
              {aulaSelecionada.materiais.map((mat: any) => (
                <li key={mat.idMaterialComplementar}>
                  <a href={mat.url} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {mat.nome}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}