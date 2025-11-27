import { Request, Response } from 'express';
import {
  buscarModulo,
  criarModulo,
  editarModulo,
  excluirModulo,
  reordenarModulos
} from '../../models/curso/modulo';

export const buscarModuloController = async (req: Request, res: Response) => {
  try {
    const modulo = await buscarModulo.execute(Number(req.params.id));
    if (!modulo) return res.status(404).json({ error: 'Módulo não encontrado' });
    return res.json(modulo);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const criarModuloController = async (req: Request, res: Response) => {
  try {
    const modulo = await criarModulo.execute(req.body, req.user as any);
    return res.status(201).json(modulo);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const editarModuloController = async (req: Request, res: Response) => {
  try {
    const modulo = await editarModulo.execute(Number(req.params.id), req.body, req.user as any);
    return res.json(modulo);
  } catch (err: any) {
    if (err.message?.includes("Nenhum módulo encontrado")) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
};

export const reordenarModulosController = async (req: Request, res: Response) => {
  try {
    const { modulos } = req.body;
    console.log(modulos);
    const idCurso = Number(req.params.idCurso);

    if (!Array.isArray(modulos)) {
      return res.status(400).json({ error: "Formato inválido. Esperado: array de módulos." });
    }

    const result = await reordenarModulos.execute(idCurso, modulos, req.user);
    return res.json(result);

  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const excluirModuloController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido.' });
    }

    await excluirModulo.execute(id, req.user as any);
    return res.status(200).json({ message: 'Módulo excluído com sucesso.' });
  } catch (err: any) {
    if (err.message?.includes("Nenhum módulo encontrado")) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
};
