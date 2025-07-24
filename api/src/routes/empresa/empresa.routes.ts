import { Router } from 'express';
import { authorize } from '../../middlewares/authorize';
import { buscarEmpresaController, criarEmpresaController, editarEmpresaController } from '../../controllers/empresa/empresaController';

const router = Router();

router.get('/:id', authorize(['visualizar_empresa']), buscarEmpresaController);
router.post('/', authorize(['gerenciar_empresa']), criarEmpresaController);
router.put('/:id', authorize(['gerenciar_empresa']), editarEmpresaController);

export default router;