import { useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCertificadoPreview } from "../services/apiCurso";
import { Download, ShieldCheck, Loader2 } from "lucide-react";

export default function CertificadoPreview() {
  const { idCertificado } = useParams();
  const { state } = useLocation() as { state?: { nome?: string } };
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        setLoading(true);
        const json = await getCertificadoPreview(Number(idCertificado));
        setPdfBase64(json.pdfBase64 ?? null);
      } catch (error) {
        console.error("Erro ao carregar preview do certificado", error);
      } finally {
        setLoading(false);
      }
    };

    if (idCertificado) fetchPreview();
  }, [idCertificado]);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-[90vh] text-gray-600">
        <Loader2 className="animate-spin w-8 h-8 mb-3 text-sky-600" />
        <p className="text-sm">Gerando pré-visualização do certificado...</p>
      </div>
    );

  if (!pdfBase64)
    return (
      <div className="flex flex-col items-center justify-center h-[90vh] text-gray-500">
        <ShieldCheck className="w-10 h-10 mb-3 text-gray-400" />
        <p className="text-sm">Certificado não encontrado ou ainda não gerado.</p>
      </div>
    );

  const pdfUrl = `data:application/pdf;base64,${pdfBase64}`;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `Certificado ${state?.nome}.pdf`;
    link.click();
  };

  return (
    <div className="flex flex-col items-center px-2">
      {/* Cabeçalho */}
      <div className="w-full flex justify-between items-center mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <ShieldCheck className="text-sky-600" />
            Visualização do Certificado
          </h1>
          <p className="text-sm text-gray-500">Documento oficial emitido pelo <i className="font-semibold">Saber Seguro Treinamentos</i></p>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 shadow-sm transition cursor-pointer"
        >
          <Download size={16} />
          Baixar PDF
        </button>
      </div>

      {/* Moldura com o certificado */}
      <div className="bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden max-w-6xl w-full">
        <iframe
          src={pdfUrl}
          title="Certificado"
          className="w-full h-[85vh]"
          style={{
            border: "none",
            boxShadow: "0 0 40px rgba(0, 0, 0, 0.08)",
          }}
        />
      </div>
    </div>
  );
}
