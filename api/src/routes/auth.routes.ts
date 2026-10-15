import { Router } from "express";
import { atualizarAssinaturaController, atualizarSenha, login, loginCpf, logout, verifyToken } from '../controllers/authController';
import { publicRateLimit } from '../middlewares/publicRateLimit';
import { authOnly, authorize } from '../middlewares/authorize';

const router = Router();

router.post('/login', login);
router.post('/login/cpf', publicRateLimit(15, 60_000), loginCpf);
router.post('/confirmar-troca-senha', authorize([]), atualizarSenha);
router.post('/atualizar-assinatura', authorize([]), atualizarAssinaturaController);
router.post('/logout', authorize([]), logout);
router.get("/auth/verify", authOnly, verifyToken);

export default router;
