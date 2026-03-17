import express from 'express';
import cors from 'cors';
import { env } from './config/env';

// Rotas
import authRoutes from './routes/auth.routes';

// Usuario
import usuarioRoutes from './routes/usuario.routes';

// Empresa
import empresaRoutes from './routes/empresa/empresa.routes';
import unidadeRoutes from './routes/empresa/unidade.routes';
import setorRoutes from './routes/empresa/setor.routes'
import cargoRoutes from './routes/empresa/cargo.routes'


// Curso
import cursoRoutes from './routes/curso/curso.routes';
import aulaRoutes from './routes/curso/aula.routes';
import moduloRoutes from './routes/curso/modulo.routes';
import categoriaRoutes from './routes/curso/categoria.routes';
import aulaUsuarioRoutes from './routes/curso/aulausuario.routes';
import aulaVideoRoutes from './routes/curso/aula/aulaVideoRoutes';
import materialComplementarRoutes from './routes/curso/aula/aulaMaterialRoutes';
import aulaStepsRoutes from './routes/curso/aula/aulaStepsRoutes';

// Certificado
import certificadosRoutes from './routes/curso/certificado.routes';

// Responsável Técnico
import responsavelTecnicoRoutes from './routes/curso/responsavelTecnico.routes';

// Avaliação
import avaliacaoRoutes from './routes/curso/avaliacao.routes';

// Medida
import medidaRoutes from './routes/medida.routes';

// Dashboard
import dashboardRoutes from './routes/dashboard.routes';

// Relatorios
import relatorioRoutes from './routes/relatorio.routes';

const app = express();

app.use(cors({
  origin: ['https://app.sabersegurotreinamentos.com', 'http://localhost:5173'],
  credentials: true,
}));

app.use(express.json());

// Auth
app.use("/api", authRoutes);

// Usuario
app.use("/api/usuario", usuarioRoutes);

// Empresa
app.use("/api/empresa", empresaRoutes);
app.use("/api/unidade", unidadeRoutes);
app.use("/api/setor", setorRoutes);
app.use("/api/cargo", cargoRoutes);

// Categoria
app.use("/api/categoria", categoriaRoutes);

// Curso
app.use("/api/curso", cursoRoutes);
app.use("/api/curso/modulo", moduloRoutes);
app.use("/api/curso/aula", aulaRoutes);
app.use("/api/curso/aula/aulavideo", aulaVideoRoutes);
app.use("/api/curso/aula/materialcomplementar", materialComplementarRoutes);
app.use("/api/curso/aula/steps", aulaStepsRoutes);
app.use("/api/curso/aulausuario", aulaUsuarioRoutes);

// Certificados
app.use("/api/certificados", certificadosRoutes);

// Responsável Técnico
app.use("/api/responsaveltecnico", responsavelTecnicoRoutes);

// Avaliação
app.use("/api/avaliacao", avaliacaoRoutes);

// Medida
app.use("/api/medida", medidaRoutes);

// Dashboard
app.use("/api/dashboard", dashboardRoutes);

// Relatorios
app.use("/api/relatorios", relatorioRoutes);

app.listen(env.PORT, () => {
  console.log(`Servidor rodando na porta ${env.PORT}`);
});
