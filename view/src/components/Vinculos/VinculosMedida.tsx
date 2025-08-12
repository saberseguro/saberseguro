import { useEffect, useState } from "react";
import {
  addMedidaCurso,
  createMedidaVinculo,
  deleteMedidaVinculo,
  getMedidaCursos,
  getMedidaVinculos,
  removeMedidaCurso,
  // opcional (se expôs PATCH no back):
  // updateMedidaCursoValidade,
} from "../../services/apiMedida";
import type { MedidaCurso, MedidaVinculo } from "../../types/EstruturaMedida";
import { SelectInput, Input } from "../Formularios/Inputs";
import { getCargos, getEmpresas, getFuncionarios, getSetores, getUnidades } from "../../services/apiEmpresa";
import { getCursos } from "../../services/apiCurso";

type Opt = { label: string; value: number };

interface Props {
  idMedida: number;
}

export default function VinculosMedida({ idMedida }: Props) {
  // Estrutura
  const [vinculos, setVinculos] = useState<MedidaVinculo[]>([]);
  const [loadingVinc, setLoadingVinc] = useState(false);

  const [empresas, setEmpresas] = useState<Opt[]>([]);
  const [unidades, setUnidades] = useState<Opt[]>([]);
  const [setores, setSetores] = useState<Opt[]>([]);
  const [cargos, setCargos] = useState<Opt[]>([]);
  const [usuarios, setUsuarios] = useState<Opt[]>([]);

  const [selEmpresa, setSelEmpresa] = useState<number | "">("");
  const [selUnidade, setSelUnidade] = useState<number | "">("");
  const [selSetor, setSelSetor] = useState<number | "">("");
  const [selCargo, setSelCargo] = useState<number | "">("");
  const [selUsuario, setSelUsuario] = useState<number | "">("");

  // Cursos
  const [cursosVinc, setCursosVinc] = useState<MedidaCurso[]>([]);
  const [cursosOpts, setCursosOpts] = useState<Opt[]>([]);
  const [selCurso, setSelCurso] = useState<number | "">("");
  const [validadeNovo, setValidadeNovo] = useState<number | "">(""); // validade ao criar
  const [loadingCursos, setLoadingCursos] = useState(false);

  // Carregamentos iniciais
  useEffect(() => {
    const load = async () => {
      setLoadingVinc(true);
      try {
        const v = await getMedidaVinculos(idMedida);
        setVinculos(v);

        const pagina = await getEmpresas({ page: 1, take: 100 });
        setEmpresas(pagina.data.map(x => ({ value: x.idEmpresa, label: x.nomeFantasia })));

      } finally {
        setLoadingVinc(false);
      }
    };
    load();
  }, [idMedida]);

  // Cascata
  useEffect(() => {
    (async () => {
      setUnidades([]); setSelUnidade(""); setSetores([]); setSelSetor(""); setCargos([]); setSelCargo(""); setUsuarios([]); setSelUsuario("");
      if (selEmpresa) {
        const u = await getUnidades(Number(selEmpresa));
        setUnidades(u.map((x: any) => ({ value: x.idUnidade, label: x.nomeFantasia })));
      }
    })();
  }, [selEmpresa]);

  useEffect(() => {
    (async () => {
      setSetores([]); setSelSetor(""); setCargos([]); setSelCargo(""); setUsuarios([]); setSelUsuario("");
      if (selUnidade) {
        const s = await getSetores(Number(selUnidade));
        setSetores(s.map((x: any) => ({ value: x.idSetor, label: x.nome })));
      }
    })();
  }, [selUnidade]);

  useEffect(() => {
    (async () => {
      setCargos([]); setSelCargo(""); setUsuarios([]); setSelUsuario("");
      if (selSetor) {
        const c = await getCargos(Number(selSetor));
        setCargos(c.map((x: any) => ({ value: x.idCargo, label: x.nome })));
      }
    })();
  }, [selSetor]);

  useEffect(() => {
    (async () => {
      setUsuarios([]); setSelUsuario("");
      if (selCargo) {
        const us = await getFuncionarios(Number(selCargo));
        setUsuarios(us.map((x: any) => ({ value: x.idUsuario, label: x.nome })));
      }
    })();
  }, [selCargo]);

  // Cursos
  useEffect(() => {
    (async () => {
      try {
        setLoadingCursos(true);
        const cv = await getMedidaCursos(idMedida);
        setCursosVinc(cv);

        const list = await getCursos({ page: 1 });
        const data = (list as any)?.data ?? list;
        const opts = (data ?? []).map((c: any) => ({ value: c.idCurso, label: c.titulo })) ?? [];
        setCursosOpts(opts);
      } finally {
        setLoadingCursos(false);
      }
    })();
  }, [idMedida]);

  const addVinculo = async () => {
    const payload = {
      fkMedidaId: idMedida,
      fkEmpresaId: selEmpresa ? Number(selEmpresa) : null,
      fkUnidadeId: selUnidade ? Number(selUnidade) : null,
      fkSetorId: selSetor ? Number(selSetor) : null,
      fkCargoId: selCargo ? Number(selCargo) : null,
      fkUsuarioId: selUsuario ? Number(selUsuario) : null,
    };
    const novo = await createMedidaVinculo(payload);
    setVinculos((prev) => [novo, ...prev]);
  };

  const removerVinculo = async (id: number) => {
    await deleteMedidaVinculo(id);
    setVinculos((prev) => prev.filter((v) => v.idMedidaVinculo !== id));
  };

  const addCurso = async () => {
    if (!selCurso) return;
    const validade = validadeNovo === "" ? undefined : Number(validadeNovo);
    const novo = await addMedidaCurso(idMedida, Number(selCurso), validade);
    // quando o back inclui o include { curso: { idCurso, titulo } }
    setCursosVinc((prev) => [novo, ...prev.filter(p => !(p.fkCursoId === novo.fkCursoId))]);
    setSelCurso("");
    setValidadeNovo("");
  };

  const removerCurso = async (fkCursoId: number) => {
    await removeMedidaCurso(idMedida, fkCursoId);
    setCursosVinc((prev) => prev.filter((x) => x.fkCursoId !== fkCursoId));
  };

  // (Opcional) editar validade inline
  const [editVal, setEditVal] = useState<Record<number, string>>({});
  const onChangeVal = (fkCursoId: number, v: string) => {
    setEditVal((p) => ({ ...p, [fkCursoId]: v }));
  };
  const salvarValidade = async (fkCursoId: number) => {
    const raw = editVal[fkCursoId];
    if (raw == null || raw === "" || isNaN(Number(raw))) return;
    // descomente se tiver exposto PATCH no back e no service
    // const res = await updateMedidaCursoValidade(idMedida, fkCursoId, Number(raw));
    // setCursosVinc((prev) => prev.map((x) => (x.fkCursoId === fkCursoId ? res : x)));
    // fallback: se não tiver PATCH, pode chamar addMedidaCurso (upsert):
    const res = await addMedidaCurso(idMedida, fkCursoId, Number(raw));
    setCursosVinc((prev) => prev.map((x) => (x.fkCursoId === fkCursoId ? res : x)));
  };

  const tip = (v: MedidaVinculo) =>
    [v.empresa?.nomeFantasia, v.unidade?.nomeFantasia, v.setor?.nome, v.cargo?.nome, v.usuario?.nome]
      .filter(Boolean)
      .join(" › ");

  return (
    <div className="flex flex-col gap-8">
      {/* ESTRUTURA */}
      <section>
        <h3 className="text-lg font-semibold mb-3">Vincular à Estrutura</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <SelectInput
            label="Empresa"
            name="empresa"
            value={selEmpresa === "" ? "" : String(selEmpresa)}
            onChange={(e) => setSelEmpresa(e.target.value ? Number(e.target.value) : "")}
            options={[{ label: "(opcional)", value: "" }, ...empresas.map((o) => ({ label: o.label, value: String(o.value) }))]}
          />
          <SelectInput
            label="Unidade"
            name="unidade"
            value={selUnidade === "" ? "" : String(selUnidade)}
            onChange={(e) => setSelUnidade(e.target.value ? Number(e.target.value) : "")}
            options={[{ label: "(opcional)", value: "" }, ...unidades.map((o) => ({ label: o.label, value: String(o.value) }))]}
          />
          <SelectInput
            label="Setor"
            name="setor"
            value={selSetor === "" ? "" : String(selSetor)}
            onChange={(e) => setSelSetor(e.target.value ? Number(e.target.value) : "")}
            options={[{ label: "(opcional)", value: "" }, ...setores.map((o) => ({ label: o.label, value: String(o.value) }))]}
          />
          <SelectInput
            label="Cargo"
            name="cargo"
            value={selCargo === "" ? "" : String(selCargo)}
            onChange={(e) => setSelCargo(e.target.value ? Number(e.target.value) : "")}
            options={[{ label: "(opcional)", value: "" }, ...cargos.map((o) => ({ label: o.label, value: String(o.value) }))]}
          />
          <SelectInput
            label="Funcionário"
            name="usuario"
            value={selUsuario === "" ? "" : String(selUsuario)}
            onChange={(e) => setSelUsuario(e.target.value ? Number(e.target.value) : "")}
            options={[{ label: "(opcional)", value: "" }, ...usuarios.map((o) => ({ label: o.label, value: String(o.value) }))]}
          />
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={addVinculo}
            className="px-3 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 disabled:opacity-60"
            disabled={loadingVinc}
          >
            Adicionar vínculo
          </button>
        </div>

        <div className="mt-4">
          <h4 className="font-medium mb-2">Vínculos cadastrados</h4>
          {!vinculos.length ? (
            <div className="text-sm text-gray-500">Nenhum vínculo ainda.</div>
          ) : (
            <ul className="space-y-2">
              {vinculos.map((v) => (
                <li key={v.idMedidaVinculo} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                  <span className="text-sm">{tip(v)}</span>
                  <button
                    type="button"
                    className="text-red-600 text-sm hover:underline"
                    onClick={() => removerVinculo(v.idMedidaVinculo)}
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* CURSOS */}
      <section>
        <h3 className="text-lg font-semibold mb-3">Vincular a Cursos</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <SelectInput
            label="Curso"
            name="curso"
            value={selCurso === "" ? "" : String(selCurso)}
            onChange={(e) => setSelCurso(e.target.value ? Number(e.target.value) : "")}
            options={[{ label: "(selecione)", value: "" }, ...cursosOpts.map((o) => ({ label: o.label, value: String(o.value) }))]}
          />
          <Input
            label="Validade (opcional)"
            name="validade"
            type="number"
            value={validadeNovo === "" ? "" : String(validadeNovo)}
            onChange={(e) => setValidadeNovo(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="ex.: 12"
          />
          <div className="flex items-end">
            <button
              type="button"
              onClick={addCurso}
              className="px-3 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 disabled:opacity-60"
              disabled={loadingCursos || !selCurso}
            >
              Vincular curso
            </button>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="font-medium mb-2">Cursos vinculados</h4>
          {!cursosVinc.length ? (
            <div className="text-sm text-gray-500">Nenhum curso vinculado.</div>
          ) : (
            <ul className="space-y-2">
              {cursosVinc.map((c) => (
                <li
                  key={`${c.fkMedidaId}-${c.fkCursoId}`}
                  className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded gap-3"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium">{c.curso?.titulo ?? `Curso #${c.fkCursoId}`}</div>
                    <div className="text-xs text-gray-600">Validade: {c.validade ?? 0}</div>
                  </div>

                  <div className="flex items-end gap-2">
                    <Input
                      label="Editar validade"
                      name={`val-${c.fkCursoId}`}
                      type="number"
                      value={editVal[c.fkCursoId] ?? ""}
                      onChange={(e) => onChangeVal(c.fkCursoId, e.target.value)}
                      placeholder={String(c.validade ?? 0)}
                    />
                    <button
                      type="button"
                      className="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-60"
                      onClick={() => salvarValidade(c.fkCursoId)}
                    >
                      Salvar
                    </button>

                    <button
                      type="button"
                      className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      onClick={() => removerCurso(c.fkCursoId)}
                    >
                      Remover
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}