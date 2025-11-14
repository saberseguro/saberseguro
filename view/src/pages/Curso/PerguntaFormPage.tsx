import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Input, SelectInput } from "../../components/Formularios/Inputs";
import { ArrowLeft, CheckCircle, Plus, Trash } from "lucide-react";
import { criarPergunta, editarPergunta, getPergunta } from "../../services/apiPergunta";
import Spinner from "../../components/Spinner";

interface Props {
  modo?: "criar" | "editar";
}

export default function PerguntaFormPage({ modo = "criar" }: Props) {
  const { id, idAvaliacao, idPergunta } = useParams();
  const navigate = useNavigate();

  const [pergunta, setPergunta] = useState({
    enunciado: "",
    tipo: "OBJETIVA",
    ativo: 1,
    alternativas: [
      { texto: "", correta: 0 },
    ]
  });

  const [loading, setLoading] = useState(false);

  const isEditar = modo === "editar";

  // Carregar pergunta
  useEffect(() => {
    if (isEditar && idPergunta) {
      getPergunta(Number(idPergunta))
        .then((resp) => {
          setPergunta({
            enunciado: resp.enunciado ?? "",
            tipo: resp.tipo ?? "OBJETIVA",
            ativo: resp.ativo ?? 1,
            alternativas:
              resp.alternativas?.map((alt) => ({
                texto: alt.texto,
                correta: alt.correta
              })) ?? []
          });
        })
        .catch(() => toast.error("Erro ao carregar pergunta"));
    }
  }, [isEditar, idPergunta]);

  // Adicionar alternativa
  const handleAddAlternativa = () => {
    if (pergunta.alternativas.length >= 5) {
      toast.error("Máximo de 5 alternativas.");
      return;
    }

    setPergunta((prev) => ({
      ...prev,
      alternativas: [...prev.alternativas, { texto: "", correta: 0 }]
    }));
  };

  // Remover alternativa
  const handleRemoveAlternativa = (index: number) => {
    if (pergunta.alternativas.length <= 2) {
      toast.error("Mínimo de 2 alternativas.");
      return;
    }

    const novas = pergunta.alternativas.filter((_, i) => i !== index);

    // se a correta foi removida → define primeira como correta
    if (!novas.some((a) => a.correta === 1)) {
      novas[0].correta = 1;
    }

    setPergunta({ ...pergunta, alternativas: novas });
  };

  // Salvar
  const handleSalvar = async () => {
    setLoading(true);
    if (pergunta.tipo === "OBJETIVA") {
      if (pergunta.alternativas.length < 2) {
        toast.error("A pergunta objetiva precisa de pelo menos 2 alternativas.");
        return;
      }

      if (!pergunta.alternativas.some((a) => a.correta === 1)) {
        toast.error("Selecione uma alternativa correta.");
        return;
      }
    }

    try {
      if (isEditar) {
        await editarPergunta(Number(idPergunta), pergunta);
      } else {
        await criarPergunta(Number(idAvaliacao), pergunta);
      }

      toast.success("Pergunta salva!");
      navigate(`/cursos/${id}/avaliacao/${idAvaliacao}`);
    } catch {
      toast.error("Erro ao salvar pergunta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-200 rounded-full transition"
        >
          <ArrowLeft size={20} className="text-gray-700" />
        </button>

        <h1 className="text-2xl font-semibold text-gray-700">
          {isEditar ? "Editar Pergunta" : "Nova Pergunta"}
        </h1>
      </div>

      {/* CONTEÚDO */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-12 gap-2">
          {/* Enunciado */}
          <div className="col-span-5">
            <Input
              label="Enunciado"
              placeholder="Digite o enumciado..."
              name="enunciado"
              value={pergunta.enunciado}
              onChange={(e) => setPergunta({ ...pergunta, enunciado: e.target.value })}
            />
          </div>

          {/* Tipo */}
          <div className="col-span-5">
            <SelectInput
              label="Tipo de Pergunta"
              name="tipo"
              value={pergunta.tipo}
              onChange={(e) => setPergunta({ ...pergunta, tipo: e.target.value })}
              options={[
                { label: "Objetiva", value: "multipla" },
              ]}
            />
          </div>

          {/* Status */}
          <div className="col-span-2">
            <SelectInput
              label="Status"
              name="ativo"
              value={String(pergunta.ativo)}
              onChange={(e) => setPergunta({ ...pergunta, ativo: Number(e.target.value) })}
              options={[
                { label: "Ativa", value: "1" },
                { label: "Inativa", value: "0" }
              ]}
            />
          </div>
        </div>

        {/* ALTERNATIVAS */}
        {pergunta.tipo === "multipla" && (
          <div className="mt-6">

            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-700">Alternativas</h3>

              <button
                type="button"
                onClick={handleAddAlternativa}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 cursor-pointer"
              >
                <Plus size={14} /> Adicionar
              </button>
            </div>

            {pergunta.alternativas.map((alt, index) => (
              <div key={index} className="flex gap-3 items-center mb-2">

                <Input
                  name={`alt_${index}`}
                  label={`Alternativa ${index + 1}`}
                  placeholder="Digite a alternativa..."
                  value={alt.texto}
                  onChange={(e) => {
                    const novas = [...pergunta.alternativas];
                    novas[index].texto = e.target.value;
                    setPergunta({ ...pergunta, alternativas: novas });
                  }}
                />

                <div className="flex items-center gap-2 mt-5">
                  {/* Marcar correta */}
                  <button
                    type="button"
                    onClick={() =>
                      setPergunta({
                        ...pergunta,
                        alternativas: pergunta.alternativas.map((a, i) => ({
                          ...a,
                          correta: i === index ? 1 : 0
                        }))
                      })
                    }
                    className={`p-2 rounded-full transition cursor-pointer ${alt.correta
                      ? "hover:bg-green-100 text-green-500"
                      : "hover:bg-gray-100 text-gray-600"
                      }`}
                  >
                    <CheckCircle size={18} />
                  </button>

                  {/* Remover alternativa */}
                  <button
                    type="button"
                    onClick={() => handleRemoveAlternativa(index)}
                    className="p-2 rounded-full hover:bg-red-100 text-red-600 cursor-pointer transition"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-end">
          <button
            onClick={handleSalvar}
            disabled={loading}
            className="mt-4 px-8 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
          >
            {loading ? <Spinner size={16} /> : 'Salvar'}
          </button>
        </div>

      </div>
    </div>
  );
}