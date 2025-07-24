import { Router } from "express";
import { login, logout, verifyToken } from '../controllers/authController';
import { authOnly, authorize } from '../middlewares/authorize';

const router = Router();

router.post('/login', login);
router.post('/logout', authorize([]), logout);
router.get("/auth/verify", authOnly(), verifyToken);

export default router;