import { Router } from "express";
import {
  listarModelosCertificadoController,
  criarModeloCertificadoController,
  editarModeloCertificadoController,
  excluirModeloCertificadoController,
  buscarModeloCertificadoController,
} from "../../controllers/curso/certificadoController";
import { authorize } from "../../middlewares/authorize";

const router = Router();

router.get("/", authorize(["ver_certificados"]), listarModelosCertificadoController);
router.get("/:id", authorize(["ver_certificados"]), buscarModeloCertificadoController);
router.post("/", authorize(["criar_certificados"]), criarModeloCertificadoController);
router.put("/:id", authorize(["criar_certificados"]), editarModeloCertificadoController);
router.delete("/:id", authorize(["criar_certificados"]), excluirModeloCertificadoController);

export default router;
