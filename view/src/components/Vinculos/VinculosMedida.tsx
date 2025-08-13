import { useEffect, useState } from "react";
import {
  addMedidaCurso,
  getMedidaCursos,
  removeMedidaCurso,
} from "../../services/apiMedida";
import type { MedidaCurso } from "../../types/EstruturaMedida";
import { Input, SearchableSelect } from "../Formularios/Inputs";
import { getCursos } from "../../services/apiCurso";
import { CircleXIcon, Pencil, Save, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

type Opt = { label: string; value: number };

interface Props {
  idMedida: number;
}

export default function VinculosMedida({ idMedida }: Props) {
  const [cursosVinc, setCursosVinc] = useState<MedidaCurso[]>([]);
  const [cursosOpts, setCursosOpts] = useState<Opt[]>([]);
  const [selCurso, setSelCurso] = useState<number | "">("");
  const [validadeNovo, setValidadeNovo] = useState<number | "">("");
  const [loadingCursos, setLoadingCursos] = useState(false);

  const [editVal, setEditVal] = useState<Record<number, string>>({});
  const [editandoId, setEditandoId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoadingCursos(true);
        const cv = await getMedidaCursos(idMedida);
        setCursosVinc(cv);

        const list = await getCursos({ page: 1 });
        const data = (list as any)?.data ?? list;
        const opts =
          (data ?? []).map((c: any) => ({
            value: c.idCurso,
            label: c.titulo,
          })) ?? [];
        setCursosOpts(opts);
      } finally {
        setLoadingCursos(false);
      }
    })();
  }, [idMedida]);

  const reloadCursosVinc = async () => {
    setLoadingCursos(true);
    try {
      const cv = await getMedidaCursos(idMedida);
      cv.sort((a, b) => (a.curso?.titulo ?? "").localeCompare(b.curso?.titulo ?? ""));
      setCursosVinc(cv);
    } finally {
      setLoadingCursos(false);
    }
  };

  const addCurso = async () => {
    if (!selCurso) return;
    const validade = validadeNovo === "" ? undefined : Number(validadeNovo);
    
    if (cursosVinc.some(cv => cv.fkCursoId === Number(selCurso))) {
      setSelCurso("");
      setValidadeNovo("");
      return toast.error("Este curso já está vinculado à medida! Selecione outro curso.");
    }

    if (!validade) {
      return toast.error("Insira uma validade!");
    }

    const novo = await addMedidaCurso(idMedida, Number(selCurso), validade);

    setCursosVinc((prev) => [
      novo,
      ...prev.filter((p) => !(p.fkCursoId === novo.fkCursoId)),
    ]);

    await reloadCursosVinc();

    setSelCurso("");
    setValidadeNovo("");
  };

  const removerCurso = async (fkCursoId: number) => {
    await removeMedidaCurso(idMedida, fkCursoId);
    setCursosVinc((prev) => prev.filter((x) => x.fkCursoId !== fkCursoId));
    await reloadCursosVinc();
  };

  const onChangeVal = (fkCursoId: number, v: string) => {
    setEditVal((p) => ({ ...p, [fkCursoId]: v }));
  };

  const salvarValidade = async (fkCursoId: number) => {
    const raw = editVal[fkCursoId];
    if (raw == null || raw === "" || isNaN(Number(raw))) return;

    const res = await addMedidaCurso(idMedida, fkCursoId, Number(raw));
    setCursosVinc((prev) =>
      prev.map((x) => (x.fkCursoId === fkCursoId ? res : x))
    );
    setEditandoId(null);
    await reloadCursosVinc();
  };

  return (
    <section className="flex flex-col gap-6">
      <h3 className="text-lg font-semibold">Vincular Cursos</h3>

      <div className="grid grid-cols-1 md:grid-cols-8 gap-2 items-end">
        <div className="md:col-span-6">
          <SearchableSelect
            label="Curso"
            name="curso"
            value={selCurso === "" ? "" : selCurso}
            onChange={(v) => setSelCurso(v === "" ? "" : Number(v))}
            options={cursosOpts.map((o) => ({ label: o.label, value: o.value }))}
            allowClear
            emptyOptionLabel="Selecione um curso"
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
          <div className="flex items-end">
            <button
              type="button"
              onClick={addCurso}
              className="px-3 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 disabled:opacity-60 w-full cursor-pointer"
              disabled={loadingCursos || !selCurso}
            >
              Vincular curso
            </button>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Cursos vinculados</h4>
        {!cursosVinc.length ? (
          <div className="text-sm text-gray-500">Nenhum curso vinculado.</div>
        ) : (
          <ul className="space-y-2">
            {cursosVinc.map((c) => {
              const editando = editandoId === c.fkCursoId;
              return (
                <li
                  key={`${c.fkMedidaId}-${c.fkCursoId}`}
                  className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded border border-gray-200 gap-3"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {c.curso?.titulo ?? `Curso #${c.fkCursoId}`}
                    </div>
                    <div className="text-xs text-gray-600">
                      Validade atual: {c.validade ?? 0} Meses
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {editando ? (
                      <>
                        <p className="text-sm font-semibold">Validade:</p>
                        <Input
                          name={`val-${c.fkCursoId}`}
                          type="number"
                          value={editVal[c.fkCursoId] ?? ""}
                          onChange={(e) =>
                            onChangeVal(c.fkCursoId, e.target.value)
                          }
                          placeholder={String(c.validade ?? 0)}
                          required={false}
                        />
                        <button
                          type="button"
                          className="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer"
                          onClick={() => salvarValidade(c.fkCursoId)}
                        >
                          <Save size={14} />
                        </button>
                        <button
                          type="button"
                          className="px-3 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 cursor-pointer"
                          onClick={() => setEditandoId(null)}
                        >
                          <CircleXIcon size={14} />
                        </button>
                      </>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
                          onClick={() => {
                            setEditandoId(c.fkCursoId);
                            setEditVal((p) => ({
                              ...p,
                              [c.fkCursoId]: String(c.validade ?? ""),
                            }));
                          }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer"
                          onClick={() => removerCurso(c.fkCursoId)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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
