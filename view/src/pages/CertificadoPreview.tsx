import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCertificadoPreview } from "../services/apiCurso";

export default function CertificadoPreview() {
  const { idCurso } = useParams();
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const json = await getCertificadoPreview(Number(idCurso));
        setPdfBase64(json.pdfBase64 ?? null);
      } catch (error) {
        console.error("Erro ao carregar preview do certificado", error);
      }
    };

    if (idCurso) fetchPreview();
  }, [idCurso]);

  if (!pdfBase64) return <div className="p-10 text-center">Carregando certificado...</div>;

  return (
    <div className="w-full h-[95vh]">
      <iframe
        src={`data:application/pdf;base64,${pdfBase64}`}
        className="w-full h-full border"
        title="Preview do Certificado"
      />
    </div>
  );
}
