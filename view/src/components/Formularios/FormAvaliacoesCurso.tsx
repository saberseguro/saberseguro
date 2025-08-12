// components/Formularios/FormAvaliacoesCurso.tsx
import type { Curso, Avaliacao } from "../../types/EstruturaCurso";
import { makeAvaliacao } from "../../types/FactoriesCurso";
import FormAvaliacao from "./FormAvaliacao";

interface Props {
  curso: Curso;
  setCurso: React.Dispatch<React.SetStateAction<Curso>>;
  setLoading: (loading: boolean) => void;
}

export default function FormAvaliacoesCurso({ curso, setCurso }: Props) {
  const avaliacoes: Avaliacao[] = curso.avaliacoes ?? [];

  const addAvaliacao = () => {
    setCurso((prev) => ({
      ...prev,
      avaliacoes: [...(prev.avaliacoes ?? []), makeAvaliacao((prev.avaliacoes?.length ?? 0) + 1)],
    }));
  };

  const updateAvaliacao = (idAvaliacao: number | undefined, patch: Partial<Avaliacao>) => {
    if (idAvaliacao == null) return;
    setCurso((prev) => ({
      ...prev,
      avaliacoes: (prev.avaliacoes ?? []).map((a) => (a.idAvaliacao === idAvaliacao ? { ...a, ...patch } : a)),
    }));
  };

  const removeAvaliacao = (idAvaliacao: number | undefined) => {
    if (idAvaliacao == null) return;
    setCurso((prev) => ({
      ...prev,
      avaliacoes: (prev.avaliacoes ?? []).filter((a) => a.idAvaliacao !== idAvaliacao),
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-700">
          Avaliações do curso ({avaliacoes.length})
        </h3>
        <button
          type="button"
          onClick={addAvaliacao}
          className="px-3 py-2 text-sm bg-violet-600 text-white rounded hover:bg-violet-700 cursor-pointer"
        >
          + Avaliação
        </button>
      </div>

      {avaliacoes.length ? (
        <div className="space-y-3">
          {avaliacoes.map((av) => (
            <FormAvaliacao
              key={av.idAvaliacao ?? Math.random()}
              avaliacao={av}
              onChange={(patch) => updateAvaliacao(av.idAvaliacao, patch)}
              onRemove={() => removeAvaliacao(av.idAvaliacao)}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">Nenhuma avaliação cadastrada para o curso.</p>
      )}
    </div>
  );
}