// medidaRoutes.ts
import { Router } from 'express';
import { buscarMedidaController, buscarMedidasController, buscarVinculosDaMedidaController, criarMedidaController, criarMedidaVinculoController, editarMedidaController, excluirMedidaController, excluirMedidaVinculoController } from '../controllers/medidaController';
import { authorize } from '../middlewares/authorize';

const router = Router();

router.get('/', authorize(['ver_medidas']), buscarMedidasController);
router.get('/:id', authorize(['ver_medidas']), buscarMedidaController);
router.post('/', authorize(['criar_medidas']),criarMedidaController);
router.put('/:id', authorize(['editar_medidas']),editarMedidaController);
router.delete('/:id', authorize(['excluir_medidas']),excluirMedidaController);

router.post('/medida/:id/vinculo', authorize(['criar_medidas']), criarMedidaVinculoController);
router.get('/medida/:id/vinculos', authorize(['criar_medidas']), buscarVinculosDaMedidaController);
router.delete('/medida/vinculo/:id', authorize(['criar_medidas']), excluirMedidaVinculoController);

export default router;
