import { useEffect, useMemo, useState } from "react";
import type { Medida, MedidaTipo } from "../../types/EstruturaMedida";
import { Input, TextArea, SelectInput } from "./Inputs";

interface Props {
  medida: Medida;
  setMedida: (updater: (prev: Medida) => Medida | Medida) => void;
  onSubmit: () => void;
  saving?: boolean;
}

const tipos: { label: string; value: MedidaTipo }[] = [
  { label: "EPI", value: "epi" },
  { label: "EPC", value: "epc" },
  { label: "Administrativa", value: "adm" },
  { label: "Treinamento", value: "treinamento" },
  { label: "Insepção", value: "inspecao" },
  { label: "Geral", value: "geral" },
];

export default function FormMedida({ medida, setMedida, onSubmit, saving }: Props) {
  const [errors, setErrors] = useState<{ nome?: string }>({});

  const handleChange = <K extends keyof Medida>(key: K, value: Medida[K]) => {
    setMedida((prev) => ({ ...(typeof prev === "function" ? (prev as any)() : prev), [key]: value } as Medida));
  };

  const validate = () => {
    const e: typeof errors = {};
    if (!medida.nome?.trim()) e.nome = "Informe o nome da medida";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submitInternal = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit();
  };

  const selectedTipo = useMemo(() => tipos.find((t) => t.value === medida.tipo)?.value ?? "epi", [medida.tipo]);

  useEffect(() => {
    // sanidade do tipo
    if (!tipos.some((t) => t.value === medida.tipo)) {
      handleChange("tipo", "epi");
    }
  }, []);

  return (
    <form className="flex flex-col gap-4" onSubmit={submitInternal}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          name="nome"
          label="Nome"
          value={medida.nome}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("nome", e.target.value)}
          placeholder="Ex.: Protetor Auricular"
        />

        <SelectInput
          label="Tipo"
          name="tipo"
          value={selectedTipo}
          onChange={(e) => handleChange("tipo", e.target.value as MedidaTipo)}
          options={tipos.map((t) => ({ label: t.label, value: t.value }))}
        />

        <SelectInput
          label="Status"
          name="ativo"
          value={String(medida.ativo)}
          onChange={(e) => handleChange("ativo", Number(e.target.value) as 0 | 1)}
          options={[
            { label: "Ativo", value: "1" },
            { label: "Inativo", value: "0" },
          ]}
        />
      </div>

      <TextArea
        name="descricao"
        label="Descrição"
        value={medida.descricao ?? ""}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange("descricao", e.target.value)}
        placeholder="Descreva a medida, instruções de uso, periodicidade, etc."
        rows={4}
      />

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={!!saving}
          className="px-4 py-2 rounded bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-60 cursor-pointer"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}