import { Router } from 'express';
import { authorize } from '../../middlewares/authorize';
import { buscarCursoController, buscarCursosController, criarCursoController, editarCursoController, excluirCursoController } from '../../controllers/curso/cursoController';

const router = Router();

router.get('/', authorize(['ver_cursos']), buscarCursosController);
router.get('/:id', authorize(['ver_cursos']), buscarCursoController);
router.post('/', authorize(['criar_cursos']), criarCursoController);
router.put('/:id', authorize(['editar_cursos']), editarCursoController);
router.delete('/:id', authorize(['excluir_cursos']), excluirCursoController);

export default router;