import React from "react";
import { Input, SelectInput } from "../Formularios/Inputs";
import { Search } from "lucide-react";

interface Props {
  busca: string;
  setBusca: (v: string) => void;
  filtros: { tipo: string | null; ativo: string | null };
  setFiltros: React.Dispatch<React.SetStateAction<{ tipo: string | null; ativo: string | null }>>;
  onFiltrar?: () => void;
}

const tipos = [
  { label: "EPI", value: "epi" },
  { label: "EPC", value: "epc" },
  { label: "Administrativa", value: "adm" },
  { label: "Treinamento", value: "treinamento" },
  { label: "Insepção", value: "inspecao" },
  { label: "Geral", value: "geral" },
];

export default function FiltrosMedidas({ busca, setBusca, filtros, setFiltros, onFiltrar }: Props) {
  return (
    <>
      <div className="w-full mb-4">

        {/* Select + Search input */}
        <div className="flex w-full border border-gray-300 rounded-md overflow-hidden">
          {/* Categoria dropdown */}
          <select
            value={filtros.tipo ?? ""}
            onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value || null })}
            className="px-3 py-2 bg-white text-sm text-gray-700 focus:outline-none border-r border-gray-200"
          >
            <option value="">Todas os Tipos</option>
            {tipos.map((tip) => (
              <option value={String(tip.value)}>
                {tip.label}
              </option>
            ))}
          </select>

          {/* Input de busca */}
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar Medidas..."
            className="flex-1 px-3 py-2 text-sm focus:outline-none"
          />

          {/* Botão de pesquisa (estilizado com ícone) */}
          <button
            type="button"
            className="px-4 bg-sky-600 text-white hover:bg-sky-700 transition-all cursor-pointer"
            onClick={onFiltrar}
          >
            <Search size={15} />
          </button>
        </div>

      </div>
    </>
  );
}