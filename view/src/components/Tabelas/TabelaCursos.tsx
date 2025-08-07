interface Curso {
  idCurso: number;
  titulo: string;
  responsavel?: {
    nome: string;
  };
  categorias?: {
    nome: string;
  }[];
  ativo: number;
}

interface Props {
  cursos: Curso[];
}

export default function TabelaCursos({ cursos }: Props) {
  return (
    <table className="w-full text-sm border border-gray-200 text-left">
      <thead>
        <tr className="bg-gray-100">
          <th className="p-2">Título</th>
          <th className="p-2">Responsável</th>
          <th className="p-2">Categoria</th>
          <th className="p-2">Status</th>
          <th className="p-2">Ações</th>
        </tr>
      </thead>
      <tbody>
        {cursos.map((curso) => (
          <tr key={curso.idCurso} className="border-t border-gray-300">
            <td className="p-2">{curso.titulo}</td>
            <td className="p-2">{curso.responsavel?.nome || "—"}</td>
            <td className="p-2">{curso.categorias?.[0]?.nome || "—"}</td>
            <td className="p-2">{curso.ativo ? "Ativo" : "Inativo"}</td>
            <td className="p-2 flex gap-2">
              <button className="text-blue-600">Ver</button>
              <button className="text-green-600">Editar</button>
              <button className="text-red-600">Excluir</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
