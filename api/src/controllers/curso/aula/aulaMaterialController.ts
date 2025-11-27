import { Request, Response } from 'express';
import { listarAulaMaterial, criarAulaMaterial, editarAulaMaterial, excluirAulaMaterial } from '../../../models/curso/aula/aulaMaterial';

export const listarMateriaisController = async (req: Request, res: Response) => {
  try {
    const dados = await listarAulaMaterial.execute(Number(req.params.idAula));
    return res.json(dados);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const criarMaterialController = async (req: Request, res: Response) => {
  try {
    const resultado = await criarAulaMaterial.execute(Number(req.params.idAula), req.body, req.user as any);
    return res.status(201).json(resultado);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const editarMaterialController = async (req: Request, res: Response) => {
  try {
    const material = await editarAulaMaterial.execute(Number(req.params.id), req.body, req.user as any);
    return res.json(material);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const excluirMaterialController = async (req: Request, res: Response) => {
  try {
    await excluirAulaMaterial.execute(Number(req.params.id), req.user as any);
    return res.json({ message: 'Material excluído com sucesso.' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};
