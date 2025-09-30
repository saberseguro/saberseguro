import { useEffect, useMemo, useState } from "react";
import type { Curso } from "../../types/EstruturaCurso";

import Spinner from "../Spinner";
import ModalBase from "../Modais/ModalBase";

// Formulários
import FormCurso from "../Formularios/FormCurso";
import FormModulos from "../Formularios/FormModulo";
import FormAvaliacoesCurso from "../Formularios/FormAvaliacoesCurso";

// Serviços
import { syncCurso } from "../../services/apiCurso";
import { withCalculatedCargaHoraria } from "../../auxiliares/cursoCalc";
import VinculosCurso from "../Vinculos/VinculosCurso";

interface ModalCursoProps {
  isOpen: boolean;
  onClose: () => void;
  cursoSelecionado?: Curso | null;
  onSaved?: () => void;
}

const abas = [
  { id: "dados", label: "Dados" },
  { id: "modulos", label: "Modulos" },
  { id: "medidas", label: "Medidas" },
  { id: "avaliacoes", label: "Avaliações" },
];

export default function ModalCurso({ isOpen, onClose, cursoSelecionado, onSaved }: ModalCursoProps) {
  const [uploadsPendentes, setUploadsPendentes] = useState(false);

  const [abaSelecionada, setAbaSelecionada] = useState("dados");
  const [curso, setCurso] = useState<Curso>(
    cursoSelecionado ?? {
      idCurso: 0,
      titulo: "",
      descricao: "",
      cargaHoraria: 0,
      ativo: 1,
      criado_em: new Date().toISOString(),
      editado_em: new Date().toISOString(),
      fkResponsavelTecnicoId: 0,
      fkEmpresaId: 0,
      modulos: [],
      avaliacoes: [],
    }
  );

  const [loading, setLoading] = useState(false);

  // Atualiza quando modal é aberto com outro curso
  useEffect(() => {
    if (cursoSelecionado) {
      setCurso({
        ...cursoSelecionado,
        modulos: cursoSelecionado.modulos ?? [],
        avaliacoes: cursoSelecionado.avaliacoes ?? [],
      });
    }
  }, [cursoSelecionado]);

  const renderConteudo = () => {
    if (loading) return <Spinner />;

    switch (abaSelecionada) {
      case "dados": return <FormCurso curso={curso} setCurso={setCurso} setLoading={setLoading} />;
      case "modulos": return <FormModulos curso={curso} setCurso={setCurso} setLoading={setLoading} setUploadsPendentes={setUploadsPendentes} />;
      case "avaliacoes": return <FormAvaliacoesCurso curso={curso} setCurso={setCurso} setLoading={setLoading} />;
      case "medidas":
        return curso.idCurso > 0 ? (
          <VinculosCurso idCurso={curso.idCurso} />
        ) : (
          <div className="text-sm text-gray-600">
            Salve o curso primeiro para liberar os vínculos de medidas.
          </div>
        );

      default:
        return null;
    }
  };

  const tituloModal = useMemo(() => {
    const carga = curso.cargaHoraria ? ` (${curso.cargaHoraria})` : "";
    return `#${curso.idCurso} - ${curso.titulo || "Novo curso"}${carga}`;
  }, [curso.idCurso, curso.titulo, curso.cargaHoraria]);

  async function onSalvar() {
    try {
      setLoading(true);

      const cursoCalculado = withCalculatedCargaHoraria(curso);

      const salvo = await syncCurso(cursoCalculado);
      setCurso(salvo);

      onSaved?.();
      onClose();
    } catch (e: any) {
      alert(e.message || "Falha ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} largura="max-w-7xl min-h-[70vh]" titulo={tituloModal}>
      <div className="flex flex-col">
        {/* Abas */}
        <div className="flex gap-2 border-b border-gray-300 mb-0">
          {abas.map((aba) => (
            <button
              key={aba.id}
              className={`px-4 py-2 -mb-px rounded-t-md font-medium whitespace-nowrap flex-shrink-0 border cursor-pointer
                ${abaSelecionada === aba.id
                  ? "bg-gray-50 text-gray-600 border-gray-200 border-b-gray-50"
                  : "bg-white text-gray-700 hover:bg-gray-100 border-gray-300"
                }`}
              onClick={() => setAbaSelecionada(aba.id)}
            >
              {aba.label}
            </button>
          ))}
        </div>

        <div className="border border-t-0 border-gray-200 bg-gray-50 p-6 rounded-b-md">
          {renderConteudo()}
        </div>

        <div className="border-t border-gray-200 bg-white p-4">
          <div className="flex justify-end">
            <button
              type="button"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-400"
              disabled={loading || uploadsPendentes}
              onClick={onSalvar}
            >
              {loading ? <Spinner /> : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </ModalBase>
  );
}