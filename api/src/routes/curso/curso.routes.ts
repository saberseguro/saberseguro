import { Router } from 'express';
import { authorize } from '../../middlewares/authorize';
import { buscarCursoAcessosController, buscarCursoController, buscarCursosController, buscarMeusCursosController, criarCursoAcessoController, criarCursoController, desvincularMedidaDoCursoController, editarCursoController, excluirCursoAcessoController, excluirCursoController, listarMedidasDoCursoController, syncCursoController, vincularMedidaAoCursoController } from '../../controllers/curso/cursoController';

const router = Router();

router.get('/', authorize(['ver_cursos']), buscarCursosController);
router.get('/meus', authorize(['ver_cursos']), buscarMeusCursosController);
router.get('/:id', authorize(['ver_cursos']), buscarCursoController);

router.post('/', authorize(['criar_cursos']), criarCursoController);
router.put('/:id', authorize(['editar_cursos']), editarCursoController);
router.delete('/:id', authorize(['excluir_cursos']), excluirCursoController);

// Adicionar Medidas
router.get('/:id/medidas', authorize(['vincular_cursos_medidas']), listarMedidasDoCursoController);
router.post('/:id/medidas', authorize(['vincular_cursos_medidas']), vincularMedidaAoCursoController);
router.delete('/:id/medidas/:fkMedidaId', authorize(['vincular_cursos_medidas']), desvincularMedidaDoCursoController);

// Controlar Acessos
router.post('/curso/:id/acesso', authorize(['criar_cursos']), criarCursoAcessoController);
router.get('/curso/:id/acessos', authorize(['criar_cursos']), buscarCursoAcessosController);
router.delete('/curso/acesso/:id', authorize(['criar_cursos']), excluirCursoAcessoController);

// Sincronização
router.put('/:id/sync', authorize(['editar_cursos']), syncCursoController);
router.post('/sync', authorize(['criar_cursos']), syncCursoController);

export default router;