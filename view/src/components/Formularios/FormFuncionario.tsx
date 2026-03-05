import { useEffect, useState } from "react";
import type { Funcionario } from "../../types/EstruturaEmpresa";
import { Input, SelectInput, SelectMultiInput } from "./Inputs";
import toast from "react-hot-toast";
import { formatarCPF, formatarTelefone } from "../../auxiliares/formatters";
import Spinner from "../Spinner";

const API_URL = import.meta.env.VITE_API_URL;

interface FormFuncionarioProps {
  initialData?: Partial<Funcionario>;
  onEdit?: Funcionario;
  setIsOpenFuncionario: (isOpen: boolean) => void;
  fetchFuncionarios: () => void;
  fkCargoId?: number;
  fkEmpresaId?: number;
  isOpen: boolean;
  cursosOptions?: { label: string; value: number }[];
  medidasOptions?: { label: string; value: number }[];
}

type CursoVincRow = {
  idCursoAcesso?: number;
  idCurso: number;
  titulo: string;
  ativo: 0 | 1;
  origem: "EMPRESA" | "UNIDADE" | "SETOR" | "CARGO" | "FUNCIONARIO";
};

type MedidaVincRow = {
  idMedidaVinculo?: number;
  idMedida: number;
  nome: string;
  ativo: 0 | 1;
  origem: "EMPRESA" | "UNIDADE" | "SETOR" | "CARGO" | "FUNCIONARIO";
};

export default function FormFuncionario({ initialData = {}, onEdit, setIsOpenFuncionario, fetchFuncionarios, fkCargoId, isOpen, fkEmpresaId }: FormFuncionarioProps) {

  const diasSemana = ["Domingo", "Segunda-Feira", "Terça-Feira", "Quarta-Feira", "Quinta-Feira", "Sexta-Feira", "Sábado"];

  const abas = [
    { id: "dados", label: "Dados" },
    { id: "horarios", label: "Horários" },
    { id: "cursos", label: "Cursos" },
    { id: "medidas", label: "Medidas" },
  ];
  const [abaAtiva, setAbaAtiva] = useState<"dados" | "horarios" | "cursos" | "medidas">("dados");

  const [form, setForm] = useState<{
    nome: string;
    cpf: string;
    telefone?: string;
    email: string;
    senha: string;
    ativo: number;
    fkCargoId: number;
    roles: number[];
    cursos: CursoVincRow[];
    medidas: MedidaVincRow[];
    exigirTrocaSenha: boolean;
    exigirAssinatura: boolean;
  }>({
    nome: initialData.nome || "",
    cpf: initialData.cpf || "",
    telefone: initialData.telefone || "",
    email: initialData.email || "",
    senha: initialData.senha || "",
    ativo: initialData.ativo ?? 1,
    fkCargoId: fkCargoId ?? 0,
    roles: (initialData as any)?.roles || [],
    cursos: [],
    medidas: [],
    exigirTrocaSenha: true,
    exigirAssinatura: true,
  });

  const [horarios, setHorarios] = useState(
    Array.from({ length: 7 }, (_, i) => ({
      diaSemana: i,
      horarioInicio: "",
      horarioFim: "",
    }))
  );

  const [rolesDisponiveis, setRolesDisponiveis] = useState<{ idRole: number; nome: string }[]>([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (onEdit && rolesDisponiveis.length > 0) {
      setForm((prev) => ({
        ...prev,
        nome: onEdit.nome || "",
        cpf: onEdit.cpf || "",
        telefone: onEdit.telefone || "",
        email: onEdit.email || "",
        senha: "",
        ativo: onEdit.ativo ?? 1,
        fkCargoId: onEdit.fkCargoId ?? 0,
        roles: onEdit.roles.map((r) => r.idRole),
        cursos: (onEdit.cursos ?? []).map((curso: any) => ({
          idCursoAcesso: curso.idCursoAcesso,
          idCurso: curso.idCurso,
          titulo: curso.titulo,
          ativo: curso.ativo,
          origem: curso.origem ?? "FUNCIONARIO",
        })),
        medidas: (onEdit.medidas ?? []).map((medida: any) => ({
          idMedidaVinculo: medida.idMedidaVinculo,
          idMedida: medida.idMedida,
          nome: medida.nome,
          ativo: medida.ativo,
          origem: medida.origem ?? "FUNCIONARIO",
        })),
      }));

      if (onEdit.usuarioHorario?.length) {
        const base = Array.from({ length: 7 }, (_, i) => ({
          diaSemana: i,
          horarioInicio: "",
          horarioFim: "",
        }));

        onEdit.usuarioHorario.forEach((h) => {
          const index = base.findIndex((d) => d.diaSemana === Number(h.diaSemana));
          if (index !== -1) {
            base[index].horarioInicio = h.horarioInicio;
            base[index].horarioFim = h.horarioFim;
          }
        });

        setHorarios(base);
      }

    }
  }, [onEdit, rolesDisponiveis]);


  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/usuario/roles`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const rolesFiltradas = data.filter((role: any) => role.nome.toLowerCase() !== "admin");
        setRolesDisponiveis(rolesFiltradas);
      } catch (err) {
        console.error("Erro ao buscar roles:", err);
      }
    };

    if (isOpen) fetchRoles();
  }, [isOpen]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const temHorarioSelecionado = horarios.some(
      (h) => h.horarioInicio && h.horarioFim
    );

    if (!temHorarioSelecionado) {
      toast.error("Selecione pelo menos um horário de acesso antes de salvar.");
      setAbaAtiva("horarios");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Token de autenticação não encontrado.");
      }

      const payload = onEdit
        ? {
          nome: form.nome,
          cpf: form.cpf.replace(/\D/g, ""),
          telefone: form.telefone?.replace(/\D/g, ""),
          ativo: Number(form.ativo),
          fkCargoId: form.fkCargoId,
          fkEmpresaId: fkEmpresaId,
          roles: form.roles,
          horarios: horarios,
          cursos: form.cursos.filter((c) => c.origem === "FUNCIONARIO"),
          medidas: form.medidas.filter((m) => m.origem === "FUNCIONARIO"),
          ajustesObrigatorios: {
            trocarsenha: form.exigirTrocaSenha ? 1 : 0,
            assinatura: form.exigirAssinatura ? 0 : 1,
          },
        }
        : {
          ...form,
          cpf: form.cpf.replace(/\D/g, ""),
          telefone: form.telefone?.replace(/\D/g, ""),
          horarios: horarios,
          fkEmpresaId: fkEmpresaId,
          cursos: form.cursos.filter((c) => c.origem === "FUNCIONARIO"),
          medidas: form.medidas.filter((m) => m.origem === "FUNCIONARIO"),
        };

      const response = await fetch(`${API_URL}/usuario${onEdit ? `/${onEdit?.idUsuario}` : ""}`, {
        method: onEdit ? "PUT" : "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar funcionario");
      }

      toast.success("Funcionário salvo com sucesso!");
      setIsOpenFuncionario(false);
      handleClear();
      fetchFuncionarios();
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
      cpf: "",
      telefone: "",
      email: "",
      senha: "",
      ativo: 1,
      fkCargoId: fkCargoId ?? 0,
      roles: [],
      cursos: [],
      medidas: [],
      exigirTrocaSenha: true,
      exigirAssinatura: true,
    });

    setHorarios(
      Array.from({ length: 7 }, (_, i) => ({
        diaSemana: i,
        horarioInicio: "",
        horarioFim: "",
      }))
    );
  };

  return (
    <>
      <div className="flex gap-4 mb-4 border-b border-gray-200">
        {abas.map((aba) => (
          <button
            key={aba.id}
            type="button"
            onClick={() => setAbaAtiva(aba.id as "dados" | "horarios" | "cursos" | "medidas")}
            className={`px-4 py-2 font-semibold cursor-pointer ${abaAtiva === aba.id
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500"
              }`}
          >
            {aba.label}
          </button>
        ))}
      </div>


      <form onSubmit={handleSubmit} className="space-y-4">
        {abaAtiva === "dados" && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Nome" name="nome" value={form.nome} onChange={handleChange} />
              <Input label="CPF" name="cpf" value={formatarCPF(form.cpf)} onChange={handleChange} />
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


            <div className={`grid gap-4 ${onEdit ? "grid-cols-2" : "md:grid-cols-3"}`}>
              <Input label="Email" name="email" value={form.email} onChange={handleChange} disable={!!onEdit} />
              {!onEdit && (
                <Input label="Senha" type="password" name="senha" value={form.senha} onChange={handleChange} disable={!!onEdit} />
              )}
              <Input label="Telefone" name="telefone" value={formatarTelefone(form.telefone || "")} onChange={handleChange} required={false} />
            </div>
            <SelectMultiInput<number>
              label="Funções"
              name="roles"
              value={form.roles}
              onChange={(selected) => setForm((prev) => ({ ...prev, roles: selected }))}
              options={rolesDisponiveis.map((r) => ({
                value: r.idRole,
                label: r.nome.toLowerCase() === "responsaveltecnico" ? "Responsável Técnico" : r.nome.charAt(0).toUpperCase() + r.nome.slice(1).toLowerCase(),
              }))}
              placeholder="Selecione as funções"
              required
            />

            {!onEdit && (
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.exigirTrocaSenha}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, exigirTrocaSenha: e.target.checked }))
                    }
                  />
                  Exigir troca de senha no primeiro acesso
                </label>

                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.exigirAssinatura}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, exigirAssinatura: e.target.checked }))
                    }
                  />
                  Exigir assinatura no primeiro acesso
                </label>
              </div>
            )}
          </>
        )}

        {abaAtiva === "horarios" && (
          <>
            <h3 className="font-semibold mt-6 mb-2">Horários de Acesso</h3>
            <div className="overflow-x-auto rounded">
              <table className="w-full text-sm text-left border border-gray-200 rounded">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="px-3 py-2">Dia</th>
                    <th className="px-3 py-2 text-center">Permitir</th>
                    <th className="px-3 py-2 text-center">Início</th>
                    <th className="px-3 py-2 text-center">Fim</th>
                  </tr>
                </thead>
                <tbody>
                  {horarios.map((h, i) => {
                    const isAtivo = !!h.horarioInicio || !!h.horarioFim;

                    return (
                      <tr key={i} className="border-t border-gray-200">
                        <td className="px-3 py-2">{diasSemana[h.diaSemana]}</td>
                        <td className="text-center">
                          <input
                            type="checkbox"
                            className="cursor-pointer"
                            checked={isAtivo}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setHorarios((prev) => {
                                const copy = [...prev];
                                if (!checked) {
                                  copy[i].horarioInicio = "";
                                  copy[i].horarioFim = "";
                                } else {
                                  copy[i].horarioInicio = "00:01";
                                  copy[i].horarioFim = "23:59";
                                }
                                return copy;
                              });
                            }}
                          />
                        </td>
                        <td className="text-center">
                          <input
                            type="time"
                            value={h.horarioInicio}
                            onChange={(e) =>
                              setHorarios((prev) => {
                                const copy = [...prev];
                                copy[i].horarioInicio = e.target.value;
                                return copy;
                              })
                            }
                            disabled={!isAtivo}
                            className={`border border-gray-300 rounded px-2 py-1 disabled:cursor-not-allowed disabled:bg-gray-200`}
                          />
                        </td>
                        <td className="text-center">
                          <input
                            type="time"
                            value={h.horarioFim}
                            onChange={(e) =>
                              setHorarios((prev) => {
                                const copy = [...prev];
                                copy[i].horarioFim = e.target.value;
                                return copy;
                              })
                            }
                            disabled={!isAtivo}
                            className={`border border-gray-300 rounded px-2 py-1 disabled:cursor-not-allowed disabled:bg-gray-200`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* {abaAtiva === "cursos" && (
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

            <div>
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2">Cursos do Funcionario</h4>
                <ul className="space-y-2">
                  {cursosFuncionario.length === 0 && (
                    <li className="text-gray-400 italic">Nenhum curso vinculado diretamente ao funcionario</li>
                  )}
                  {cursosFuncionario.map((curso: any) => (
                    <li key={curso.idCurso} className="flex justify-between items-center border border-gray-300 bg-gray-50 px-4 py-2 rounded">
                      <div>
                        <span className="text-xs text-white bg-red-500 px-2 py-0.5 rounded-full">Funcionario</span>
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

              <div>
                <h4 className="text-sm font-semibold mb-2">Outros Cursos (herdados)</h4>
                <ul className="space-y-2">
                  {outrosCursos.length === 0 && (
                    <li className="text-gray-400 italic">Nenhum curso herdado</li>
                  )}
                  {outrosCursos.map((curso: any) => (
                    <li key={curso.idCurso} className="flex justify-between items-center border border-gray-300 bg-gray-50 px-4 py-2 rounded">
                      <div>
                        {curso.origem === "CARGO" && (
                          <span className="text-xs text-white bg-indigo-500 px-2 py-0.5 rounded-full">Cargo</span>
                        )}
                        {curso.origem === "SETOR" && (
                          <span className="text-xs text-white bg-yellow-500 px-2 py-0.5 rounded-full">Setor</span>
                        )}
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

        {abaAtiva === "medidas" && (
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


            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2">Medidas do Funcionario</h4>
              <ul className="space-y-2">
                {medidasFuncionario.length === 0 && (
                  <li className="text-gray-400 italic">Nenhuma medida vinculada diretamente ao funcionario</li>
                )}
                {medidasFuncionario.map((medida: any) => (
                  <li key={medida.idMedida} className="flex justify-between items-center border border-gray-300 bg-gray-50 px-4 py-2 rounded">
                    <div>
                      <span className="text-xs text-white bg-red-500 px-2 py-0.5 rounded-full">Funcionario</span>
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

            <div>
              <h4 className="text-sm font-semibold mb-2">Outras Medidas (herdadas)</h4>
              <ul className="space-y-2">
                {outrasMedidas.length === 0 && (
                  <li className="text-gray-400 italic">Nenhuma medida herdada</li>
                )}
                {outrasMedidas.map((medida: any) => (
                  <li key={medida.idMedida} className="flex justify-between items-center border border-gray-300 bg-gray-50 px-4 py-2 rounded">
                    <div>
                      {medida.origem === "CARGO" && (
                        <span className="text-xs text-white bg-indigo-500 px-2 py-0.5 rounded-full">Cargo</span>
                      )}
                      {medida.origem === "SETOR" && (
                        <span className="text-xs text-white bg-yellow-500 px-2 py-0.5 rounded-full">Setor</span>
                      )}
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
        )} */}
        <div className="flex justify-end">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-400" disabled={loading}>
            {loading ? <Spinner /> : "Salvar"}
          </button>
        </div>
      </form>
    </>
  );
}