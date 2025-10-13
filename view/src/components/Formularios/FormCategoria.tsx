import { useState } from "react";
import Spinner from "../Spinner";
import toast from "react-hot-toast";
import { createCategoria, updateCategoria } from "../../services/apiCurso";
import type { Categoria } from "../../types/EstruturaCurso";
import { Input, TextArea } from "./Inputs";

interface FormCategoriaProps {
  initialData?: Partial<Categoria>;
  setIsOpen: (open: boolean) => void;
  fetchCategorias: () => void;
}

export default function FormCategoria({
  initialData,
  setIsOpen,
  fetchCategorias,
}: FormCategoriaProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<Categoria>>({
    nome: initialData?.nome || "",
    descricao: initialData?.descricao || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (initialData?.idCategoria) {
        await updateCategoria(initialData.idCategoria, form);
        toast.success("Categoria atualizada!");
      } else {
        await createCategoria(form);
        toast.success("Categoria cadastrada!");
      }

      fetchCategorias();
      setIsOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar categoria");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Nome" name="nome" value={form.nome} onChange={handleChange} />
      <TextArea label="Descrição" name="descricao" value={form.descricao ?? ""} onChange={handleChange} />

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? <Spinner /> : "Salvar"}
        </button>
      </div>
    </form>
  );
}
