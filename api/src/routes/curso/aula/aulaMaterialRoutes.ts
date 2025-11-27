import { Router } from 'express';
import { authorize } from '../../../middlewares/authorize';
import {
  listarMateriaisController,
  criarMaterialController,
  editarMaterialController,
  excluirMaterialController,
} from '../../../controllers/curso/aula/aulaMaterialController';

const router = Router();

router.get('/:idAula', authorize(['ver_cursos']), listarMateriaisController);
router.post('/:idAula', authorize(['criar_cursos']), criarMaterialController);
router.put('/:id', authorize(['editar_cursos']), editarMaterialController);
router.delete('/:id', authorize(['excluir_cursos']), excluirMaterialController);

export default router;
