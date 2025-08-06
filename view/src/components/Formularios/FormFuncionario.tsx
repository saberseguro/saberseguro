import { useEffect, useState } from "react";
import type { Funcionario } from "../../types/EstruturaEmpresa";
import { Input, SelectInput, SelectMultiInput } from "./Inputs";
import toast from "react-hot-toast";
import { formatarCPF } from "../../auxiliares/formatters";
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
}

export default function FormFuncionario({ initialData = {}, onEdit, setIsOpenFuncionario, fetchFuncionarios, fkCargoId, isOpen, fkEmpresaId }: FormFuncionarioProps) {

  const diasSemana = ["Domingo", "Segunda-Feira", "Terça-Feira", "Quarta-Feira", "Quinta-Feira", "Sexta-Feira", "Sábado"];

  const abas = [
    { id: "dados", label: "Dados" },
    { id: "horarios", label: "Horários" },
  ];
  const [abaAtiva, setAbaAtiva] = useState<"dados" | "horarios">("dados");

  const [form, setForm] = useState({
    nome: initialData.nome || "",
    cpf: initialData.cpf || "",
    email: initialData.email || "",
    senha: initialData.senha || "",
    ativo: initialData.ativo ?? 1,
    fkCargoId: fkCargoId ?? 0,
    roles: (initialData as any)?.roles || [],
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
        email: onEdit.email || "",
        senha: "",
        ativo: onEdit.ativo ?? 1,
        fkCargoId: onEdit.fkCargoId ?? 0,
        roles: onEdit.roles.map((r) => r.idRole),
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
          ativo: Number(form.ativo),
          fkCargoId: form.fkCargoId,
          fkEmpresaId: fkEmpresaId,
          roles: form.roles,
          horarios: horarios,
        }
        : {
          ...form,
          cpf: form.cpf.replace(/\D/g, ""),
          horarios: horarios,
          fkEmpresaId: fkEmpresaId,
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
      email: "",
      senha: "",
      ativo: 1,
      fkCargoId: fkCargoId ?? 0,
      roles: [],
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
            onClick={() => setAbaAtiva(aba.id as "dados" | "horarios")}
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
                                  copy[i].horarioInicio = "08:00";
                                  copy[i].horarioFim = "18:00";
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
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-400" disabled={loading}>
            {loading ? <Spinner /> : "Salvar"}
          </button>
        </div>
      </form>
    </>
  );
}