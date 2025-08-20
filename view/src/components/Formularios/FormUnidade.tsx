import { useEffect, useState } from "react";
import type { Unidade } from "../../types/EstruturaEmpresa";
import { Input, SearchableSelect, SelectInput } from "./Inputs";
import toast from "react-hot-toast";
import Spinner from "../Spinner";
import { Plus, Trash2 } from "lucide-react";


const API_URL = import.meta.env.VITE_API_URL;

interface FormUnidadeProps {
  initialData?: Partial<Unidade>;
  onEdit?: Unidade;
  fkEmpresaId?: number;
  setIsOpenUnidade: (isOpen: boolean) => void;
  fetchUnidades: () => void;
  cursosOptions?: { label: string; value: number }[];
  medidasOptions?: { label: string; value: number }[];
}

type CursoVincRow = {
  idCursoAcesso?: number;
  idCurso: number;
  titulo: string;
  ativo: 0 | 1;
  origem: "EMPRESA" | "UNIDADE";
};

type MedidaVincRow = {
  idMedidaVinculo?: number;
  idMedida: number;
  nome: string;
  ativo: 0 | 1;
  origem: "EMPRESA" | "UNIDADE";
};

export default function FormUnidade({
  initialData = {},
  onEdit,
  fkEmpresaId,
  setIsOpenUnidade,
  fetchUnidades,
  cursosOptions,
  medidasOptions,
}: FormUnidadeProps) {
  const [loading, setLoading] = useState(false);
  const [abaSelecionada, setAbaSelecionada] = useState("dados");

  const [selCurso, setSelCurso] = useState<{ label: string; value: number } | null>(null);
  const [selMedida, setSelMedida] = useState<{ label: string; value: number } | null>(null);

  const [form, setForm] = useState<{
    nomeFantasia: string;
    razaoSocial: string;
    tipoDocumento: string;
    documento: string;
    cep: string;
    endereco: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
    telefone: string;
    ativo: number;
    fkEmpresaId: number;
    cursos: CursoVincRow[];
    medidas: MedidaVincRow[];
  }>({
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
    telefone: initialData.telefone || "",
    ativo: initialData.ativo ?? 1,
    fkEmpresaId: fkEmpresaId ?? 0,
    cursos: [],
    medidas: [],
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
        telefone: onEdit.telefone || "",
        ativo: onEdit.ativo ?? 1,
        fkEmpresaId: fkEmpresaId ?? 0,
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
  }, [onEdit]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token de autenticação não encontrado.");

      const response = await fetch(
        `${API_URL}/unidade${onEdit ? `/${onEdit.idUnidade}` : ""}`,
        {
          method: onEdit ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            cursos: form.cursos.filter((c) => c.origem === "UNIDADE"),
            medidas: form.medidas.filter((m) => m.origem === "UNIDADE"),
          }),
        }
      );

      if (!response.ok) throw new Error("Erro ao salvar unidade");

      toast.success("Unidade salva com sucesso!");
      setIsOpenUnidade(false);
      handleClear();
      fetchUnidades();
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
      telefone: "",
      ativo: 1,
      fkEmpresaId: fkEmpresaId ?? 0,
      cursos: [],
      medidas: [],
    });
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
      origem: "UNIDADE",
    };

    setForm((prev) => ({
      ...prev,
      cursos: [...prev.cursos, novoCurso],
    }));

    setSelCurso(null);
  };

  const handleRemoverCurso = (idCurso: number) => {
    setForm((prev) => ({
      ...prev,
      cursos: prev.cursos.filter((c: any) => c.idCurso !== idCurso),
    }));
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
      origem: "UNIDADE",
    };

    setForm((prev) => ({
      ...prev,
      medidas: [...prev.medidas, novaMedida],
    }));

    setSelMedida(null);
  };

  const handleRemoverMedida = (idMedida: number) => {
    setForm((prev) => ({
      ...prev,
      medidas: prev.medidas.filter((m: any) => m.idMedida !== idMedida),
    }));
  };

  // Listas
  const cursosUnidade = form.cursos.filter((c) => c.origem === "UNIDADE");
  const cursosEmpresa = form.cursos.filter((c) => c.origem === "EMPRESA");
  const medidasUnidade = form.medidas.filter((m) => m.origem === "UNIDADE");
  const medidasEmpresa = form.medidas.filter((m) => m.origem === "EMPRESA");


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

      {/* Conteúdo da aba selecionada */}
      {abaSelecionada === "dados" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Nome Fantasia"
              name="nomeFantasia"
              value={form.nomeFantasia}
              onChange={handleChange}
            />
            <Input
              label="Razão Social"
              name="razaoSocial"
              value={form.razaoSocial}
              onChange={handleChange}
            />
            <SelectInput
              label="Status"
              name="ativo"
              value={String(form.ativo)}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, ativo: Number(e.target.value) }))
              }
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
            <Input
              label="Documento"
              name="documento"
              value={form.documento}
              onChange={handleChange}
            />
            <Input
              label="CEP"
              name="cep"
              value={form.cep}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <Input
              label="Endereço"
              name="endereco"
              value={form.endereco}
              onChange={handleChange}
            />
            <Input
              label="Número"
              name="numero"
              value={form.numero}
              onChange={handleChange}
            />
            <Input
              label="Complemento"
              name="complemento"
              value={form.complemento}
              onChange={handleChange}
              required={false}
            />
            <Input
              label="Bairro"
              name="bairro"
              value={form.bairro}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Cidade"
              name="cidade"
              value={form.cidade}
              onChange={handleChange}
            />
            <Input
              label="UF"
              name="uf"
              value={form.uf}
              onChange={handleChange}
              maxLength={2}
            />
            <Input
              label="Telefone"
              name="telefone"
              value={form.telefone}
              onChange={handleChange}
              required={false}
            />
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
                options={(cursosOptions ?? []).filter((opt) => !form.cursos.find((c: any) => c.idCurso === opt.value))}
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
            {/* Cursos da Unidade */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2">Cursos da Unidade</h4>
              <ul className="space-y-2">
                {cursosUnidade.length === 0 && (
                  <li className="text-gray-400 italic">Nenhum curso vinculado diretamente</li>
                )}
                {cursosUnidade.map((curso: any) => (
                  <li key={curso.idCurso} className="flex justify-between items-center border border-gray-300 bg-gray-50 px-4 py-2 rounded">
                    <div>
                      <span className="text-xs text-white bg-blue-500 px-2 py-0.5 rounded-full">Unidade</span>
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

            {/* Cursos da Empresa */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Cursos Herdados da Empresa</h4>
              <ul className="space-y-2">
                {cursosEmpresa.length === 0 && (
                  <li className="text-gray-400 italic">Nenhum curso herdado</li>
                )}
                {cursosEmpresa.map((curso: any) => (
                  <li key={curso.idCurso} className="flex justify-between items-center border border-gray-300 bg-gray-50 px-4 py-2 rounded">
                    <div>
                      <span className="text-xs text-white bg-green-500 px-2 py-0.5 rounded-full">Empresa</span>
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
                options={(medidasOptions ?? []).filter((opt) => !form.medidas.some((med) => med.idMedida === opt.value))}
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
          {/* Medidas da Unidade */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2">Medidas da Unidade</h4>
            <ul className="space-y-2">
              {medidasUnidade.length === 0 && (
                <li className="text-gray-400 italic">Nenhuma medida vinculada diretamente</li>
              )}
              {medidasUnidade.map((medida: any) => (
                <li key={medida.idMedida} className="flex justify-between items-center border border-gray-300 bg-gray-50 px-4 py-2 rounded">
                  <div>
                    <span className="text-xs text-white bg-blue-500 px-2 py-0.5 rounded-full">Unidade</span>
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

          {/* Medidas da Empresa */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Medidas Herdadas da Empresa</h4>
            <ul className="space-y-2">
              {medidasEmpresa.length === 0 && (
                <li className="text-gray-400 italic">Nenhuma medida herdada</li>
              )}
              {medidasEmpresa.map((medida: any) => (
                <li key={medida.idMedida} className="flex justify-between items-center border border-gray-300 bg-gray-50 px-4 py-2 rounded">
                  <div>
                    <span className="text-xs text-white bg-green-500 px-2 py-0.5 rounded-full">Empresa</span>
                    <p className="font-medium">{medida.nome}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-400"
          disabled={loading}
        >
          {loading ? <Spinner /> : "Salvar"}
        </button>
      </div>
    </form>
  );
}