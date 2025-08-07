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
    if (err.message?.includes("O curso precisa de pelo menos uma categoria válida")) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
};

export const editarCursoController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido.' });
    }

    const curso = await editarCurso.execute(id, req.body, req.user as any);
    return res.json(curso);
  } catch (err: any) {
    if (err.message?.includes("Nenhum curso encontrado")) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
};

export const excluirCursoController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido.' });
    }

    await excluirCurso.execute(id, req.user as any);
    return res.status(200).json({ message: 'Curso excluído com sucesso.' });
  } catch (err: any) {
    if (err.message?.includes("Nenhum curso encontrado")) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
};