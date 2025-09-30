import { Router } from 'express';
import { authorize } from '../../middlewares/authorize';
import {
  buscarResponsaveisTecnicosController,
  buscarResponsavelTecnicoController,
  criarResponsavelTecnicoController,
  editarResponsavelTecnicoController,
  excluirResponsavelTecnicoController,
} from '../../controllers/curso/responsavelTecnicoController';

const router = Router();

// Listar todos
router.get('/', authorize(['ver_cursos']), buscarResponsaveisTecnicosController);

// Buscar por ID
router.get('/:id', authorize(['ver_cursos']), buscarResponsavelTecnicoController);

// Criar
router.post('/', authorize(['criar_cursos']), criarResponsavelTecnicoController);

// Editar
router.put('/:id', authorize(['editar_cursos']), editarResponsavelTecnicoController);

// Excluir
router.delete('/:id', authorize(['excluir_cursos']), excluirResponsavelTecnicoController);

export default router;
