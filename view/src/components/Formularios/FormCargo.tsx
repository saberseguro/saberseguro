import { useEffect, useState } from "react";
import type { Cargo } from "../../types/EstruturaEmpresa";
import { Input, SelectInput, TextArea } from "./Inputs";
import toast from "react-hot-toast";
import Spinner from "../Spinner";

const API_URL = import.meta.env.VITE_API_URL;

interface FormCargoProps {
  initialData?: Partial<Cargo>;
  onEdit?: Cargo;
  fkSetorId?: number;
  setIsOpenCargo: (isOpen: boolean) => void;
  fetchCargos: () => void;
}

export default function FormSetor({ initialData = {}, onEdit, fkSetorId, setIsOpenCargo, fetchCargos }: FormCargoProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: initialData.nome || "",
    descricao: initialData.descricao || "",
    ativo: initialData.ativo ?? 1,
    fkSetorId: fkSetorId ?? 0,
  });

  useEffect(() => {
    if (onEdit) {
      setForm({
        nome: onEdit.nome || "",
        descricao: onEdit.descricao || "",
        ativo: onEdit.ativo ?? 1,
        fkSetorId: fkSetorId ?? 0,
      });
    }
  }, [onEdit])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

      const response = await fetch(`${API_URL}/cargo${onEdit ? `/${onEdit.idCargo}` : ""}`, {
        method: onEdit ? "PUT" : "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar cargo");
      }

      toast.success("Cargo salva com sucesso!");
      setIsOpenCargo(false);
      handleClear();
      fetchCargos();
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      console.error(err);
      toast.error(err.message || "Erro ao salvar");
    }
  };

  const handleClear = () => {
    setForm({
      nome: "",
      descricao: "",
      ativo: 1,
      fkSetorId: fkSetorId ?? 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Nome" name="nome" value={form.nome} onChange={handleChange} />
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

      <div className="grid grid-cols-1 gap-4">
        <TextArea label="Descrição" name="descricao" value={form.descricao} onChange={handleChange} />
      </div>

      <div className="flex justify-end">
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-400" disabled={loading}>
          {loading ? <Spinner /> : "Salvar"}
        </button>
      </div>
    </form>
  );
}
