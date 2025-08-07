import { Router } from 'express';
import { authorize } from '../../middlewares/authorize';
import { adicionarMedidasAoCursoController, buscarCursoAcessosController, buscarCursoController, buscarCursosController, criarCursoAcessoController, criarCursoController, editarCursoController, excluirCursoAcessoController, excluirCursoController, removerMedidaDoCursoController } from '../../controllers/curso/cursoController';

const router = Router();

router.get('/', authorize(['ver_cursos']), buscarCursosController);
router.get('/:id', authorize(['ver_cursos']), buscarCursoController);
router.post('/', authorize(['criar_cursos']), criarCursoController);
router.put('/:id', authorize(['editar_cursos']), editarCursoController);
router.delete('/:id', authorize(['excluir_cursos']), excluirCursoController);

// Adicionar Medidas
router.post('/curso/:id/medida', authorize(['criar_cursos']), adicionarMedidasAoCursoController);
router.delete('/curso/:id/medida/:idMedida', authorize(['criar_cursos']), removerMedidaDoCursoController);

// Controlar Acessos
router.post('/curso/:id/acesso', authorize(['criar_cursos']), criarCursoAcessoController);
router.get('/curso/:id/acessos', authorize(['criar_cursos']), buscarCursoAcessosController);
router.delete('/curso/acesso/:id', authorize(['criar_cursos']), excluirCursoAcessoController);

export default router;