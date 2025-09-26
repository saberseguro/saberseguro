import { Request, Response } from 'express';
import { buscarAlternativa, buscarAvaliacao, buscarAvaliacoes, buscarPergunta, criarAlternativa, criarAvaliacao, criarPergunta, editarAlternativa, editarAvaliacao, editarPergunta, excluirAlternativa, excluirAvaliacao, excluirPergunta, finalizarAvaliacao, iniciarAvaliacao, responderAvaliacao, resultadoAvaliacao } from '../../models/curso/avaliacao';

// Avaliação
export const buscarAvaliacaoController = async (req: Request, res: Response) => {
  try {
    const avaliacao = await buscarAvaliacao.execute(Number(req.params.id));
    if (!avaliacao) return res.status(404).json({ error: 'Avaliação não encontrada.' });
    return res.json(avaliacao);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const buscarAvaliacoesController = async (req: Request, res: Response) => {
  try {
    const avaliacoes = await buscarAvaliacoes.execute();
    if (!avaliacoes || avaliacoes.length === 0) {
      return res.status(404).json({ error: 'Nenhuma avaliação encontrada.' });
    }
    return res.json(avaliacoes);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const criarAvaliacaoController = async (req: Request, res: Response) => {
  try {
    const resultado = await criarAvaliacao.execute(req.body, req.user as any);
    return res.status(201).json(resultado);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const editarAvaliacaoController = async (req: Request, res: Response) => {
  try {
    const avaliacao = await editarAvaliacao.execute(Number(req.params.id), req.body, req.user as any);
    return res.json(avaliacao);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const excluirAvaliacaoController = async (req: Request, res: Response) => {
  try {
    await excluirAvaliacao.execute(Number(req.params.id), req.user as any);
    return res.json({ message: 'Avaliação excluída com sucesso.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};



// Pergunta
export const buscarPerguntaController = async (req: Request, res: Response) => {
  try {
    const pergunta = await buscarPergunta.execute(Number(req.params.id));
    if (!pergunta) return res.status(404).json({ error: 'Pergunta não encontrada.' });
    return res.json(pergunta);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const criarPerguntaController = async (req: Request, res: Response) => {
  try {
    const idAvaliacao = Number(req.params.id);
    const resultado = await criarPergunta.execute(idAvaliacao, req.body, req.user as any);
    return res.status(201).json(resultado);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const editarPerguntaController = async (req: Request, res: Response) => {
  try {
    const pergunta = await editarPergunta.execute(Number(req.params.id), req.body, req.user as any);
    return res.json(pergunta);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const excluirPerguntaController = async (req: Request, res: Response) => {
  try {
    await excluirPergunta.execute(Number(req.params.id), req.user as any);
    return res.json({ message: 'Pergunta excluída com sucesso.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};



// Alternativa
export const buscarAlternativaController = async (req: Request, res: Response) => {
  try {
    const alternativa = await buscarAlternativa.execute(Number(req.params.id));
    if (!alternativa) return res.status(404).json({ error: 'Alternativa não encontrada.' });
    return res.json(alternativa);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const criarAlternativaController = async (req: Request, res: Response) => {
  try {
    const idPergunta = Number(req.params.id);
    const resultado = await criarAlternativa.execute(idPergunta, req.body, req.user as any);
    return res.status(201).json(resultado);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const editarAlternativaController = async (req: Request, res: Response) => {
  try {
    const alternativa = await editarAlternativa.execute(Number(req.params.id), req.body, req.user as any);
    return res.json(alternativa);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const excluirAlternativaController = async (req: Request, res: Response) => {
  try {
    await excluirAlternativa.execute(Number(req.params.id), req.user as any);
    return res.json({ message: 'Alternativa excluída com sucesso.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const resultadoAvaliacaoController = async (req: Request, res: Response) => {
  try {
    const idAvaliacao = Number(req.params.id);
    const usuario = req.user as any;

    const resultado = await resultadoAvaliacao.execute(idAvaliacao, usuario);
    return res.json(resultado);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

// Responder avaliação
export const iniciarAvaliacaoController = async (req: Request, res: Response) => {
  try {
    const avaliacaoUsuario = await iniciarAvaliacao.execute(Number(req.params.id), req.user as any);
    return res.status(201).json(avaliacaoUsuario);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const responderAvaliacaoController = async (req: Request, res: Response) => {
  try {
    const resposta = await responderAvaliacao.execute(Number(req.params.id), req.body, req.user as any);
    return res.status(201).json(resposta);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const finalizarAvaliacaoController = async (req: Request, res: Response) => {
  try {
    const resultado = await finalizarAvaliacao.execute(Number(req.params.id), req.user as any);
    return res.json(resultado);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};