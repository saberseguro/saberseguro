import { Router } from 'express';
import { authorize } from '../../middlewares/authorize';
import { buscarUnidadeController, buscarUnidadesEmpresaController, criarUnidadeController, editarUnidadeController } from '../../controllers/empresa/unidadeController';

const router = Router();

router.get('/:id', authorize(['visualizar_unidade']), buscarUnidadeController);
router.get('/unidadesEmpresa/:id', authorize(['visualizar_unidade']), buscarUnidadesEmpresaController);
router.post('/', authorize(['gerenciar_empresa']), criarUnidadeController);
router.put('/:id', authorize(['gerenciar_empresa']), editarUnidadeController);

export default router;
