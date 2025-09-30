import { Request, Response } from 'express';
import {
  buscarResponsaveisTecnicos,
  buscarResponsavelTecnico,
  criarResponsavelTecnico,
  editarResponsavelTecnico,
  excluirResponsavelTecnico,
} from '../../models/curso/responsavelTecnico';

export const buscarResponsaveisTecnicosController = async (req: Request, res: Response) => {
  try {
    const responsaveis = await buscarResponsaveisTecnicos.execute();
    return res.json(responsaveis);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const buscarResponsavelTecnicoController = async (req: Request, res: Response) => {
  try {
    const responsavel = await buscarResponsavelTecnico.execute(Number(req.params.id));
    if (!responsavel) return res.status(404).json({ error: 'Responsável Técnico não encontrado' });
    return res.json(responsavel);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const criarResponsavelTecnicoController = async (req: Request, res: Response) => {
  try {
    const responsavel = await criarResponsavelTecnico.execute(req.body, req.user as any);
    return res.status(201).json(responsavel);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const editarResponsavelTecnicoController = async (req: Request, res: Response) => {
  try {
    const responsavel = await editarResponsavelTecnico.execute(
      Number(req.params.id),
      req.body,
      req.user as any
    );
    return res.json(responsavel);
  } catch (err: any) {
    if (err.message?.includes("Nenhum responsável técnico encontrado")) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
};

export const excluirResponsavelTecnicoController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido.' });
    }

    await excluirResponsavelTecnico.execute(id, req.user as any);
    return res.status(200).json({ message: 'Responsável Técnico excluído com sucesso.' });
  } catch (err: any) {
    if (err.message?.includes("Nenhum responsável técnico encontrado")) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
};