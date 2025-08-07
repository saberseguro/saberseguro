import { Request, Response } from 'express';
import {
  buscarCategoria,
  buscarCategorias,
  criarCategoria,
  editarCategoria,
  excluirCategoria
} from '../../models/curso/categoria';

export const buscarCategoriasController = async (req: Request, res: Response) => {
  try {
    const categorias = await buscarCategorias.execute();
    return res.json(categorias);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const buscarCategoriaController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });

    const categoria = await buscarCategoria.execute(id);
    if (!categoria) return res.status(404).json({ error: 'Categoria não encontrada' });

    return res.json(categoria);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const criarCategoriaController = async (req: Request, res: Response) => {
  try {
    const categoria = await criarCategoria.execute(req.body, req.user as any);
    return res.status(201).json(categoria);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const editarCategoriaController = async (req: Request, res: Response) => {
  try {
    const categoria = await editarCategoria.execute(Number(req.params.id), req.body, req.user as any);
    return res.json(categoria);
  } catch (err: any) {
    if (err.message?.includes("Nenhuma categoria encontrada")) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
};

export const excluirCategoriaController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });

    await excluirCategoria.execute(id, req.user as any);
    return res.status(200).json({ message: 'Categoria excluída com sucesso.' });
  } catch (err: any) {
    if (err.message?.includes("Nenhuma categoria encontrada")) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
};