import { Pencil, Trash2 } from "lucide-react";
import ToolTip from "../Auxiliares/ToolTip";
import Checkbox from "../Formularios/Inputs";
import CheckboxStatus from "../Formularios/Inputs";

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
    <>
      <div>
        <table className="w-full text-sm border border-gray-200 text-center">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Título</th>
              <th className="p-2">Responsável</th>
              <th className="p-2">Categoria</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {cursos.map((curso) => (
              <tr key={curso.idCurso} className="border-t border-gray-300">
                <td className="p-2 text-left">{curso.titulo}</td>
                <td className="p-2">{curso.responsavel?.nome || "—"}</td>
                <td className="p-2">{curso.categorias?.[0]?.nome || "—"}</td>
                <td className="p-2 flex justify-center items-center gap-2">
                  <ToolTip text="Editar">
                    <button className="text-blue-500 cursor-pointer hover:text-blue-700"><Pencil size={14} /></button>
                  </ToolTip>
                  <ToolTip text={`${curso.ativo ? "Desativar" : "Ativar"}`}>
                    <CheckboxStatus
                      checked={curso.ativo !== 1}
                      onChange={() => { }}
                    />
                  </ToolTip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
