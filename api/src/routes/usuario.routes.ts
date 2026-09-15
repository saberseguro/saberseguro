import { Router } from 'express';
import { authorize } from '../middlewares/authorize';
import {
  buscarUsuarioController,
  criarUsuarioController,
  editarUsuarioController,
  buscarRoleComPermissoes,
  verificarHorarioAcessoController,
  buscarDetalhesUsuarioController,
  gerarLinkRedefinicaoSenhaController
} from '../controllers/usuarioController';

const router = Router();

router.get('/', authorize(['ver_usuarios']), buscarUsuarioController);
router.post('/', authorize(['criar_usuarios']), criarUsuarioController);
router.put('/:id', authorize(['editar_usuarios']), editarUsuarioController);
router.get('/roles', authorize(['ver_usuarios']), buscarRoleComPermissoes);
// Precisa vir DEPOIS de "/roles": como ambas são GET, "/roles" seria
// capturada por "/:id" (com id="roles") se essa rota viesse antes.
router.get('/:id', authorize(['ver_usuarios']), buscarDetalhesUsuarioController);
router.post('/:id/link-redefinicao-senha', authorize(['editar_usuarios']), gerarLinkRedefinicaoSenhaController);
router.post('/verificarHorarioAcesso', verificarHorarioAcessoController);

export default router;