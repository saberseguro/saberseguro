import { Router } from "express";
import { authorize } from "../middlewares/authorize";
import { gerarRelatorioController } from "../controllers/relatorio/gerarRelatorioController";

const router = Router();

router.post("/gerar", authorize(["ver_usuarios"]), gerarRelatorioController);

export default router;