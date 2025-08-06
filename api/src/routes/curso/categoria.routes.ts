import { Router } from 'express';
import { authorize } from '../../middlewares/authorize';

const router = Router();

router.get('/', authorize(['ver_cursos']), () => {});
router.get('/:id', authorize(['ver_cursos']), () => {});
router.post('/', authorize(['criar_cursos']), () => {});
router.put('/:id', authorize(['editar_cursos']), () => {});
router.delete('/:id', authorize(['excluir_cursos']), () => {});

export default router;