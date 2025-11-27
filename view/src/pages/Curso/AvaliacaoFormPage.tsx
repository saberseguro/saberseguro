import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAvaliacaoPorId, salvarAvaliacao, editarAvaliacao } from "../../services/apiAvaliacao";
import toast from "react-hot-toast";
import Loading from "../../components/Loading";
import type { Avaliacao } from "../../types/EstruturaCurso";
import { Input, SelectInput } from "../../components/Formularios/Inputs";
import { formatarMinutosEmHoras } from "../../auxiliares/formatters";
import { ArrowLeft } from "lucide-react";
import Spinner from "../../components/Spinner";

interface Props {
  modo?: "criar" | "editar";
  tipo: "CURSO" | "MODULO" | "AULA";
}

export default function AvaliacaoFormPage({ modo = "editar", tipo }: Props) {
  const { id, idModulo, idAula, idAvaliacao } = useParams();
  const navigate = useNavigate();
  const [avaliacao, setAvaliacao] = useState<Avaliacao | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);

  useEffect(() => {
    if (modo === "criar") {
      setAvaliacao({
        idAvaliacao: 0,
        titulo: "",
        descricao: "",
        tempo_limite: 0,
        tipoAplicacao: "",
        aplicacao: "AULA",
        ordem: 1,
        ativo: 1,
        perguntas: [],
        avaliacoesUsuarios: [],
      });
      setLoading(false);
    } else {
      getAvaliacaoPorId(Number(idAvaliacao))
        .then(setAvaliacao)
        .catch(() => toast.error("Erro ao carregar avaliação"))
        .finally(() => setLoading(false));
    }
  }, [idAvaliacao, modo]);

  const handleSalvar = async () => {
    try {
      setLoadingSave(true);

      const dados = { ...avaliacao };

      if (tipo === "CURSO") {
        dados.aplicacao = "CURSO";
        dados.fkCursoId = Number(id);
        dados.fkAulaId = undefined;
      } else {
        dados.aplicacao = "AULA";
        dados.fkCursoId = undefined;
        dados.fkAulaId = Number(idAula);
      }

      let salvo;
      if (modo === "criar") salvo = await salvarAvaliacao(dados);
      else salvo = await editarAvaliacao(avaliacao!.idAvaliacao as number, dados);

      toast.success("Avaliação salva com sucesso!");

      if (tipo === "CURSO") {
        navigate(`/cursos/${id}/avaliacao/${salvo.idAvaliacao}`);
      } else {
        navigate(`/cursos/${id}/modulo/${idModulo}/aula/${idAula}/avaliacao/${salvo.idAvaliacao}`);
      }

    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar avaliação");
    } finally {
      setLoadingSave(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() =>
            tipo === "CURSO"
              ? navigate(`/cursos/${id}`)
              : navigate(`/cursos/${id}/modulo/${idModulo}/aula/${idAula}`)
          }
          type="button"
          className="p-2 hover:bg-gray-200 rounded-full transition cursor-pointer"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-700">
          {modo === "criar" ? "Nova Avaliação" : `Editar Avaliação #${avaliacao?.idAvaliacao}`}
        </h1>
      </div>

      <div className="space-y-4 bg-white p-4 rounded-md border border-gray-200">

        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-4">
            {/* TÍTULO */}
            <Input
              label="Título"
              name="titulo"
              placeholder="Título da avaliação"
              value={avaliacao?.titulo ?? ""}
              onChange={(e) =>
                setAvaliacao((prev) =>
                  prev ? { ...prev, titulo: e.target.value } : prev
                )
              }
            />
          </div>
          <div className="col-span-3">
            {/* TEMPO LIMITE */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 w-full">
                <div className="flex-1">
                  <Input
                    label="Tempo Limite (min)"
                    name="tempo_limite"
                    placeholder="Digite o tempo em minutos"
                    type="number"
                    value={Number(avaliacao?.tempo_limite) || ""}
                    onChange={(e) =>
                      setAvaliacao((prev) =>
                        prev ? { ...prev, tempo_limite: Number(e.target.value) } : prev
                      )
                    }
                  />
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap mt-6">
                  ({formatarMinutosEmHoras(avaliacao?.tempo_limite)})
                </span>
              </div>
            </div>
          </div>
          <div className="col-span-4">
            {/* TIPO APLICAÇÃO */}
            <SelectInput
              label="Tipo da Avaliação"
              name="tipoAplicacao"
              value={avaliacao?.tipoAplicacao ?? ""}
              onChange={(e) =>
                setAvaliacao((prev) =>
                  prev ? { ...prev, tipoAplicacao: e.target.value } : prev
                )
              }
              options={[
                { label: "Quiz", value: "quiz" },
                { label: "Avaliação", value: "avaliacao" }
              ]}
            />
          </div>
          <div className="col-span-1">
            {/* ATIVO */}
            <SelectInput
              label="Status"
              name="ativo"
              value={String(avaliacao?.ativo ?? 1)}
              onChange={(e) =>
                setAvaliacao((prev) =>
                  prev ? { ...prev, ativo: Number(e.target.value) } : prev
                )
              }
              options={[
                { label: "Ativo", value: "1" },
                { label: "Inativo", value: "0" }
              ]}
            />
          </div>
        </div>
      </div>

      <div className="text-end">
        <button
          className="bg-blue-600 text-white px-8 py-2 rounded hover:bg-blue-700 cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loadingSave}
          onClick={handleSalvar}
        >
          {loadingSave ? <Spinner size={20} /> : 'Salvar'}
        </button>
      </div>
    </div>
  );
}
