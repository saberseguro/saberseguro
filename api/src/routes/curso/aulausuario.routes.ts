import { Router } from 'express';
import { authorize } from '../../middlewares/authorize';

const router = Router();

router.get('/:id/progresso/:usuarioId', authorize(['ver_cursos']), () => {});
router.post('/aula/:id/material/:id/download', authorize(['criar_cursos']), () => {});
router.post('/aula/:id/progresso', authorize(['criar_cursos']), () => {});

export default router;