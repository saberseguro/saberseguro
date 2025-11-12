import { Router } from 'express';
import { authorize } from '../../../middlewares/authorize';
import { criarVideoController, editarVideoController, excluirVideoController, listarVideosController } from '../../../controllers/curso/aula/aulaVideoController';

const router = Router();

router.get('/:idAula', authorize(['ver_cursos']), listarVideosController);
router.post('/:idAula', authorize(['criar_cursos']), criarVideoController);
router.put('/:id', authorize(['editar_cursos']), editarVideoController);
router.delete('/:id', authorize(['excluir_cursos']), excluirVideoController);

export default router;
