import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import { getCertificadoModeloPorId, criarCertificadoModelo } from "../../services/apiCertificadoModelo";
import { Button, Input, TextArea } from "../../components/Formularios/Inputs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/Tabs/Tabs";

export default function CertificadoEditorPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [pagina1, setPagina1] = useState("");
  const [pagina2, setPagina2] = useState("");

  useEffect(() => {
    if (id && id !== "novo") {
      setLoading(true);
      getCertificadoModeloPorId(Number(id))
        .then((data) => {
          setTitulo(data.titulo);
          setPagina1(data.pagina1 || "");
          setPagina2(data.pagina2 || "");
        })
        .catch(() => toast.error("Erro ao carregar modelo."))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSalvar = async () => {
    setLoading(true);
    try {
      await criarCertificadoModelo({
        id: id === "novo" ? 0 : Number(id),
        titulo,
        pagina1,
        pagina2,
      });
      toast.success("Modelo salvo com sucesso.");
    } catch (e) {
      toast.error("Erro ao salvar modelo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-4">Editor de Certificado</h1>
      <Input
        name="tituloModelo"
        placeholder="Título do modelo"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
      />

      <Tabs defaultValue="pagina1" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pagina1">Página 1 - Certificado</TabsTrigger>
          <TabsTrigger value="pagina2">Página 2 - Conteúdo Programático</TabsTrigger>
        </TabsList>

        <TabsContent value="pagina1">
          <TextArea
            label="Conteúdo Programático"
            name="pagina2"
            rows={18}
            value={pagina2}
            onChange={(e) => setPagina2(e.target.value)}
            placeholder="Digite o conteúdo da segunda página..."
          />
        </TabsContent>

        <TabsContent value="pagina2">
          <TextArea
            label="Texto do Certificado"
            name="pagina1"
            value={pagina1}
            onChange={(e) => setPagina1(e.target.value)}
            placeholder="Digite o conteúdo da primeira página..."
            rows={18}
          />
        </TabsContent>
      </Tabs>

      <Button onClick={handleSalvar} disabled={loading} className="mt-4">
        {loading ? "Salvando..." : "Salvar Modelo"}
      </Button>
    </div>
  );
}
