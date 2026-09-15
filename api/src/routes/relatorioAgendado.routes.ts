import { Router } from "express";
import { authorize } from "../middlewares/authorize";
import {
  listarRelatorioAgendadoController,
  criarRelatorioAgendadoController,
  atualizarRelatorioAgendadoController,
  removerRelatorioAgendadoController,
  alternarAtivoRelatorioAgendadoController,
} from "../controllers/relatorio/relatorioAgendadoController";

const router = Router();

router.get("/", authorize(["editar_empresas"]), listarRelatorioAgendadoController);
router.post("/", authorize(["editar_empresas"]), criarRelatorioAgendadoController);
router.put("/:id", authorize(["editar_empresas"]), atualizarRelatorioAgendadoController);
router.patch("/:id/ativo", authorize(["editar_empresas"]), alternarAtivoRelatorioAgendadoController);
router.delete("/:id", authorize(["editar_empresas"]), removerRelatorioAgendadoController);

export default router;
