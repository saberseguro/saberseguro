import { useState } from "react";

interface SearchDropdownProps<T> {
  label?: string;
  placeholder?: string;
  valor: string;
  onChange: (valor: string) => void;
  onSelect: (item: T) => void;
  buscar: (termo: string) => Promise<T[]>;
  renderItem: (item: T) => React.ReactNode;
  chaveUnica: (item: T) => string | number;
  className?: string;
}

export function SearchDropdown<T>({
  label = "",
  placeholder = "Digite para buscar",
  valor,
  onChange,
  onSelect,
  buscar,
  renderItem,
  chaveUnica,
  className = "",
}: SearchDropdownProps<T>) {
  const [resultados, setResultados] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  const executarBusca = async () => {
    if (valor.length < 3) return;
    setLoading(true);
    try {
      const resultados = await buscar(valor);
      setResultados(resultados);
    } catch (err) {
      console.error("Erro na busca:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {label && <label className="block text-sm font-semibold mb-1">{label}</label>}

      <div className="relative">
        <div className="w-full border border-gray-300 bg-white rounded">
          <div className="relative">
            <input
              type="text"
              value={valor}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  executarBusca();
                }
              }}
              placeholder={placeholder}
              className="w-full py-2 px-4 pr-10 focus:outline-none"
            />

            {/* botão de busca */}
            <button
              type="button"
              onClick={executarBusca}
              className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-5 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1116.65 2a7.5 7.5 0 010 15z"
                />
              </svg>
            </button>

            {loading && (
              <div className="absolute right-10 top-2 text-xs text-gray-400">
                Buscando...
              </div>
            )}
          </div>

          {resultados.length > 0 && (
            <ul className="w-full max-h-60 overflow-auto pr-2">
              {resultados.map((item) => (
                <li
                  key={chaveUnica(item)}
                  className="py-2 px-4 hover:bg-gray-100 cursor-pointer rounded-r-full"
                  onClick={() => {
                    onSelect(item);
                    setResultados([]);
                  }}
                >
                  {renderItem(item)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}