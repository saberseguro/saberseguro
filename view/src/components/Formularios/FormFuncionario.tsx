import { useEffect, useState } from "react";
import type { Cargo, Funcionario } from "../../types/EstruturaEmpresa";
import { Input, SelectInput, SelectMultiInput } from "./Inputs";
import toast from "react-hot-toast";
import { formatarCPF, formatarTelefone } from "../../auxiliares/formatters";
import Spinner from "../Spinner";
import { getCargosPorEmpresa, getFuncionarioDetalhado } from "../../services/apiEmpresa";

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
    // { id: "cursos", label: "Cursos" },
    // { id: "medidas", label: "Medidas" },
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
  });

  const [horarios, setHorarios] = useState(
    Array.from({ length: 7 }, (_, i) => ({
      diaSemana: i,
      horarioInicio: "",
      horarioFim: "",
    }))
  );

  // Horário padrão usado pelo botão "Permitir todos os dias": em vez de
  // sempre aplicar 00:01-23:59 em todos os dias, o usuário define aqui o
  // início/fim desejado e o botão replica esses valores pra semana toda.
  const [horarioPadrao, setHorarioPadrao] = useState({ inicio: "00:01", fim: "23:59" });

  const [rolesDisponiveis, setRolesDisponiveis] = useState<{ idRole: number; nome: string }[]>([]);

  // Quando o formulário é aberto sem um cargo já definido (ex.: a partir da
  // Lista de Funcionários, em vez do drill-down Unidade > Setor > Cargo), o
  // próprio usuário precisa escolher o cargo aqui.
  const mostrarSeletorCargo = !fkCargoId;
  const [cargosDisponiveis, setCargosDisponiveis] = useState<Cargo[]>([]);
  const [loadingCargos, setLoadingCargos] = useState(false);

  const [loading, setLoading] = useState(false);
  const [carregandoDetalhesFuncionario, setCarregandoDetalhesFuncionario] = useState(false);

  // Sempre busca os dados completos do funcionário direto na API, em vez de
  // confiar no objeto "onEdit" que a tela de origem já tinha em mãos: a
  // Lista de Funcionários (visão plana) só carrega um resumo leve, sem
  // roles/horários/cursos/medidas, e usar esse resumo aqui quebrava a tela
  // (roles undefined) e, pior, apagaria as funções e os horários de acesso
  // do funcionário ao salvar.
  useEffect(() => {
    const carregarDetalhes = async () => {
      if (!onEdit?.idUsuario || rolesDisponiveis.length === 0) return;

      setCarregandoDetalhesFuncionario(true);
      try {
        const detalhes = await getFuncionarioDetalhado(onEdit.idUsuario);

        setForm((prev) => ({
          ...prev,
          nome: detalhes.nome || "",
          cpf: detalhes.cpf || "",
          telefone: detalhes.telefone || "",
          email: detalhes.email || "",
          senha: "",
          ativo: detalhes.ativo ?? 1,
          fkCargoId: detalhes.fkCargoId ?? 0,
          roles: (detalhes.roles ?? []).map((r) => r.idRole),
          cursos: (detalhes.cursos ?? []).map((curso: any) => ({
            idCursoAcesso: curso.idCursoAcesso,
            idCurso: curso.idCurso,
            titulo: curso.titulo,
            ativo: curso.ativo,
            origem: curso.origem ?? "FUNCIONARIO",
          })),
          medidas: (detalhes.medidas ?? []).map((medida: any) => ({
            idMedidaVinculo: medida.idMedidaVinculo,
            idMedida: medida.idMedida,
            nome: medida.nome,
            ativo: medida.ativo,
            origem: medida.origem ?? "FUNCIONARIO",
          })),
        }));

        if (detalhes.usuarioHorario?.length) {
          const base = Array.from({ length: 7 }, (_, i) => ({
            diaSemana: i,
            horarioInicio: "",
            horarioFim: "",
          }));

          detalhes.usuarioHorario.forEach((h) => {
            const index = base.findIndex((d) => d.diaSemana === Number(h.diaSemana));
            if (index !== -1) {
              base[index].horarioInicio = h.horarioInicio;
              base[index].horarioFim = h.horarioFim;
            }
          });

          setHorarios(base);
        }
      } catch (err) {
        console.error("Erro ao carregar detalhes do funcionário:", err);
        toast.error("Erro ao carregar os dados do funcionário.");
      } finally {
        setCarregandoDetalhesFuncionario(false);
      }
    };

    carregarDetalhes();
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

  useEffect(() => {
    const fetchCargosDisponiveis = async () => {
      if (!isOpen || !mostrarSeletorCargo || !fkEmpresaId) return;

      setLoadingCargos(true);
      try {
        // Ao editar, busca todos os cargos (inclusive inativos) pra não
        // "sumir" a opção caso o cargo do funcionário tenha sido desativado
        // depois. Ao criar, mostra só cargos ativos.
        const data = await getCargosPorEmpresa(fkEmpresaId, !onEdit);
        setCargosDisponiveis(data);
      } catch (err) {
        console.error("Erro ao buscar cargos da empresa:", err);
        toast.error("Erro ao carregar cargos.");
        setCargosDisponiveis([]);
      } finally {
        setLoadingCargos(false);
      }
    };

    fetchCargosDisponiveis();
  }, [isOpen, mostrarSeletorCargo, fkEmpresaId, onEdit]);


  const todosHorariosAtivos = horarios.every((h) => h.horarioInicio && h.horarioFim);

  const handleTogglePermitirTodosHorarios = () => {
    setHorarios((prev) =>
      prev.map((h) =>
        todosHorariosAtivos
          ? { ...h, horarioInicio: "", horarioFim: "" }
          : { ...h, horarioInicio: horarioPadrao.inicio, horarioFim: horarioPadrao.fim }
      )
    );
  };

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

    if (mostrarSeletorCargo && !form.fkCargoId) {
      toast.error("Selecione o cargo do funcionário.");
      setAbaAtiva("dados");
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

             <div className={`grid gap-4 grid-cols-2`}>
              {mostrarSeletorCargo && (
                <SelectInput
                  label="Cargo"
                  name="fkCargoId"
                  value={form.fkCargoId ? String(form.fkCargoId) : ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, fkCargoId: Number(e.target.value) }))}
                  options={cargosDisponiveis.map((c) => ({
                    value: String(c.idCargo),
                    label: `${c.nome} - ${c.setor?.nome ?? "Sem setor"}`,
                  }))}
                  placeholder={loadingCargos ? "Carregando cargos..." : "Selecione o cargo"}
                  disable={loadingCargos}
                />
              )}

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
            </div>
          </>
        )}

        {abaAtiva === "horarios" && (
          <>
            <div className="flex items-center justify-between mt-6 mb-2 flex-wrap gap-2">
              <h3 className="font-semibold">Horários de Acesso</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="time"
                  value={horarioPadrao.inicio}
                  onChange={(e) => setHorarioPadrao((prev) => ({ ...prev, inicio: e.target.value }))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  title="Horário de início a aplicar em todos os dias"
                />
                <span className="text-gray-400 text-sm">até</span>
                <input
                  type="time"
                  value={horarioPadrao.fim}
                  onChange={(e) => setHorarioPadrao((prev) => ({ ...prev, fim: e.target.value }))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  title="Horário de fim a aplicar em todos os dias"
                />
                <button
                  type="button"
                  onClick={handleTogglePermitirTodosHorarios}
                  className="text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer rounded-md px-3 py-1.5"
                >
                  {todosHorariosAtivos ? "Remover todos os horários" : "Permitir todos os dias"}
                </button>
              </div>
            </div>
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

        <div className="flex justify-end">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-400" disabled={loading || carregandoDetalhesFuncionario}>
            {loading ? <Spinner /> : carregandoDetalhesFuncionario ? "Carregando..." : "Salvar"}
          </button>
        </div>
      </form>
    </>
  );
}