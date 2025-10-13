import { Router } from 'express';
import { authorize } from '../middlewares/authorize';
import { buscarMedidaController, buscarMedidasController, buscarVinculosDaMedidaController, criarMedidaController, criarMedidaVinculoController, editarMedidaController, excluirMedidaController, atualizarStatusMedidaController, excluirMedidaVinculoController, listarCursosDaMedidaController, vincularCursoNaMedidaController, desvincularCursoDaMedidaController } from '../controllers/medidaController';

const router = Router();

router.get('/', authorize(['ver_medidas']), buscarMedidasController);
router.get('/:id', authorize(['ver_medidas']), buscarMedidaController);
router.post('/', authorize(['criar_medidas']), criarMedidaController);
router.put('/:id', authorize(['editar_medidas']), editarMedidaController);
router.patch('/:id/status', authorize(['editar_medidas']), atualizarStatusMedidaController);
router.delete('/:id', authorize(['excluir_medidas']), excluirMedidaController);

router.post('/:id/vinculo', authorize(['criar_medidas']), criarMedidaVinculoController);
router.get('/:id/vinculos', authorize(['criar_medidas']), buscarVinculosDaMedidaController);
router.delete('/vinculo/:id', authorize(['criar_medidas']), excluirMedidaVinculoController);

router.get('/:id/cursos', authorize(['vincular_cursos_medidas']), listarCursosDaMedidaController);
router.post('/:id/cursos', authorize(['vincular_cursos_medidas']), vincularCursoNaMedidaController);
router.delete('/:id/cursos/:fkCursoId', authorize(['vincular_cursos_medidas']), desvincularCursoDaMedidaController);
export default router;
