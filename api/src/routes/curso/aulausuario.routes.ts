import { Router } from 'express';
import { authorize } from '../../middlewares/authorize';
import { buscarProgressoAulaController, iniciarCursoController, registrarAulaStepController, verificarConclusaoModuloController } from '../../controllers/curso/aulausuarioController';

const router = Router();

router.get('/:idAula/progresso', authorize(['ver_cursos']), buscarProgressoAulaController);

router.post('/step', authorize(['ver_cursos']), registrarAulaStepController);
router.post("/curso/iniciar", authorize(["ver_cursos"]), iniciarCursoController);
router.post("/modulo/verificar-conclusao", authorize(["ver_cursos"]), verificarConclusaoModuloController);


export default router;