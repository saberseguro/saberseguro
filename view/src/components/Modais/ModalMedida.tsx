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
  { id: "cursos", label: "Cursos" },
] as const;

type AbaId = typeof abas[number]["id"];

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
  const [aba, setAba] = useState<AbaId>("dados");

  useEffect(() => {
    setMedida(medidaSelecionada ?? makeMedida());
    setAba("dados");
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
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      largura="max-w-7xl"
      titulo={medida.idMedida > 0 ? "Editar Medida" : "Nova Medida"}
    >
      <div className="">
        <nav className="flex gap-2">
          {abas.map((a) => (
            <button
              key={a.id}
              className={`px-5 py-2 text-sm rounded-md cursor-pointer mb-4 bg-gray-100 border border-gray-300 ${
                aba === a.id
                  ? "bg-sky-600 text-white font-medium border-0"
                  : ""
              }`}
              onClick={() => setAba(a.id)}
              type="button"
            >
              {a.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="max-h-[70vh] overflow-auto px-4 py-2 rounded-md">
        {aba === "dados" && (
          <FormMedida
            medida={medida}
            setMedida={setMedida as any}
            onSubmit={handleSubmit}
            saving={saving}
          />
        )}

        {aba === "cursos" && medida.idMedida > 0 && (
          <VinculosMedida idMedida={medida.idMedida} />
        )}

        {aba === "cursos" && medida.idMedida <= 0 && (
          <div className="text-sm text-gray-600">
            Salve a medida primeiro para liberar os vínculos de cursos.
          </div>
        )}
      </div>
    </ModalBase>
  );
}