import type { Modulo } from '../../types/EstruturaCurso';
import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface ModuloListProps {
  modulos: Modulo[];
  onAdicionar: (modulo: Modulo) => void;
  onAtualizar: (index: number, modulo: Modulo) => void;
  onRemover: (index: number) => void;
}

const ListaModulo = ({ modulos, onAdicionar, onAtualizar, onRemover }: ModuloListProps) => {
  const [aberto, setAberto] = useState<number | null>(null);

  const handleExpandir = (index: number) => {
    setAberto(aberto === index ? null : index);
  };

  return (
    <div className="border border-gray-200 rounded p-4 bg-white shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Módulos do Curso</h2>
        <button
          onClick={() => {/* abrir modal de módulo futuramente */}}
          className="btn btn-sm btn-primary flex gap-2 items-center"
        >
          <Plus size={16} />
          Adicionar Módulo
        </button>
      </div>

      {modulos.length === 0 && (
        <p className="text-sm text-gray-500">Nenhum módulo adicionado ainda.</p>
      )}

      {modulos.map((modulo, index) => (
        <div key={index} className="border border-gray-100 rounded p-3 bg-gray-50">
          <div className="flex justify-between items-center">
            <h3
              className="cursor-pointer font-semibold text-sm"
              onClick={() => handleExpandir(index)}
            >
              {modulo.titulo}
            </h3>
            <div className="flex gap-2">
              <button
                className="text-blue-600 hover:text-blue-800"
                onClick={() => {/* abrir modal para editar */}}
              >
                <Pencil size={16} />
              </button>
              <button
                className="text-red-600 hover:text-red-800"
                onClick={() => onRemover(index)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {aberto === index && (
            <div className="mt-2 text-sm text-gray-700">
              <p>{modulo.descricao || 'Sem descrição'}</p>
              <ul className="mt-2 list-disc pl-5">
                {modulo.aulas.map((aula, i) => (
                  <li key={i}>{aula.titulo}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ListaModulo;