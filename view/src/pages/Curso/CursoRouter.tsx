import { Route, Routes, useParams, useSearchParams } from "react-router-dom";
import CursoFormPage from "./CursoFormPage";
import CursoViewPage from "./CursoViewPage";
import ModuloViewPage from "./ModuloViewPage";
import ModuloFormPage from "./ModuloFormPage";
import AulaViewPage from "./AulaViewPage";
import AulaFormPage from "./AulaFormPage";
import AvaliacaoFormPage from "./AvaliacaoFormPage";
import AvaliacaoViewPage from "./AvaliacaoViewPage";
import PerguntaFormPage from "./PerguntaFormPage";
import PerguntaViewPage from "./PerguntaViewPage";

export default function CursoRouter() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const modo = params.get("modo");

  if (id === "novo") {
    const fkEmpresaId = params.get("fkEmpresaId") || null;

    return <CursoFormPage modo="criar" fkEmpresaId={fkEmpresaId ? Number(fkEmpresaId) : null} />;
  }


  if (modo === "editar") {
    return <CursoFormPage modo="editar" idCurso={Number(id)} />;
  }

  return (
    <Routes>
      {/* Curso */}
      <Route index element={<CursoViewPage idCurso={Number(id)} />} />

      {/* Módulo */}
      <Route path="modulo/novo" element={<ModuloFormPage />} />
      <Route path="modulo/:idModulo" element={<ModuloViewPage />} />
      <Route path="modulo/:idModulo/editar" element={<ModuloFormPage />} />

      {/* Aula */}
      <Route path="modulo/:idModulo/aula/novo" element={<AulaFormPage />} />
      <Route path="modulo/:idModulo/aula/:idAula" element={<AulaViewPage />} />
      <Route path="modulo/:idModulo/aula/:idAula/editar" element={<AulaFormPage />} />

      {/* Avaliação Curso */}
      <Route path="avaliacao/novo" element={<AvaliacaoFormPage modo="criar" tipo="CURSO" />} />
      <Route path="avaliacao/:idAvaliacao" element={<AvaliacaoViewPage tipo="CURSO" />} />
      <Route path="avaliacao/:idAvaliacao/editar" element={<AvaliacaoFormPage tipo="CURSO" />} />

      {/* Avaliação Aula */}
      <Route path="modulo/:idModulo/aula/:idAula/avaliacao/novo"
        element={<AvaliacaoFormPage modo="criar" tipo="AULA" />} />

      <Route path="modulo/:idModulo/aula/:idAula/avaliacao/:idAvaliacao"
        element={<AvaliacaoViewPage tipo="AULA" />} />

      <Route path="modulo/:idModulo/aula/:idAula/avaliacao/:idAvaliacao/editar"
        element={<AvaliacaoFormPage tipo="AULA" />} />

      {/* Perguntas */}
      <Route
        path="avaliacao/:idAvaliacao/pergunta/novo"
        element={<PerguntaFormPage modo="criar" />}
      />

      <Route
        path="avaliacao/:idAvaliacao/pergunta/:idPergunta"
        element={<PerguntaViewPage />}
      />

      <Route
        path="avaliacao/:idAvaliacao/pergunta/:idPergunta/editar"
        element={<PerguntaFormPage modo="editar" />}
      />

    </Routes>
  );
}