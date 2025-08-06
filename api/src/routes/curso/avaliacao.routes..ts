import { Router } from 'express';
import { authorize } from '../../middlewares/authorize';

const router = Router();

router.get('/', authorize(['ver_avaliacoes']), () => {});
router.get('/:id', authorize(['ver_avaliacoes']), () => {});

router.post('/', authorize(['criar_avaliacoes']), () => {});
router.post('/:id/pergunta', authorize(['criar_avaliacoes']), () => {});
router.post('/pergunta/:id/alternativa', authorize(['criar_avaliacoes']), () => {});

router.post('/:id/responder', authorize(['responder_avaliacoes']), () => {});

router.put('/:id', authorize(['editar_avaliacoes']), () => {});
router.put('/:id/pergunta', authorize(['editar_avaliacoes']), () => {});
router.put('/pergunta/:id/alternativa', authorize(['editar_avaliacoes']), () => {});

router.delete('/:id', authorize(['excluir_avaliacoes']), () => {});

export default router;