import { formatarMinutosEmHoras } from '../../auxiliares/formatters';
import type { Categoria, Curso } from '../../types/EstruturaCurso';
import { Input, TextArea, SelectInput, SelectMultiInput } from './Inputs';
import { getCategorias } from '../../services/apiCurso';
import { useEffect, useState } from 'react';

interface FormCursoProps {
  curso: Curso;
  setCurso: (curso: Curso) => void;
  setLoading: (loading: boolean) => void;
}

export default function FormCurso({ curso, setCurso, setLoading }: FormCursoProps) {
  const [categoriasOpts, setCategoriasOpts] = useState<Categoria[]>([]);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<number[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const lista = await getCategorias();
        setCategoriasOpts(lista);
      } catch (e) {
        console.error('Erro ao carregar categorias', e);
      }
    })();
  }, []);

  useEffect(() => {
    const ids = Array.isArray(curso.categorias)
      ? curso.categorias
        .map((c: any) => c?.idCategoria ?? c?.fkCategoriaId ?? c?.id)
        .filter((x: any) => typeof x === 'number')
      : [];
    setCategoriasSelecionadas(ids as number[]);
  }, [curso]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setCurso({ ...curso, [name]: value });
  };

  const handleToggleAtivo = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurso({ ...curso, ativo: parseInt(e.target.value) });
  };

  const handleCategoriasChange = (selected: number[]) => {
    setCategoriasSelecionadas(selected);
    const novasCats = categoriasOpts.filter((c) => selected.includes((c as any).idCategoria));
    setCurso({ ...curso, categorias: novasCats as any });
  };

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Dados do Curso</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Título"
          name="titulo"
          value={curso.titulo}
          onChange={handleChange}
        />

        <Input
          label="Carga Horária"
          name="cargaHoraria"
          onChange={handleChange}
          value={formatarMinutosEmHoras(curso.cargaHoraria)}
          disable
        />

        {/* <Input
          label="Responsável Técnico (ID)"
          name="fkResponsavelTecnicoId"
          value={String(curso.fkResponsavelTecnicoId)}
          onChange={handleChange}
          type="number"
        />

        <Input
          label="Empresa (ID)"
          name="fkEmpresaId"
          value={curso.fkEmpresaId ? String(curso.fkEmpresaId) : ''}
          onChange={handleChange}
          type="number"
        /> */}

        <SelectInput
          label="Status"
          name="ativo"
          value={String(curso.ativo)}
          onChange={handleToggleAtivo}
          options={[
            { value: '1', label: 'Ativo' },
            { value: '0', label: 'Inativo' },
          ]}
        />
      </div>

      <div className="md:col-span-3">
        <SelectMultiInput<number>
          label="Categorias"
          name="categorias"
          value={categoriasSelecionadas}
          onChange={handleCategoriasChange}
          options={categoriasOpts.map((c) => ({
            value: (c as any).idCategoria,
            label: c.nome,
          }))}
          placeholder="Selecione as categorias"
          required
        />
      </div>

      <TextArea
        label="Descrição"
        name="descricao"
        value={curso.descricao || ''}
        onChange={handleChange}
      />
    </div>
  );
}