// components/Modais/ModalVisualizador.tsx
import { useState } from "react";
import { X, Loader2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  titulo: string;
  url: string;
}

export default function ModalVisualizador({ isOpen, onClose, titulo, url }: Props) {
  const [isLoading, setIsLoading] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-11/12 h-[95vh] rounded shadow-lg flex flex-col overflow-hidden relative">
        <div className="p-3 flex items-center justify-between border-b border-gray-300">
          <h2 className="text-sm font-semibold text-gray-800 truncate">{titulo}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative flex-1 overflow-auto bg-gray-100">
          {/* Spinner de carregamento */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/70">
              <p>Carregando...</p>
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          )}

          {/* Visualizador */}
          <iframe
            src={url}
            title={titulo}
            className="w-full h-full"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </div>
    </div>
  );
}
