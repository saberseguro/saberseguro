import { Router } from 'express';
import { authorize } from '../../middlewares/authorize';
import {
  buscarCargoController,
  buscarCargosSetorController,
  buscarFuncionariosDoCargoController,
  criarCargoController,
  editarCargoController
} from '../../controllers/empresa/cargoController';

const router = Router();

router.get('/:id', authorize(['visualizar_cargo']), buscarCargoController);
router.get('/cargosSetor/:id', authorize(['visualizar_cargo']), buscarCargosSetorController);
router.post('/', authorize(['gerenciar_empresa']), criarCargoController);
router.put('/:id', authorize(['gerenciar_empresa']), editarCargoController);
router.get('/funcionariosCargo/:id', authorize(['visualizar_funcionarios']), buscarFuncionariosDoCargoController);

export default router;