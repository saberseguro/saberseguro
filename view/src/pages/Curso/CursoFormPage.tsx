import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCursoPorId, salvarCurso, editarCurso } from "../../services/apiCurso";
import Spinner from "../../components/Spinner";
import FormCurso from "../../components/Formularios/FormCurso";
import toast from "react-hot-toast";
import type { Curso } from "../../types/EstruturaCurso";
import { ArrowLeft } from "lucide-react";

interface Props {
  idCurso?: number;
  modo: "criar" | "editar";
}

export default function CursoFormPage({ idCurso, modo }: Props) {
  const navigate = useNavigate();
  const [curso, setCurso] = useState<Curso | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (modo === "editar" && idCurso) {
      getCursoPorId(idCurso)
        .then((res) => setCurso(res))
        .catch(() => toast.error("Erro ao carregar curso"))
        .finally(() => setLoading(false));
    } else {
      setCurso({
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
      });
      setLoading(false);
    }
  }, [idCurso, modo]);

  const handleSalvar = async () => {
    try {
      setLoading(true);
      let salvo;
      if (modo === "criar") salvo = await salvarCurso(curso!);
      else salvo = await editarCurso(curso!.idCurso, curso!);
      toast.success("Curso salvo com sucesso!");
      navigate(`/cursos/${salvo.idCurso}?modo=ver`);
    } catch (e: any) {
      toast.error(e.message || "Falha ao salvar curso");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3 border-b border-gray-300 pb-2 mb-6">
        <button
          onClick={() => navigate(`/cursos/${idCurso}`)}
          className="flex items-center justify-center p-2 hover:bg-gray-200 rounded-full transition cursor-pointer"
          title="Voltar"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-700">
          {modo === "criar" ? "Novo Curso" : `Editar Curso #${curso?.idCurso}`}
        </h1>
      </div>

      <FormCurso curso={curso!} setCurso={setCurso} setLoading={setLoading} />

      <div className="pt-4 text-end">
        <button
          disabled={loading}
          className="bg-blue-600 text-white px-8 py-2 rounded hover:bg-blue-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition disabled:hover:bg-blue-600"
          onClick={handleSalvar}
        >
          {loading ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}
