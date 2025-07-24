import express from 'express';
import cors from 'cors';
import { env } from './config/env';

// Rotas
import authRoutes from './routes/auth.routes';

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

app.use("/api", authRoutes);

app.listen(env.PORT, () => {
  console.log(`Servidor rodando na porta ${env.PORT}`);
});
