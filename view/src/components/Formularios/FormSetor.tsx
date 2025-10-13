import { useEffect, useState } from "react";
import type { Setor } from "../../types/EstruturaEmpresa";
import { Input, SearchableSelect, SelectInput, TextArea } from "./Inputs";
import toast from "react-hot-toast";
import Spinner from "../Spinner";
import { Plus, Trash2 } from "lucide-react";
import Swal from "sweetalert2";

const API_URL = import.meta.env.VITE_API_URL;

interface FormSetorProps {
  initialData?: Partial<Setor>;
  onEdit?: Setor;
  fkUnidadeId?: number;
  setIsOpenSetor: (isOpen: boolean) => void;
  fetchSetores: () => void;
  cursosOptions?: { label: string; value: number }[];
  medidasOptions?: { label: string; value: number }[];
}

type CursoVincRow = {
  idCursoAcesso?: number;
  idCurso: number;
  titulo: string;
  ativo: 0 | 1;
  origem: "EMPRESA" | "UNIDADE" | "SETOR";
};

type MedidaVincRow = {
  idMedidaVinculo?: number;
  idMedida: number;
  nome: string;
  ativo: 0 | 1;
  origem: "EMPRESA" | "UNIDADE" | "SETOR";
};

export default function FormSetor({ initialData = {}, onEdit, fkUnidadeId, setIsOpenSetor, fetchSetores, cursosOptions, medidasOptions }: FormSetorProps) {
  const [abaSelecionada, setAbaSelecionada] = useState("dados");
  const [loading, setLoading] = useState(false);

  const [selCurso, setSelCurso] = useState<{ label: string; value: number } | null>(null);
  const [selMedida, setSelMedida] = useState<{ label: string; value: number } | null>(null);

  const [form, setForm] = useState<{
    nome: string;
    descricao: string;
    ambiente: string;
    ativo: number;
    fkUnidadeId: number;
    cursos: CursoVincRow[];
    medidas: MedidaVincRow[];
  }>({
    nome: initialData.nome || "",
    descricao: initialData.descricao || "",
    ambiente: initialData.ambiente || "",
    ativo: initialData.ativo ?? 1,
    fkUnidadeId: fkUnidadeId ?? 0,
    cursos: [],
    medidas: [],
  });

  useEffect(() => {
    if (onEdit) {
      setForm({
        nome: onEdit.nome || "",
        descricao: onEdit.descricao || "",
        ambiente: onEdit.ambiente || "",
        ativo: onEdit.ativo ?? 1,
        fkUnidadeId: fkUnidadeId ?? 0,
        cursos: (onEdit.cursos ?? []).map((curso: any) => ({
          idCursoAcesso: curso.idCursoAcesso,
          idCurso: curso.idCurso,
          titulo: curso.titulo,
          ativo: curso.ativo,
          origem: curso.origem ?? "UNIDADE",
        })),
        medidas: (onEdit.medidas ?? []).map((medida: any) => ({
          idMedidaVinculo: medida.idMedidaVinculo,
          idMedida: medida.idMedida,
          nome: medida.nome,
          ativo: medida.ativo,
          origem: medida.origem ?? "UNIDADE",
        })),
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

      const response = await fetch(`${API_URL}/setor${onEdit ? `/${onEdit.idSetor}` : ""}`, {
        method: onEdit ? "PUT" : "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...form,
          cursos: form.cursos.filter((c) => c.origem === "SETOR"),
          medidas: form.medidas.filter((m) => m.origem === "SETOR"),
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar setor");
      }

      toast.success("Setor salva com sucesso!");
      setIsOpenSetor(false);
      handleClear();
      fetchSetores();
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
      ambiente: "",
      ativo: 1,
      fkUnidadeId: fkUnidadeId ?? 0,
      cursos: [],
      medidas: [],
    });
  };

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
      origem: "SETOR",
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
      text: "Esta ação irá desvincular o curso do setor. Deseja continuar?",
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
        cursos: prev.cursos.filter((c: any) => c.idCurso !== idCurso),
      }));
      toast.success("Curso removido com sucesso!");
    }
  };

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
      origem: "SETOR",
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
      text: "Esta ação irá desvincular a medida do setor. Deseja continuar?",
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
        medidas: prev.medidas.filter((m: any) => m.idMedida !== idMedida),
      }));
      toast.success("Medida removida com sucesso!");
    }
  };

  // Listas
  const cursosSetor = form.cursos.filter((c) => c.origem === "SETOR");
  const outrosCursos = form.cursos.filter((c) => c.origem !== "SETOR");
  const medidasSetor = form.medidas.filter((m) => m.origem === "SETOR");
  const outrasMedidas = form.medidas.filter((m) => m.origem !== "SETOR");


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
        <>
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

          <div className="grid grid-cols-1 gap-4">
            <TextArea label="Ambiente" name="ambiente" value={form.ambiente} onChange={handleChange} required={false} />
          </div>
        </>
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
                options={
                  (cursosOptions ?? []).filter(
                    (opt) => !form.cursos.some((c) => c.idCurso === opt.value)
                  )
                }
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

          {/* Lista */}
          <div>
            {/* Cursos do Setor */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2">Cursos do Setor</h4>
              <ul className="space-y-2">
                {cursosSetor.length === 0 && (
                  <li className="text-gray-400 italic">Nenhum curso vinculado diretamente ao setor</li>
                )}
                {cursosSetor.map((curso: any) => (
                  <li key={curso.idCurso} className="flex justify-between items-center border border-gray-300 bg-gray-50 px-4 py-2 rounded">
                    <div>
                      <span className="text-xs text-white bg-yellow-500 px-2 py-0.5 rounded-full">Setor</span>
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

            {/* Outros Cursos */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Outros Cursos (herdados)</h4>
              <ul className="space-y-2">
                {outrosCursos.length === 0 && (
                  <li className="text-gray-400 italic">Nenhum curso herdado</li>
                )}
                {outrosCursos.map((curso: any) => (
                  <li key={curso.idCurso} className="flex justify-between items-center border border-gray-300 bg-gray-50 px-4 py-2 rounded">
                    <div>
                      {curso.origem === "UNIDADE" && (
                        <span className="text-xs text-white bg-blue-500 px-2 py-0.5 rounded-full">Unidade</span>
                      )}
                      {curso.origem === "EMPRESA" && (
                        <span className="text-xs text-white bg-green-500 px-2 py-0.5 rounded-full">Empresa</span>
                      )}
                      <p className="font-medium">{curso.titulo}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
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
                options={
                  (medidasOptions ?? []).filter(
                    (opt) => !form.medidas.some((m) => m.idMedida === opt.value)
                  )
                }
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

          {/* Lista */}
          {/* Medidas do Setor */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2">Medidas do Setor</h4>
            <ul className="space-y-2">
              {medidasSetor.length === 0 && (
                <li className="text-gray-400 italic">Nenhuma medida vinculada diretamente ao setor</li>
              )}
              {medidasSetor.map((medida: any) => (
                <li key={medida.idMedida} className="flex justify-between items-center border border-gray-300 bg-gray-50 px-4 py-2 rounded">
                  <div>
                    <span className="text-xs text-white bg-yellow-500 px-2 py-0.5 rounded-full">Setor</span>
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

          {/* Outras Medidas */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Outras Medidas (herdadas)</h4>
            <ul className="space-y-2">
              {outrasMedidas.length === 0 && (
                <li className="text-gray-400 italic">Nenhuma medida herdada</li>
              )}
              {outrasMedidas.map((medida: any) => (
                <li key={medida.idMedida} className="flex justify-between items-center border border-gray-300 bg-gray-50 px-4 py-2 rounded">
                  <div>
                    {medida.origem === "UNIDADE" && (
                      <span className="text-xs text-white bg-blue-500 px-2 py-0.5 rounded-full">Unidade</span>
                    )}
                    {medida.origem === "EMPRESA" && (
                      <span className="text-xs text-white bg-green-500 px-2 py-0.5 rounded-full">Empresa</span>
                    )}
                    <p className="font-medium">{medida.nome}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-400" disabled={loading}>
          {loading ? <Spinner /> : "Salvar"}
        </button>
      </div>
    </form>
  );
}
