import React from "react";
import { X } from "lucide-react";

interface ModalBaseProps {
  titulo?: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  largura?: string;
}

export default function ModalBase({ titulo, isOpen, onClose, children, largura = "max-w-lg" }: ModalBaseProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-xs">
      <div className={`bg-white rounded shadow-lg w-full ${largura} mx-4 relative max-h-[90vh] flex flex-col`}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-300 px-4 py-2 flex-shrink-0">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Body com scroll interno */}
        <div className="p-4 overflow-y-auto flex-grow">
          {children}
        </div>
      </div>
    </div>

  );
}