import { useState } from "react";
import Spinner from "../Spinner";
import toast from "react-hot-toast";
import {
  createResponsavelTecnico,
  updateResponsavelTecnico,
} from "../../services/apiCurso"; // ajuste o caminho se necessário
import type { ResponsavelTecnico } from "../../types/EstruturaCurso";
import { Input, SelectInput } from "./Inputs";
import AssinaturaCanvas from "../Auxiliares/AssinaturaCanvas";
import { uploadAssinaturaResponsavel } from "../../services/upload";

interface FormResponsavelTecnicoProps {
  initialData?: Partial<ResponsavelTecnico>;
  setIsOpen: (open: boolean) => void;
  fetchResponsaveis: () => void;
}

export default function FormResponsavelTecnico({
  initialData,
  setIsOpen,
  fetchResponsaveis,
}: FormResponsavelTecnicoProps) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<Partial<ResponsavelTecnico>>({
    nome: initialData?.nome || "",
    tipoDocumento: initialData?.tipoDocumento || "cpf",
    documento: initialData?.documento || "",
    registro: initialData?.registro || "",
    funcao: initialData?.funcao || "",
    telefone: initialData?.telefone || "",
    assinatura: initialData?.assinatura || "",
    ativo: initialData?.ativo ?? 1,
  });

  const [showCanvas, setShowCanvas] = useState(false);
  const [email, setEmail] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSalvarAssinatura = async (assinaturaBase64: string) => {
    try {
      toast.loading("Salvando assinatura...", { id: "assinatura" });

      const idResponsavel =
        initialData?.idResponsavelTecnico ?? Date.now();

      const url = await uploadAssinaturaResponsavel(assinaturaBase64, idResponsavel);

      setForm((prev) => ({ ...prev, assinatura: url }));
      setShowCanvas(false);
      toast.success("Assinatura salva com sucesso!", { id: "assinatura" });
    } catch (error: any) {
      toast.error("Erro ao salvar assinatura", { id: "assinatura" });
      console.error(error);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const payload = {
        ...form,
        email,
      };

      if (!form.assinatura) {
        toast.error("Por favor, adicione uma assinatura.");
        return;
      }

      if (initialData?.idResponsavelTecnico) {
        await updateResponsavelTecnico(initialData.idResponsavelTecnico, payload);
        toast.success("Responsável técnico atualizado!");
      } else {
        await createResponsavelTecnico(payload);
        toast.success("Responsável técnico cadastrado!");
      }

      fetchResponsaveis();
      setIsOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar responsável técnico");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Nome" name="nome" value={form.nome} onChange={handleChange} />
        <Input label="Email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} required={false} disable={!!initialData?.idResponsavelTecnico} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <SelectInput
          label="Tipo Documento"
          name="tipoDocumento"
          value={form.tipoDocumento ?? "CPF"}
          onChange={handleChange}
          options={[
            { value: "cpf", label: "CPF" },
            { value: "rg", label: "RG" },
            { value: "cnh", label: "CNH" },
          ]}
        />
        <Input label="Documento" name="documento" value={form.documento} onChange={handleChange} />
        <Input label="Registro" name="registro" value={form.registro} onChange={handleChange} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Função" name="funcao" value={form.funcao} onChange={handleChange} />
        <Input label="Telefone" name="telefone" value={form.telefone} onChange={handleChange} />
      </div>

      <div className="flex flex-col md:flex-row items-start justify-between gap-6">
        {/* Coluna esquerda: visualização da assinatura */}
        <div className="flex flex-col items-center gap-2 w-full md:w-1/2">
          <label className="text-sm font-medium text-gray-700">Assinatura</label>

          {form.assinatura ? (
            <>
              <img
                src={form.assinatura}
                alt="Assinatura"
                className="border border-gray-400 rounded-md bg-white p-2 max-h-30 max-w-full"
              />
              <button
                type="button"
                onClick={() => setShowCanvas(true)}
                className="text-blue-600 hover:underline text-sm"
              >
                Redesenhar assinatura
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowCanvas(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-3 py-1 rounded text-sm cursor-pointer"
            >
              + Criar assinatura
            </button>
          )}
        </div>

        {/* Coluna direita: área do canvas */}
        {showCanvas && (
          <div className="flex flex-col items-center w-full md:w-1/2">
            <label className="text-sm font-medium text-gray-700 mb-2">Desenhar assinatura</label>
            <div className="border border-gray-300 rounded-md p-2 bg-gray-50 w-full">
              <AssinaturaCanvas onSalvar={handleSalvarAssinatura} />
            </div>
          </div>
        )}
      </div>


      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 cursor-pointer"
        >
          {loading ? <Spinner /> : "Salvar"}
        </button>
      </div>
    </form>
  );
}
