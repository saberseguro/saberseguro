import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import Loading from '../components/Loading';

const LoginPage = lazy(() => import('../pages/Auth/LoginPage'));
const HomePage = lazy(() => import('../pages/Home/HomePage'));
const EmpresaPage = lazy(() => import('../pages/Empresa/EmpresaPage'));
const CursoPage = lazy(() => import('../pages/Curso/CursoPage'));
const MeusCursos = lazy(() => import('../pages/Curso/MeusCursos'));
const PlayerCurso = lazy(() => import('../pages/Curso/PlayerCursoNew'));
const MedidaPage = lazy(() => import('../pages/Medida/MedidaPage'));
const CertificadoPreview = lazy(() => import('../pages/CertificadoPreview'));

function PrivateRoute() {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/login" />;
}

function PublicRoute() {
  const { user } = useAuth();
  return user ? <Navigate to="/" /> : <Outlet />;
}

export default function AppRoutes() {
  const { loading } = useAuth();

  if (loading) return <Loading />;

  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Rota pública sem layout */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Rotas privadas com layout */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/empresa" element={<EmpresaPage />} />

              {/* Curso */}
              <Route path="/cursos/gerenciar" element={<CursoPage />} />
              <Route path="/cursos/meuscursos" element={<MeusCursos />} />
              <Route path="/cursos/playcurso/:idCurso" element={<PlayerCurso />} />

              <Route path="/certificado/:idCurso" element={<CertificadoPreview />} />

              {/* Medida */}
              <Route path="/medida" element={<MedidaPage />} />
            </Route>
          </Route>

          {/* Redirecionamento padrão */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}