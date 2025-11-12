import { Router } from 'express';
import { authorize } from '../../../middlewares/authorize';
import { criarStepController, editarStepController, excluirStepController, listarStepsController, reordenarStepsController } from '../../../controllers/curso/aula/aulaStepsController';


const router = Router();

router.get('/:idAula', authorize(['ver_cursos']), listarStepsController);
router.post('/:idAula', authorize(['criar_cursos']), criarStepController);
router.put('/:id', authorize(['editar_cursos']), editarStepController);
router.delete('/:id', authorize(['excluir_cursos']), excluirStepController);
router.put('/:idAula/reordenar', authorize(['editar_cursos']), reordenarStepsController);

export default router;
