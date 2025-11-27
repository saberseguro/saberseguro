import { Request, Response } from 'express';
import { buscarAula, criarAula, editarAula, excluirAula, reordenarAulas } from '../../models/curso/aula';


export const buscarAulaController = async (req: Request, res: Response) => {
  try {
    const aula = await buscarAula.execute(Number(req.params.id));
    if (!aula) return res.status(404).json({ error: 'Aula não encontrada' });
    return res.json(aula);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const criarAulaController = async (req: Request, res: Response) => {
  try {
    const resultado = await criarAula.execute(req.body, req.user as any);
    return res.status(201).json(resultado);
  } catch (err: any) {
    if (err.message?.includes("Nenhum módulo encontrado")) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
};

export const editarAulaController = async (req: Request, res: Response) => {
  try {
    const aula = await editarAula.execute(Number(req.params.id), req.body, req.user as any);
    return res.json(aula);
  } catch (err: any) {
    if (err.message?.includes("Nenhuma aula encontrada")) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
};

export const reordenarAulasController = async (req: Request, res: Response) => {
  try {
    const { aulas } = req.body;

    if (!Array.isArray(aulas)) {
      return res.status(400).json({ error: "Formato inválido. Esperado: array de aulas." });
    }

    const resultado = await reordenarAulas.execute(aulas, req.user);
    return res.json(resultado);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const excluirAulaController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });

    await excluirAula.execute(id, req.user as any);
    return res.status(200).json({ message: 'Aula excluída com sucesso.' });
  } catch (err: any) {
    if (err.message?.includes("Nenhuma aula encontrada")) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
};