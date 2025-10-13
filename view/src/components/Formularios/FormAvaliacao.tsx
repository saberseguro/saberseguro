// components/Formularios/FormAvaliacao.tsx
import type { Avaliacao, Pergunta } from "../../types/EstruturaCurso";
import { Input, SelectInput } from "./Inputs";
import ToolTip from "../Auxiliares/ToolTip";
import { Trash2 } from "lucide-react";
import FormPerguntasDetalhes from "./FormPerguntaDetalhes";

interface Props {
  avaliacao: Avaliacao;
  onChange: (patch: Partial<Avaliacao>) => void;
  onRemove?: () => void;
  compact?: boolean;
}

export default function FormAvaliacao({ avaliacao, onChange, onRemove, compact }: Props) {
  const perguntas: Pergunta[] = avaliacao.perguntas ?? [];

  return (
    <div className="border border-gray-200 rounded-md bg-white">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between p-3 border-b border-gray-300">
        <div className="flex-1 grid gap-2 md:grid-cols-4">
          <Input
            label="Título"
            name="titulo"
            value={avaliacao.titulo ?? ""}
            onChange={(e) => onChange({ titulo: e.target.value })}
          />
          <Input
            label="Tempo limite (min)"
            name="tempoLimite"
            type="number"
            value={Number.isFinite(avaliacao.tempo_limite) ? String(avaliacao.tempo_limite) : "0"}
            onChange={(e) => onChange({ tempo_limite: Number(e.target.value) || 0 })}
          />
          <SelectInput
            label="Aplicação"
            name="tipoAplicacao"
            value={avaliacao.tipoAplicacao ?? ""}
            onChange={(e) => onChange({ tipoAplicacao: e.target.value })}
            options={[{ value: "quiz", label: "Quiz" }, { value: "avaliacao", label: "Avaliação" }]}
          />
          <SelectInput
            label="Ativo"
            name="ativo"
            value={String(avaliacao.ativo ?? 1)}
            onChange={(e) => onChange({ ativo: Number(e.target.value) })}
            options={[
              { value: "1", label: "Sim" },
              { value: "0", label: "Não" },
            ]}
          />
        </div>
        <div className="mt-4">
          {onRemove && (
            <ToolTip text="Excluir avaliação">
              <button onClick={onRemove} className="ml-2 text-red-600 hover:text-red-700 cursor-pointer">
                <Trash2 size={18} />
              </button>
            </ToolTip>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      {!compact && (
        <div className="p-3 space-y-3">
          <FormPerguntasDetalhes
            perguntas={perguntas}
            onChange={(novas) => onChange({ perguntas: novas })}
          />
        </div>
      )}

    </div>
  );
}
