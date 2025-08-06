import { useEffect, useState } from "react";
import type { Empresa } from "../../types/EstruturaEmpresa";
import { Input, SelectInput } from "./Inputs";
import toast from "react-hot-toast";
import Spinner from "../Spinner";

const API_URL = import.meta.env.VITE_API_URL;

interface FormEmpresaProps {
  initialData?: Partial<Empresa>;
  onEdit?: Empresa;
  setIsOpenEmpresa: (isOpen: boolean) => void;
  fetchEmpresa: () => void;
}

export default function FormEmpresa({ initialData = {}, onEdit, setIsOpenEmpresa, fetchEmpresa }: FormEmpresaProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nomeFantasia: initialData.nomeFantasia || "",
    razaoSocial: initialData.razaoSocial || "",
    tipoDocumento: initialData.tipoDocumento || "cnpj",
    documento: initialData.documento || "",
    cep: initialData.cep || "",
    endereco: initialData.endereco || "",
    numero: initialData.numero || "",
    complemento: initialData.complemento || "",
    bairro: initialData.bairro || "",
    cidade: initialData.cidade || "",
    uf: initialData.uf || "",
    logoUrl: initialData.logoUrl || "",
    ativo: initialData.ativo ?? 1,
  });

  useEffect(() => {
    if (onEdit) {
      setForm({
        nomeFantasia: onEdit.nomeFantasia || "",
        razaoSocial: onEdit.razaoSocial || "",
        tipoDocumento: onEdit.tipoDocumento || "cnpj",
        documento: onEdit.documento || "",
        cep: onEdit.cep || "",
        endereco: onEdit.endereco || "",
        numero: onEdit.numero || "",
        complemento: onEdit.complemento || "",
        bairro: onEdit.bairro || "",
        cidade: onEdit.cidade || "",
        uf: onEdit.uf || "",
        logoUrl: onEdit.logoUrl || "",
        ativo: onEdit.ativo ?? 1,
      });
    }
  }, [onEdit])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Token de autenticação não encontrado.");
      }

      const response = await fetch(`${API_URL}/empresa${onEdit ? `/${onEdit.idEmpresa}` : ""}`, {
        method: onEdit ? "PUT" : "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar empresa");
      }

      toast.success("Empresa salva com sucesso!");
      setIsOpenEmpresa(false);
      handleClear();
      fetchEmpresa();
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      console.error(err);
      toast.error(err.message || "Erro ao salvar");
    }
  };

  const handleClear = () => {
    setForm({
      nomeFantasia: "",
      razaoSocial: "",
      tipoDocumento: "cnpj",
      documento: "",
      cep: "",
      endereco: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      uf: "",
      logoUrl: "",
      ativo: 1,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Input label="Nome Fantasia" name="nomeFantasia" value={form.nomeFantasia} onChange={handleChange} />
        <Input label="Razão Social" name="razaoSocial" value={form.razaoSocial} onChange={handleChange} />
        <SelectInput
          label="Status"
          name="ativo"
          value={String(form.ativo)}
          onChange={(e) => setForm((prev) => ({ ...prev, ativo: Number(e.target.value) }))}
          options={[
            { value: "1", label: "Ativo" },
            { value: "0", label: "Inativo" },
          ]}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <SelectInput
          label="Tipo Documento"
          name="tipoDocumento"
          value={form.tipoDocumento}
          onChange={handleChange}
          options={[
            { value: "cnpj", label: "CNPJ" },
            { value: "caepf", label: "CAEPF" },
          ]}
        />
        <Input label="Documento" name="documento" value={form.documento} onChange={handleChange} />
        <Input label="CEP" name="cep" value={form.cep} onChange={handleChange} />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Input label="Endereço" name="endereco" value={form.endereco} onChange={handleChange} />
        <Input label="Número" name="numero" value={form.numero} onChange={handleChange} />
        <Input label="Complemento" name="complemento" value={form.complemento} onChange={handleChange} required={false} />
        <Input label="Bairro" name="bairro" value={form.bairro} onChange={handleChange} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Cidade" name="cidade" value={form.cidade} onChange={handleChange} />
        <Input label="UF" name="uf" value={form.uf} onChange={handleChange} maxLength={2} />
      </div>

      <div className="flex justify-end">
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-400" disabled={loading}>
          {loading ? <Spinner /> : "Salvar"}
        </button>
      </div>
    </form>
  );
}
