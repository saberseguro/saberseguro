import { useEffect, useState } from "react";
import type { Funcionario } from "../../types/EstruturaEmpresa";
import { Input, SelectInput, SelectMultiInput } from "./Inputs";
import toast from "react-hot-toast";

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

  const [form, setForm] = useState({
    nome: initialData.nome || "",
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

  useEffect(() => {
    if (onEdit && rolesDisponiveis.length > 0) {
      setForm((prev) => ({
        ...prev,
        nome: onEdit.nome || "",
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
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Token de autenticação não encontrado.");
      }

      const payload = onEdit
        ? {
          nome: form.nome,
          ativo: Number(form.ativo),
          fkCargoId: form.fkCargoId,
          fkEmpresaId: fkEmpresaId,
          roles: form.roles,
          horarios: horarios,
        }
        : {
          ...form,
          horarios: horarios,
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
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao salvar");
    }
  };

  const handleClear = () => {
    setForm({
      nome: "",
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
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
        <SelectMultiInput<number>
          label="Funções (roles)"
          name="roles"
          value={form.roles}
          onChange={(selected) => setForm((prev) => ({ ...prev, roles: selected }))}
          options={rolesDisponiveis.map((r) => ({
            value: r.idRole,
            label: r.nome.charAt(0).toUpperCase() + r.nome.slice(1).toLowerCase(),
          }))}
          placeholder="Selecione as funções"
          required
        />
      </div>

      <div className={`grid gap-4 ${onEdit ? "grid-cols-1" : "grid-cols-2"}`}>
        <Input label="Email" name="email" value={form.email} onChange={handleChange} disable={!!onEdit} />
        {!onEdit && <Input label="Senha" type="password" name="senha" value={form.senha} onChange={handleChange} disable={!!onEdit} />}
      </div>

      <h3 className="font-semibold mt-6 mb-2">Horários de Acesso</h3>
      <div className="grid grid-cols-2 gap-4">
        {horarios.map((h, i) => (
          <div key={i} className="grid grid-cols-3 gap-2 items-center">
            <label className="col-span-1 capitalize">{diasSemana[h.diaSemana]}</label>
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
              className="col-span-1 border rounded px-2 py-1"
            />
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
              className="col-span-1 border rounded px-2 py-1"
            />
          </div>
        ))}
      </div>


      <div className="flex justify-end">
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Salvar
        </button>
      </div>
    </form>
  );
}