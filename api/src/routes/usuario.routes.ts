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

router.get('/', authorize(['ver_usuarios']), buscarUsuarioController);
router.post('/', authorize(['criar_usuarios']), criarUsuarioController);
router.put('/:id', authorize(['editar_usuarios']), editarUsuarioController);
router.get('/roles', authorize(['ver_usuarios']), buscarRoleComPermissoes);
router.post('/verificarHorarioAcesso', verificarHorarioAcessoController);

export default router;