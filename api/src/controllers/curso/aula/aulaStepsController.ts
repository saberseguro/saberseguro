import { Request, Response } from 'express';
import { criarAulaStep, editarAulaStep, excluirAulaStep, listarAulaStep, reordenarAulaSteps } from '../../../models/curso/aula/aulaSteps';

export const listarStepsController = async (req: Request, res: Response) => {
  try {
    const dados = await listarAulaStep.execute(Number(req.params.idAula));
    return res.json(dados);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const criarStepController = async (req: Request, res: Response) => {
  try {
    const resultado = await criarAulaStep.execute(Number(req.params.idAula), req.body, req.user as any);
    return res.status(201).json(resultado);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const editarStepController = async (req: Request, res: Response) => {
  try {
    const step = await editarAulaStep.execute(Number(req.params.id), req.body, req.user as any);
    return res.json(step);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const excluirStepController = async (req: Request, res: Response) => {
  try {
    await excluirAulaStep.execute(Number(req.params.id), req.user as any);
    return res.json({ message: 'Etapa removida com sucesso.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const reordenarStepsController = async (req: Request, res: Response) => {
  try {
    await reordenarAulaSteps.execute(Number(req.params.idAula), req.body.itens, req.user as any);
    return res.json({ message: 'Ordem atualizada com sucesso.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};
