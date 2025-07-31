interface ColunaProps<T> {
  titulo: string;
  dados: T[];
  onSelecionar?: (item: T) => void;
  selecionado?: T | null;
}

export default function Coluna<T extends { id: number; nome: string }>({ titulo, dados, onSelecionar, selecionado }: ColunaProps<T>) {
  return (
    <div className="w-64 border-r border-gray-200 p-3 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-3">{titulo}</h2>
      {dados.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelecionar?.(item)}
          className={`block w-full text-left p-2 rounded hover:bg-gray-100 ${selecionado?.id === item.id ? 'bg-blue-100 font-semibold' : ''}`}
        >
          {item.nome}
        </button>
      ))}
    </div>
  );
}