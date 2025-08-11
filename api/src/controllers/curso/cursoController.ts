// controllers/cursoController.ts
import { Request, Response } from 'express';
import { adicionarMedidasAoCurso, buscarCurso, buscarCursoAcessos, buscarCursos, criarCurso, criarCursoAcesso, editarCurso, excluirCurso, excluirCursoAcesso, removerMedidaDoCurso, syncCurso } from '../../models/curso/curso';

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
    const resultado = await buscarCursos.execute(req.query);
    if (!resultado.data.length) {
      return res.status(404).json({ error: 'Nenhum curso encontrado' });
    }
    return res.json(resultado);
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

// Adicionar Medidas
export const adicionarMedidasAoCursoController = async (req: Request, res: Response) => {
  try {
    const idCurso = Number(req.params.id);
    const medidas = req.body.medidas; // deve ser um array de objetos { id, validade }

    if (!Array.isArray(medidas) || medidas.length === 0) {
      return res.status(400).json({ error: 'Informe uma lista de medidas com validade.' });
    }

    const resultado = await adicionarMedidasAoCurso.execute(idCurso, medidas, req.user as any);
    return res.status(201).json(resultado);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const removerMedidaDoCursoController = async (req: Request, res: Response) => {
  try {
    const idCurso = Number(req.params.id);
    const idMedida = Number(req.params.idMedida);

    const resultado = await removerMedidaDoCurso.execute(idCurso, idMedida, req.user as any);
    return res.json(resultado);
  } catch (err: any) {
    if (err.message.includes('Vínculo não encontrado')) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
};

// Controlar Acessos
export const buscarCursoAcessosController = async (req: Request, res: Response) => {
  try {
    const idCurso = Number(req.params.id);
    if (isNaN(idCurso)) return res.status(400).json({ error: 'ID inválido.' });

    const acessos = await buscarCursoAcessos.execute(idCurso);
    return res.json(acessos);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const criarCursoAcessoController = async (req: Request, res: Response) => {
  try {
    const resultado = await criarCursoAcesso.execute(req.body, req.user as any);
    return res.status(201).json(resultado);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const excluirCursoAcessoController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });

    await excluirCursoAcesso.execute(id, req.user as any);
    return res.json({ message: 'Acesso removido com sucesso.' });
  } catch (err: any) {
    if (err.message.includes('Acesso não encontrado')) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
};

// Sincronização
export const syncCursoController = async (req: Request, res: Response) => {
  try {
    const idCursoParam = Number(req.params.id) || 0;
    const result = await syncCurso.execute(idCursoParam, req.body, req.user as any);
    return res.json(result);
  } catch (e:any) {
    return res.status(400).json({ error: e.message });
  }
};