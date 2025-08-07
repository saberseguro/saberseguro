import { Router } from "express";
import { authorize } from "../../middlewares/authorize";
import { criarAulaVideoController } from "../../controllers/curso/aulavideoController";

const router = Router();

router.post("/", authorize(["criar_cursos"]), criarAulaVideoController);

export default router;
