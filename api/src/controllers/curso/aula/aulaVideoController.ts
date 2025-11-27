import { Request, Response } from 'express';
import { listarAulaVideo, criarAulaVideo, editarAulaVideo, excluirAulaVideo } from '../../../models/curso/aula/aulaVideo';

export const listarVideosController = async (req: Request, res: Response) => {
  try {
    const dados = await listarAulaVideo.execute(Number(req.params.idAula));
    return res.json(dados);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const criarVideoController = async (req: Request, res: Response) => {
  try {
    const resultado = await criarAulaVideo.execute(Number(req.params.idAula), req.body, req.user as any);
    return res.status(201).json(resultado);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const editarVideoController = async (req: Request, res: Response) => {
  try {
    const video = await editarAulaVideo.execute(Number(req.params.id), req.body, req.user as any);
    return res.json(video);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const excluirVideoController = async (req: Request, res: Response) => {
  try {
    await excluirAulaVideo.execute(Number(req.params.id), req.user as any);
    return res.json({ message: 'Vídeo excluído com sucesso.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};
