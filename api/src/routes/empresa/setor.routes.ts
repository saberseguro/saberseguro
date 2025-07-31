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

router.get('/:id', authorize(['visualizar_setor']), buscarSetoreController);
router.get('/setoresUnidade/:id', authorize(['visualizar_setor']), buscarSetoresUnidadeController);
router.get('/cargosSetor/:id', authorize(['visualizar_cargo']), buscarCargosSetorController);
router.post('/', authorize(['gerenciar_empresa']), criarSetorController);
router.put('/:id', authorize(['gerenciar_empresa']), editarSetorController);

export default router;