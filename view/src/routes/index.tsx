import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import "sweetalert2/dist/sweetalert2.min.css";

const LoginPage = lazy(() => import('../pages/Auth/LoginPage'));
const HomePage = lazy(() => import('../pages/Home/HomePage'));
const EmpresaPage = lazy(() => import('../pages/Empresa/EmpresaPage'));
const CursoPage = lazy(() => import('../pages/Curso/CursoPage'));
const CursoRouter = lazy(() => import('../pages/Curso/CursoRouter'));
const MeusCursos = lazy(() => import('../pages/Curso/MeusCursos'));
const PlayerCurso = lazy(() => import('../pages/Curso/PlayerCurso'));
const MedidaPage = lazy(() => import('../pages/Medida/MedidaPage'));
const CertificadoPreview = lazy(() => import('../pages/CertificadoPreview'));
const ConfigPage = lazy(() => import('../pages/ConfigPage'));
const CertificadoPage = lazy(() => import('../pages/Curso/CertificadoPage'));
const AjustesPage = lazy(() => import('../pages/Ajustes'))

function PrivateRoute() {
  const { user } = useAuth();
  const location = useLocation();

  const precisaTrocarSenha = user?.trocarsenha;
  const precisaAdicionarAssinatura = !user?.assinatura;
  const ajustesPendentes = precisaTrocarSenha || precisaAdicionarAssinatura;

  const estaNaPaginaDeAjustes = location.pathname === "/ajustes";

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Bloqueia tudo enquanto não fizer os ajustes
  if (ajustesPendentes && !estaNaPaginaDeAjustes) {
    return (
      <Navigate
        to="/ajustes"
        state={{
          precisaTrocarSenha,
          precisaAdicionarAssinatura,
          senhaAtual: "",
        }}
        replace
      />
    );
  }

  // Tudo certo
  return <Outlet />;
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
      <Suspense fallback={<Loading fullScreen={true} />}>
        <Routes>
          {/* Rota pública sem layout */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Rotas privadas com layout */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/ajustes" element={<AjustesPage />} />
              <Route path="/empresa" element={<EmpresaPage />} />

              {/* Curso */}
              <Route path="/cursos/gerenciar" element={<CursoPage />} />
              <Route path="/cursos/:id/*" element={<CursoRouter />} />
              <Route path="/cursos/meuscursos" element={<MeusCursos />} />
              <Route path="/cursos/playcurso/:idCurso" element={<PlayerCurso />} />

              <Route path="/cursos/certificados" element={<CertificadoPage />} />
              <Route path="/certificado/preview/:idCertificado" element={<CertificadoPreview />} />

              {/* Medida */}
              <Route path="/medida" element={<MedidaPage />} />

              {/* Configurações */}
              <Route path="/configuracoes" element={<ConfigPage />} />
            </Route>
          </Route>

          {/* Redirecionamento padrão */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}