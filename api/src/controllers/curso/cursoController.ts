// controllers/cursoController.ts
import { Request, Response } from 'express';
import { buscarCurso, buscarCursos, criarCurso, editarCurso, excluirCurso } from '../../models/curso/curso';

export const buscarCursoController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const curso = await buscarCurso.execute(Number(id));
    if (!curso) return res.status(404).json({ error: 'Curso não encontrado' });
    return res.json(curso);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const buscarCursosController = async (req: Request, res: Response) => {
  try {
    const cursos = await buscarCursos.execute(req.query);
    if (!cursos.length) return res.status(404).json({ error: 'Nenhum curso encontrado' });
    return res.json(cursos);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const criarCursoController = async (req: Request, res: Response) => {
  try {
    const curso = await criarCurso.execute(req.body, req.user as any);
    return res.status(201).json(curso);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const editarCursoController = async (req: Request, res: Response) => {
  try {
    const curso = await editarCurso.execute(Number(req.params.id), req.body);
    return res.json(curso);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const excluirCursoController = async (req: Request, res: Response) => {
  try {
    await excluirCurso.execute(Number(req.params.id));
    return res.status(204).send();
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
