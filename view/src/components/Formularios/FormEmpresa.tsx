import { useEffect, useState } from "react";
import type { Empresa } from "../../types/EstruturaEmpresa";
import { Input, SearchableSelect, SelectInput } from "./Inputs";
import toast from "react-hot-toast";
import Spinner from "../Spinner";
import { Plus, Trash2 } from "lucide-react";
import Swal from "sweetalert2";

const API_URL = import.meta.env.VITE_API_URL;

interface FormEmpresaProps {
  initialData?: Partial<Empresa>;
  onEdit?: Empresa;
  setIsOpenEmpresa: (isOpen: boolean) => void;
  fetchEmpresa: () => void;
  onSaved?: (empresa: Empresa) => void;
  cursosOptions?: { label: string; value: number }[];
  medidasOptions?: { label: string; value: number }[];
}

type CursoVincRow = {
  idCursoAcesso?: number;
  idCurso: number;
  titulo: string;
  ativo: 0 | 1;
};

type MedidaVincRow = {
  idMedidaVinculo?: number;
  idMedida: number;
  nome: string;
  ativo: 0 | 1;
};

export default function FormEmpresa({
  initialData = {},
  onEdit,
  setIsOpenEmpresa,
  fetchEmpresa,
  onSaved,
  cursosOptions,
  medidasOptions,
}: FormEmpresaProps) {
  const [loading, setLoading] = useState(false);
  const [abaSelecionada, setAbaSelecionada] = useState("dados");

  const [selCurso, setSelCurso] = useState<{ label: string; value: number } | null>(null);
  const [selMedida, setSelMedida] = useState<{ label: string; value: number } | null>(null);

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
    cursos: [] as CursoVincRow[],
    medidas: [] as MedidaVincRow[],
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
        cursos: (onEdit.cursos ?? []).map((curso: any) => ({
          idCursoAcesso: curso.idCursoAcesso,
          idCurso: curso.idCurso,
          titulo: curso.titulo,
          ativo: curso.ativo,
        })),
        medidas: (onEdit.medidas ?? []).map((medida: any) => ({
          idMedidaVinculo: medida.idMedidaVinculo,
          idMedida: medida.idMedida,
          nome: medida.nome,
          ativo: medida.ativo,
        })),
      });
    } else {
      handleClear();
    }
  }, [onEdit]);

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
        throw new Error("Token de autenticação não encontrado.");
      }

      const response = await fetch(`${API_URL}/empresa${onEdit ? `/${onEdit.idEmpresa}` : ""}`, {
        method: onEdit ? "PUT" : "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...form,
          cursos: form.cursos.map((c) => ({ idCurso: c.idCurso, ativo: c.ativo })),
          medidas: form.medidas.map((m) => ({ idMedida: m.idMedida, ativo: m.ativo })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Erro ao salvar empresa");
      }

      toast.success("Empresa salva com sucesso!");
      setIsOpenEmpresa(false);
      handleClear();
      onSaved?.(data);
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
      cursos: [],
      medidas: [],
    });
    setAbaSelecionada("dados");
  };

  // Cursos
  const handleAdicionarCursoSelecionado = () => {
    if (!selCurso) return;

    const jaExiste = form.cursos.some((c) => c.idCurso === selCurso.value);
    if (jaExiste) {
      toast.error("Curso já vinculado");
      return;
    }

    const novoCurso: CursoVincRow = {
      idCurso: selCurso.value,
      titulo: selCurso.label,
      ativo: 1,
    };

    setForm((prev) => ({
      ...prev,
      cursos: [...prev.cursos, novoCurso],
    }));

    setSelCurso(null);
  };

  const handleRemoverCurso = async (idCurso: number) => {
    const confirm = await Swal.fire({
      title: "Remover curso?",
      text: "Esta ação irá desvincular o curso da empresa (e de tudo que herda dela). Deseja continuar?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim, remover",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#d33",
      reverseButtons: true,
    });

    if (confirm.isConfirmed) {
      setForm((prev) => ({
        ...prev,
        cursos: prev.cursos.filter((c) => c.idCurso !== idCurso),
      }));
      toast.success("Curso removido com sucesso!");
    }
  };

  // Medidas
  const handleAdicionarMedidaSelecionada = () => {
    if (!selMedida) return;

    const jaExiste = form.medidas.some((m) => m.idMedida === selMedida.value);
    if (jaExiste) {
      toast.error("Medida já vinculada");
      return;
    }

    const novaMedida: MedidaVincRow = {
      idMedida: selMedida.value,
      nome: selMedida.label,
      ativo: 1,
    };

    setForm((prev) => ({
      ...prev,
      medidas: [...prev.medidas, novaMedida],
    }));

    setSelMedida(null);
  };

  const handleRemoverMedida = async (idMedida: number) => {
    const confirm = await Swal.fire({
      title: "Remover medida?",
      text: "Esta ação irá desvincular a medida da empresa (e de tudo que herda dela). Deseja continuar?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim, remover",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#d33",
      reverseButtons: true,
    });

    if (confirm.isConfirmed) {
      setForm((prev) => ({
        ...prev,
        medidas: prev.medidas.filter((m) => m.idMedida !== idMedida),
      }));
      toast.success("Medida removida com sucesso!");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Abas */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {["dados", "cursos", "medidas"].map((aba) => (
            <button
              key={aba}
              type="button"
              onClick={() => setAbaSelecionada(aba)}
              className={`py-2 px-4 border-b-2 font-medium text-sm cursor-pointer ${abaSelecionada === aba
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              {aba === "dados" && "Dados"}
              {aba === "cursos" && "Cursos"}
              {aba === "medidas" && "Medidas"}
            </button>
          ))}
        </nav>
      </div>

      {abaSelecionada === "dados" && (
        <div className="space-y-4">
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
        </div>
      )}

      {abaSelecionada === "cursos" && (
        <div>
          <div className="grid grid-cols-12 gap-4 items-end mb-4">
            <div className="col-span-11">
              <SearchableSelect
                label="Cursos"
                name="curso"
                placeholder="Pesquisar cursos ..."
                value={selCurso?.value ?? ""}
                onChange={(idCurso) => {
                  const cursoObj = cursosOptions?.find((opt) => opt.value === idCurso) ?? null;
                  setSelCurso(cursoObj);
                }}
                options={(cursosOptions ?? []).filter((opt) => !form.cursos.some((c) => c.idCurso === opt.value))}
              />
            </div>
            <div className="col-span-1">
              <button
                type="button"
                onClick={handleAdicionarCursoSelecionado}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 w-full cursor-pointer"
              >
                <Plus size={20} className="inline" />
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Cursos da Empresa</h4>
            <ul className="space-y-2">
              {form.cursos.length === 0 && (
                <li className="text-gray-400 italic">Nenhum curso vinculado</li>
              )}
              {form.cursos.map((curso) => (
                <li key={curso.idCurso} className="flex justify-between items-center border border-gray-300 bg-gray-50 px-4 py-2 rounded">
                  <div>
                    <span className="text-xs text-white bg-green-500 px-2 py-0.5 rounded-full">Empresa</span>
                    <p className="font-medium">{curso.titulo}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoverCurso(curso.idCurso)}
                    className="text-red-600 hover:text-red-800 cursor-pointer"
                  >
                    <Trash2 size={18} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Cursos vinculados aqui ficam disponíveis para todas as unidades, setores, cargos e funcionários desta empresa.
          </p>
        </div>
      )}

      {abaSelecionada === "medidas" && (
        <div>
          <div className="grid grid-cols-12 gap-4 items-end mb-4">
            <div className="col-span-11">
              <SearchableSelect
                label="Medidas"
                name="medida"
                placeholder="Pesquisar medidas ..."
                value={selMedida?.value ?? ""}
                onChange={(idMedida) => {
                  const medidaObj = medidasOptions?.find((opt) => opt.value === idMedida) ?? null;
                  setSelMedida(medidaObj);
                }}
                options={(medidasOptions ?? []).filter((opt) => !form.medidas.some((m) => m.idMedida === opt.value))}
              />
            </div>
            <div className="col-span-1">
              <button
                type="button"
                onClick={handleAdicionarMedidaSelecionada}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 w-full cursor-pointer"
              >
                <Plus size={20} className="inline" />
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Medidas da Empresa</h4>
            <ul className="space-y-2">
              {form.medidas.length === 0 && (
                <li className="text-gray-400 italic">Nenhuma medida vinculada</li>
              )}
              {form.medidas.map((medida) => (
                <li key={medida.idMedida} className="flex justify-between items-center border border-gray-300 bg-gray-50 px-4 py-2 rounded">
                  <div>
                    <span className="text-xs text-white bg-green-500 px-2 py-0.5 rounded-full">Empresa</span>
                    <p className="font-medium">{medida.nome}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoverMedida(medida.idMedida)}
                    className="text-red-600 hover:text-red-800 cursor-pointer"
                  >
                    <Trash2 size={18} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Medidas vinculadas aqui ficam disponíveis para todas as unidades, setores, cargos e funcionários desta empresa.
          </p>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-400" disabled={loading}>
          {loading ? <Spinner /> : "Salvar"}
        </button>
      </div>
    </form>
  );
}
