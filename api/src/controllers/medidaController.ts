import { Request, Response } from 'express';
import { buscarMedida, buscarMedidas, buscarVinculosDaMedida, criarMedida, criarMedidaVinculo, editarMedida, excluirMedida, atualizarStatusMedida, excluirMedidaVinculo, listarCursosDaMedida, vincularCursoNaMedida, desvincularCursoDaMedida } from '../models/medida';

export const buscarMedidaController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });

    const medida = await buscarMedida.execute(id);
    if (!medida) return res.status(404).json({ error: 'Medida não encontrada' });

    return res.json(medida);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const buscarMedidasController = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const empresaId = user.fkEmpresaId;
    const roles = user.roles ?? [];
    const isAdmin = Array.isArray(roles)
      ? roles.includes("admin")
      : roles === "admin";

    const resultado = await buscarMedidas.execute(req.query, empresaId, isAdmin);
    return res.json(resultado);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const criarMedidaController = async (req: Request, res: Response) => {
  try {
    const medida = await criarMedida.execute(req.body, req.user as any);
    return res.status(201).json(medida);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const editarMedidaController = async (req: Request, res: Response) => {
  try {
    const medida = await editarMedida.execute(Number(req.params.id), req.body, req.user as any);
    return res.json(medida);
  } catch (err: any) {
    if (err.message?.includes('Nenhuma medida encontrada')) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
};

export const atualizarStatusMedidaController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });

    const { ativo } = req.body;
    if (![0, 1].includes(Number(ativo))) {
      return res.status(400).json({ error: 'Campo "ativo" deve ser 0 ou 1.' });
    }

    const medida = await atualizarStatusMedida.execute(id, ativo, req.user as any);
    return res.json(medida);
  } catch (err: any) {
    if (err.message?.includes('Nenhuma medida encontrada')) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
};

export const excluirMedidaController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });

    await excluirMedida.execute(id, req.user as any);
    return res.status(200).json({ ok: true, message: 'Medida desativada com sucesso.' }); // compatível com front
  } catch (err: any) {
    if (err.message?.includes('Nenhuma medida encontrada')) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
};


// Vínculos
export const buscarVinculosDaMedidaController = async (req: Request, res: Response) => {
  try {
    const idMedida = Number(req.params.id);
    if (isNaN(idMedida)) return res.status(400).json({ error: 'ID inválido.' });

    const vinculos = await buscarVinculosDaMedida.execute(idMedida);
    return res.json(vinculos);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const criarMedidaVinculoController = async (req: Request, res: Response) => {
  try {
    const resultado = await criarMedidaVinculo.execute(req.body, req.user as any);
    return res.status(201).json(resultado);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const excluirMedidaVinculoController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });

    await excluirMedidaVinculo.execute(id, req.user as any);
    return res.json({ message: 'Vínculo excluído com sucesso.' });
  } catch (err: any) {
    if (err.message.includes('Vínculo não encontrado')) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
};


export const listarCursosDaMedidaController = async (req: Request, res: Response) => {
  try {
    const fkMedidaId = Number(req.params.id);
    if (isNaN(fkMedidaId)) return res.status(400).json({ error: 'ID inválido.' });
    const data = await listarCursosDaMedida.execute(fkMedidaId);
    return res.json(data);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const vincularCursoNaMedidaController = async (req: Request, res: Response) => {
  try {
    const fkMedidaId = Number(req.params.id);
    const { fkCursoId, validade } = req.body;

    if (isNaN(fkMedidaId) || isNaN(Number(fkCursoId))) {
      return res.status(400).json({ error: 'Dados inválidos.' });
    }
    if (validade !== undefined && isNaN(Number(validade))) {
      return res.status(400).json({ error: 'Campo "validade" deve ser número.' });
    }

    const vinculo = await vincularCursoNaMedida.execute(
      fkMedidaId,
      Number(fkCursoId),
      req.user as any,
      validade !== undefined ? Number(validade) : undefined
    );

    return res.status(201).json(vinculo);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const desvincularCursoDaMedidaController = async (req: Request, res: Response) => {
  try {
    const fkMedidaId = Number(req.params.id);
    const fkCursoId = Number(req.params.fkCursoId);

    if (isNaN(fkMedidaId) || isNaN(fkCursoId)) {
      return res.status(400).json({ error: 'IDs inválidos.' });
    }

    await desvincularCursoDaMedida.execute(fkMedidaId, fkCursoId, req.user as any);
    return res.json({ message: 'Vínculo removido com sucesso.' });
  } catch (err: any) {
    if (err.message.includes('Vínculo não encontrado')) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
};