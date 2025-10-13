import SignatureCanvas from "react-signature-canvas";
import { useRef, useState } from "react";

interface AssinaturaCanvasProps {
  onSalvar: (assinaturaBase64: string) => void;
}

export default function AssinaturaCanvas({ onSalvar }: AssinaturaCanvasProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [vazia, setVazia] = useState(true);

  const handleClear = () => {
    sigCanvas.current?.clear();
    setVazia(true);
  };

  const handleSalvar = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const dataURL = sigCanvas.current.getCanvas().toDataURL("image/png");
      onSalvar(dataURL);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-gray-100 rounded-md">
      <SignatureCanvas
        ref={sigCanvas}
        onEnd={() => setVazia(false)}
        penColor="black"
        backgroundColor="#fff"
        canvasProps={{
          width: 500,
          height: 150,
          className: "border border-gray-400 rounded-md bg-white",
        }}
      />
      <div className="flex gap-3">
        <button type="button" onClick={handleClear} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 cursor-pointer">
          Limpar
        </button>
        <button
          type="button"
          onClick={handleSalvar}
          disabled={vazia}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 cursor-pointer"
        >
          Salvar Assinatura
        </button>
      </div>
    </div>
  );
}