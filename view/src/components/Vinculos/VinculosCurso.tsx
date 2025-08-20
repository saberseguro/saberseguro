import { useEffect, useState } from "react";
import {
  getCursoMedidas,
  addCursoMedida,
  removeCursoMedida,
} from "../../services/apiCurso";
import { getMedidas } from "../../services/apiMedida";
import type { MedidaCurso } from "../../types/EstruturaMedida";
import { Input, SearchableSelect } from "../Formularios/Inputs";
import { CircleXIcon, Pencil, Save, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

type Opt = { label: string; value: number };

interface Props {
  idCurso: number;
}

export default function VinculosCurso({ idCurso }: Props) {
  const [medidasVinc, setMedidasVinc] = useState<MedidaCurso[]>([]);
  const [medidasOpts, setMedidasOpts] = useState<Opt[]>([]);
  const [selMedida, setSelMedida] = useState<number | "">("");
  const [validadeNovo, setValidadeNovo] = useState<number | "">("");

  const [editVal, setEditVal] = useState<Record<number, string>>({});
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const reloadVinculos = async () => {
    const medidas = await getCursoMedidas(idCurso);
    setMedidasVinc(medidas);
  };

  useEffect(() => {
    (async () => {
      try {
        const medidas = await getMedidas({ ativo: 1 });
        const opts =
          medidas?.data?.map((m: any) => ({
            label: m.nome,
            value: m.idMedida,
          })) ?? [];
        setMedidasOpts(opts);

        await reloadVinculos();
      } catch (err: any) {
        toast.error("Erro ao carregar medidas.");
      }
    })();
  }, [idCurso]);

  const addMedida = async () => {
    if (!selMedida) return;
    const validade = validadeNovo === "" ? undefined : Number(validadeNovo);

    if (medidasVinc.some((m) => m.fkMedidaId === Number(selMedida))) {
      toast.error("Esta medida já está vinculada!");
      setSelMedida("");
      setValidadeNovo("");
      return;
    }

    const nova = await addCursoMedida(idCurso, Number(selMedida), validade);

    setMedidasVinc((prev) => [nova, ...prev.filter((m) => m.fkMedidaId !== nova.fkMedidaId)]);
    setSelMedida("");
    setValidadeNovo("");
    await reloadVinculos();
  };

  const removerMedida = async (idMedida: number) => {
    await removeCursoMedida(idCurso, idMedida);
    setMedidasVinc((prev) => prev.filter((m) => m.fkMedidaId !== idMedida));
    await reloadVinculos();
  };

  const salvarValidade = async (idMedida: number) => {
    const raw = editVal[idMedida];
    if (raw == null || raw === "" || isNaN(Number(raw))) return;

    const res = await addCursoMedida(idCurso, idMedida, Number(raw));
    setMedidasVinc((prev) =>
      prev.map((m) => (m.fkMedidaId === idMedida ? res : m))
    );
    setEditandoId(null);
    await reloadVinculos();
  };

  return (
    <section className="flex flex-col gap-6">
      <h3 className="text-lg font-semibold">Vincular Medidas</h3>

      <div className="grid grid-cols-1 md:grid-cols-8 gap-2 items-end">
        <div className="md:col-span-6">
          <SearchableSelect
            label="Medida"
            name="medida"
            value={selMedida === "" ? "" : selMedida}
            onChange={(v) => setSelMedida(v === "" ? "" : Number(v))}
            options={medidasOpts}
            allowClear
            emptyOptionLabel="Selecione uma medida"
          />
        </div>

        <div className="md:col-span-1">
          <Input
            label="Validade (meses)"
            name="validade"
            type="number"
            value={validadeNovo === "" ? "" : String(validadeNovo)}
            onChange={(e) =>
              setValidadeNovo(e.target.value === "" ? "" : Number(e.target.value))
            }
            placeholder="ex.: 12"
          />
        </div>

        <div className="md:col-span-1">
          <button
            type="button"
            onClick={addMedida}
            className="px-3 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 disabled:opacity-60 w-full"
            disabled={!selMedida}
          >
            Vincular medida
          </button>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Medidas vinculadas</h4>
        {!medidasVinc.length ? (
          <div className="text-sm text-gray-500">Nenhuma medida vinculada.</div>
        ) : (
          <ul className="space-y-2">
            {medidasVinc.map((m) => {
              const editando = editandoId === m.fkMedidaId;
              return (
                <li
                  key={`${m.fkMedidaId}-${m.fkCursoId}`}
                  className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded border border-gray-200 gap-3"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {m.medida?.nome ?? `Medida #${m.fkMedidaId}`}
                    </div>
                    <div className="text-xs text-gray-600">
                      Validade: {m.validade ?? 0} meses
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {editando ? (
                      <>
                        <Input
                          name={`val-${m.fkMedidaId}`}
                          type="number"
                          value={editVal[m.fkMedidaId] ?? ""}
                          onChange={(e) =>
                            setEditVal((p) => ({ ...p, [m.fkMedidaId]: e.target.value }))
                          }
                          placeholder={String(m.validade ?? 0)}
                        />
                        <button
                          className="px-2 py-1 bg-emerald-600 text-white rounded"
                          onClick={() => salvarValidade(m.fkMedidaId)}
                        >
                          <Save size={14} />
                        </button>
                        <button
                          className="px-2 py-1 bg-gray-500 text-white rounded"
                          onClick={() => setEditandoId(null)}
                        >
                          <CircleXIcon size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="px-2 py-1 bg-blue-600 text-white rounded"
                          onClick={() => {
                            setEditandoId(m.fkMedidaId);
                            setEditVal((p) => ({
                              ...p,
                              [m.fkMedidaId]: String(m.validade ?? ""),
                            }));
                          }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="px-2 py-1 bg-red-600 text-white rounded"
                          onClick={() => removerMedida(m.fkMedidaId)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}