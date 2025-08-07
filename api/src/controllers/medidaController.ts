import { Request, Response } from 'express';
import { buscarMedida, buscarMedidas, buscarVinculosDaMedida, criarMedida, criarMedidaVinculo, editarMedida, excluirMedida, excluirMedidaVinculo } from '../models/medida';

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
    const empresaId = (req.user as any).fkEmpresaId;
    const medidas = await buscarMedidas.execute(empresaId);
    return res.json(medidas);
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

export const excluirMedidaController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });

    await excluirMedida.execute(id, req.user as any);
    return res.status(200).json({ message: 'Medida desativada com sucesso.' });
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