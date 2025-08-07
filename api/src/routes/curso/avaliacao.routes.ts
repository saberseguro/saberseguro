import { Router } from 'express';
import { authorize } from '../../middlewares/authorize';
import { buscarAvaliacaoController, buscarAvaliacoesController, criarAlternativaController, criarAvaliacaoController, criarPerguntaController, editarAlternativaController, editarAvaliacaoController, editarPerguntaController, excluirAvaliacaoController, finalizarAvaliacaoController, iniciarAvaliacaoController, responderAvaliacaoController } from '../../controllers/curso/avaliacaoController';

const router = Router();

router.get('/', authorize(['ver_avaliacoes']), buscarAvaliacoesController);
router.get('/:id', authorize(['ver_avaliacoes']), buscarAvaliacaoController);

router.post('/', authorize(['criar_avaliacoes']), criarAvaliacaoController);
router.post('/:id/pergunta', authorize(['criar_avaliacoes']), criarPerguntaController);
router.post('/pergunta/:id/alternativa', authorize(['criar_avaliacoes']), criarAlternativaController);

router.post('/:id/iniciar', authorize(['responder_avaliacoes']), iniciarAvaliacaoController);
router.post('/:id/responder', authorize(['responder_avaliacoes']), responderAvaliacaoController);
router.post('/:id/finalizar', authorize(['responder_avaliacoes']), finalizarAvaliacaoController);

router.put('/:id', authorize(['editar_avaliacoes']), editarAvaliacaoController);
router.put('/:id/pergunta', authorize(['editar_avaliacoes']), editarPerguntaController);
router.put('/pergunta/:id/alternativa', authorize(['editar_avaliacoes']), editarAlternativaController);

router.delete('/:id', authorize(['excluir_avaliacoes']), excluirAvaliacaoController);

export default router;