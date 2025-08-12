import ModalBase from "../Modais/ModalBase";
import { useState, useEffect } from "react";
import type { Medida } from "../../types/EstruturaMedida";
import { makeMedida } from "../../types/FactoriesMedida";
import FormMedida from "../Formularios/FormMedida";
import VinculosMedida from "../Vinculos/VinculosMedida";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (medida: Medida) => void;
  onCreate: (payload: Omit<Medida, "idMedida">) => Promise<Medida>;
  onUpdate: (id: number, payload: Partial<Medida>) => Promise<Medida>;
  medidaSelecionada?: Medida | null;
}

const abas = [
  { id: "dados", label: "Dados" },
  { id: "vinculos", label: "Vínculos" },
];

export default function ModalMedida({
  isOpen,
  onClose,
  onSaved,
  onCreate,
  onUpdate,
  medidaSelecionada,
}: Props) {
  const [medida, setMedida] = useState<Medida>(makeMedida());
  const [saving, setSaving] = useState(false);

  const [aba, setAba] = useState<"dados" | "vinculos">("dados");

  useEffect(() => {
    setMedida(medidaSelecionada ?? makeMedida());
  }, [medidaSelecionada, isOpen]);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      let salvo: Medida;
      if (medida.idMedida > 0) {
        salvo = await onUpdate(medida.idMedida, medida);
      } else {
        const { idMedida, ...payload } = medida;
        salvo = await onCreate(payload as Omit<Medida, "idMedida">);
      }
      onSaved(salvo);
      setMedida(salvo);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} largura="max-w-7xl" titulo={medida.idMedida > 0 ? "Editar Medida" : "Nova Medida"}>
      <div className="">
        <nav className="flex gap-2">
          {abas.map((a) => (
            <button
              key={a.id}
              className={`px-3 py-2 text-sm rounded-t cursor-pointer ${aba === a.id ? "bg-gray-100 border-t border-x border-gray-300 font-medium" : "bg-white border border-gray-200 border-b-0"}`}
              onClick={() => setAba(a.id as any)}
              type="button"
            >
              {a.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="max-h-[70vh] overflow-auto bg-gray-100 border border-gray-300 px-4 py-2 rounded-b-md">
        {aba === "dados" && (
          <FormMedida
            medida={medida}
            setMedida={setMedida as any}
            onSubmit={handleSubmit}
            saving={saving}
          />
        )}

        {aba === "vinculos" && medida.idMedida > 0 && (
          <VinculosMedida idMedida={medida.idMedida} />
        )}

        {aba === "vinculos" && medida.idMedida <= 0 && (
          <div className="text-sm text-gray-600">
            Salve a medida primeiro para liberar os vínculos.
          </div>
        )}
      </div>
    </ModalBase>
  );
}
