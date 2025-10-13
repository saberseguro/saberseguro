import { Router } from 'express';
import { authorize } from '../../middlewares/authorize';
import { buscarEmpresaController, buscarEmpresasController, criarEmpresaController, editarEmpresaController, getResumoCertificadoEmpresaController } from '../../controllers/empresa/empresaController';

const router = Router();

router.get('/:id', authorize(['ver_empresas']), buscarEmpresaController);
router.get('/', authorize(['ver_empresas']), buscarEmpresasController);
router.post('/', authorize(['criar_empresas']), criarEmpresaController);
router.put('/:id', authorize(['editar_empresas']), editarEmpresaController);
router.get("/certificado/resumo", authorize(["ver_cursos"]), getResumoCertificadoEmpresaController);

export default router;