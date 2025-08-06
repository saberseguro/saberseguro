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

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
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

// Curso
app.use("/api/curso", cursoRoutes);
app.use("/api/aula", aulaRoutes);
app.use("/api/modulo", moduloRoutes);
app.use("/api/categoria", categoriaRoutes);
app.use("/api/aulausuario", aulaUsuarioRoutes);

app.listen(env.PORT, () => {
  console.log(`Servidor rodando na porta ${env.PORT}`);
});
