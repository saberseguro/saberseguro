import { Router } from 'express';
import { authorize } from '../../middlewares/authorize';
import {
  buscarCategoriaController,
  buscarCategoriasController,
  criarCategoriaController,
  editarCategoriaController,
  excluirCategoriaController
} from '../../controllers/curso/categoriaController';

const router = Router();

router.get('/', authorize(['ver_cursos']), buscarCategoriasController);
router.get('/:id', authorize(['ver_cursos']), buscarCategoriaController);
router.post('/', authorize(['criar_cursos']), criarCategoriaController);
router.put('/:id', authorize(['editar_cursos']), editarCategoriaController);
router.delete('/:id', authorize(['excluir_cursos']), excluirCategoriaController);

export default router;
