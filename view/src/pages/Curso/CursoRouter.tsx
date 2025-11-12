import { Route, Routes, useParams, useSearchParams } from "react-router-dom";
import CursoFormPage from "./CursoFormPage";
import CursoViewPage from "./CursoViewPage";
import ModuloViewPage from "./ModuloViewPage";
import ModuloFormPage from "./ModuloFormPage";
import AulaViewPage from "./AulaViewPage";
import AulaFormPage from "./AulaFormPage";
import AvaliacaoFormPage from "./AvaliacaoFormPage";
import AvaliacaoViewPage from "./AvaliacaoViewPage";

export default function CursoRouter() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const modo = params.get("modo");

  if (id === "novo") {
    return <CursoFormPage modo="criar" />;
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

      {/* Avaliação */}
      <Route path="avaliacao/:idAvaliacao" element={<AvaliacaoViewPage />} />
      <Route path="avaliacao/:idAvaliacao/editar" element={<AvaliacaoFormPage />} />
      <Route path="avaliacao/novo" element={<AvaliacaoFormPage modo='criar' />} />
    </Routes>
  );
}