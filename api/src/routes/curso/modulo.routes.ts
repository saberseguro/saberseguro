import { Router } from 'express';
import { authorize } from '../../middlewares/authorize';
import { buscarModuloController, criarModuloController, editarModuloController, excluirModuloController, reordenarModulosController } from '../../controllers/curso/moduloController';

const router = Router();

router.get('/:id', authorize(['ver_cursos']), buscarModuloController);
router.post('/', authorize(['criar_cursos']), criarModuloController);
router.post("/reordenar", authorize(['editar_cursos']), reordenarModulosController);
router.put('/:id', authorize(['editar_cursos']), editarModuloController);
router.delete('/:id', authorize(['excluir_cursos']), excluirModuloController);

export default router;