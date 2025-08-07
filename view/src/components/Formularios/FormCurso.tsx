import type { Curso } from '../../types/EstruturaCurso';

interface FormCursoProps {
  curso: Curso;
  setCurso: (curso: Curso) => void;
}

const FormCurso = ({ curso, setCurso }: FormCursoProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurso({ ...curso, [name]: value });
  };

  const handleToggleAtivo = () => {
    setCurso({ ...curso, ativo: curso.ativo === 1 ? 0 : 1 });
  };

  return (
    <div className="border border-gray-200 rounded p-4 space-y-4 bg-white shadow-sm">
      <h2 className="text-lg font-semibold">Dados do Curso</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm">Título</label>
          <input
            type="text"
            name="titulo"
            value={curso.titulo}
            onChange={handleChange}
            className="input input-bordered w-full"
          />
        </div>

        <div>
          <label className="block text-sm">Carga Horária</label>
          <input
            type="text"
            name="cargaHoraria"
            value={curso.cargaHoraria}
            onChange={handleChange}
            className="input input-bordered w-full"
          />
        </div>

        <div>
          <label className="block text-sm">Responsável Técnico (ID)</label>
          <input
            type="number"
            name="fkResponsavelTecnicoId"
            value={curso.fkResponsavelTecnicoId}
            onChange={handleChange}
            className="input input-bordered w-full"
          />
        </div>

        <div>
          <label className="block text-sm">Empresa (ID)</label>
          <input
            type="number"
            name="fkEmpresaId"
            value={curso.fkEmpresaId ?? ''}
            onChange={handleChange}
            className="input input-bordered w-full"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm">Descrição</label>
        <textarea
          name="descricao"
          value={curso.descricao || ''}
          onChange={handleChange}
          className="textarea textarea-bordered w-full"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={curso.ativo === 1}
          onChange={handleToggleAtivo}
          className="checkbox"
        />
        <label className="text-sm">Curso Ativo</label>
      </div>
    </div>
  );
};

export default FormCurso;
