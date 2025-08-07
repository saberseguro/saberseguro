import { Router } from 'express';
import { authorize } from '../../middlewares/authorize';
import {
  buscarAulaController,
  criarAulaController,
  editarAulaController,
  excluirAulaController,
} from '../../controllers/curso/aulaController';

const router = Router();

router.get('/:id', authorize(['ver_cursos']), buscarAulaController);
router.post('/', authorize(['criar_cursos']), criarAulaController);
router.put('/:id', authorize(['editar_cursos']), editarAulaController);
router.delete('/:id', authorize(['excluir_cursos']), excluirAulaController);

export default router;