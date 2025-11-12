import type { Curso } from "../../types/EstruturaCurso";
import { formatarMinutosEmHoras } from "../../auxiliares/formatters";

interface Props {
  curso: Curso;
}

export default function VisualizarCurso({ curso }: Props) {
  return (
    <div className="bg-white rounded-md shadow p-6 space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-gray-700">Informações do Curso</h2>
        <p className="text-sm text-gray-500">
          Última edição: {new Date(curso.editado_em).toLocaleString()}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 text-sm">
        <p><strong>Título:</strong> {curso.titulo}</p>
        <p><strong>Status:</strong> {curso.ativo ? "Ativo" : "Inativo"}</p>
        <p><strong>Carga horária:</strong> {formatarMinutosEmHoras(curso.cargaHoraria)}</p>
        <p><strong>Responsável Técnico:</strong> {curso.responsaveltecnico?.nome ?? "-"}</p>
      </div>

      <div>
        <h3 className="font-medium text-gray-600 mt-4">Descrição</h3>
        <p className="text-gray-700">{curso.descricao || "-"}</p>
      </div>

      {curso.categorias?.length ? (
        <div>
          <h3 className="font-medium text-gray-600 mt-4">Categorias</h3>
          <ul className="list-disc pl-5 text-gray-700">
            {curso.categorias.map((c) => (
              <li key={c.idCategoriaCurso}>{c.categoria.nome}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
