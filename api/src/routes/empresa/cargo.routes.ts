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

router.get('/:id', authorize(['ver_empresas']), buscarCargoController);
router.get('/cargosSetor/:id', authorize(['ver_empresas']), buscarCargosSetorController);
router.post('/', authorize(['criar_empresas']), criarCargoController);
router.put('/:id', authorize(['editar_empresas']), editarCargoController);
router.get('/funcionariosCargo/:id', authorize(['ver_usuarios']), buscarFuncionariosDoCargoController);

export default router;