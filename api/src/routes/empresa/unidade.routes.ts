import { Router } from 'express';
import { authorize } from '../../middlewares/authorize';
import { buscarUnidadeController, buscarUnidadesEmpresaController, criarUnidadeController, editarUnidadeController } from '../../controllers/empresa/unidadeController';

const router = Router();

router.get('/:id', authorize(['ver_empresas']), buscarUnidadeController);
router.get('/unidadesEmpresa/:id', authorize(['ver_empresas']), buscarUnidadesEmpresaController);
router.post('/', authorize(['criar_empresas']), criarUnidadeController);
router.put('/:id', authorize(['editar_empresas']), editarUnidadeController);

export default router;
