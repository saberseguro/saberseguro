import { Router } from 'express';
import { authorize } from '../../middlewares/authorize';
import {
  criarSetorController,
  editarSetorController,
  buscarSetoresUnidadeController,
  buscarCargosSetorController,
  buscarSetoreController,
} from '../../controllers/empresa/setorController';

const router = Router();

router.get('/:id', authorize(['ver_empresas']), buscarSetoreController);
router.get('/setoresUnidade/:id', authorize(['ver_empresas']), buscarSetoresUnidadeController);
router.get('/cargosSetor/:id', authorize(['ver_empresas']), buscarCargosSetorController);
router.post('/', authorize(['criar_empresas']), criarSetorController);
router.put('/:id', authorize(['editar_empresas']), editarSetorController);

export default router;