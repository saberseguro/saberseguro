import { useState } from "react";
import AssinaturaCanvas from "../Auxiliares/AssinaturaCanvas";
import toast from "react-hot-toast";
import { uploadAssinaturaUsuario } from "../../services/upload";
import { useAuth } from "../../contexts/AuthContext";

export default function FormAssinaturaUsuario() {
  const { user, atualizarAssinatura } = useAuth();
  const [urlAssinatura, setUrlAssinatura] = useState<string | null>(null);
  const [_salvando, setSalvando] = useState(false);
  const [_assinaturaPronta, setAssinaturaPronta] = useState(false);

  const handleSalvar = async (base64: string) => {
    if (!user) return;

    try {
      toast.loading("Salvando assinatura...", { id: "assinatura" });
      setSalvando(true);

      const url = await uploadAssinaturaUsuario(base64, user.idUsuario);
      await atualizarAssinatura(url, user.idUsuario);
      setUrlAssinatura(url);
      setAssinaturaPronta(true);
      toast.success("Assinatura salva com sucesso!", { id: "assinatura" });
    } catch (error) {
      toast.error("Erro ao salvar assinatura", { id: "assinatura" });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-4">
      {urlAssinatura ? (
        <>
          <img src={urlAssinatura} alt="Assinatura" className="max-w-sm border rounded p-2" />
          <button
            className="text-blue-600 text-sm hover:underline"
            onClick={() => setUrlAssinatura(null)}
          >
            Redesenhar assinatura
          </button>
        </>
      ) : (
        <div className="w-full">
          <AssinaturaCanvas onSalvar={handleSalvar} />
        </div>
      )}
    </div>
  );
}
