// routes/materialComplementar.ts
import { Router } from "express";
import { criarMaterialComplementarController } from "../../controllers/curso/materialcomplementarController";
import { authorize } from "../../middlewares/authorize";

const router = Router();

router.post("/", authorize(["criar_cursos"]), criarMaterialComplementarController);

export default router;
