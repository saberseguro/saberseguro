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
<<<<<<< HEAD
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs">
      <div className={`bg-white rounded shadow-lg w-full ${largura} mx-4 relative`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-300 px-4 py-2">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 cursor-pointer">
=======
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`bg-white rounded shadow-lg w-full ${largura} mx-4 relative`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500">
>>>>>>> 1316e51b0d85809677b0de4a1f5ba69c7070a4ef
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}