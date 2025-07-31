import { Router } from 'express';
import { authorize } from '../middlewares/authorize';
import {
  buscarUsuarioController,
  criarUsuarioController,
  editarUsuarioController,
  buscarRoleComPermissoes,
  verificarHorarioAcessoController
} from '../controllers/usuarioController';

const router = Router();

router.get('/', authorize(['visualizar_usuarios']), buscarUsuarioController);
router.post('/', authorize(['gerenciar_usuarios']), criarUsuarioController);
router.put('/:id', authorize(['gerenciar_usuarios']), editarUsuarioController);
router.get('/roles', authorize(['gerenciar_usuarios']), buscarRoleComPermissoes);
router.post('/verificarHorarioAcesso', verificarHorarioAcessoController);

export default router;