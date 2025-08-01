import { Request, Response } from 'express';
import {
  buscarCargo,
  buscarCargosSetor,
  criarCargo,
  editarCargo,
  buscarFuncionariosDoCargo,
} from '../../models/empresa/cargo';

export const buscarCargoController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cargo = await buscarCargo.execute(Number(id));
    if (!cargo) return res.status(404).json({ error: 'Cargo não encontrado' });
    return res.json(cargo);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const buscarCargosSetorController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cargos = await buscarCargosSetor.execute(Number(id));
    return res.json(cargos);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const criarCargoController = async (req: Request, res: Response) => {
  try {
    const idUsuario = (req.user as any)?.idUsuario;
    const cargo = await criarCargo.execute({ ...req.body, idUsuario });
    return res.status(201).json(cargo);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const editarCargoController = async (req: Request, res: Response) => {
  try {
    const idUsuario = (req.user as any)?.idUsuario;
    const { id } = req.params;
    const cargo = await editarCargo.execute(Number(id), { ...req.body, idUsuario });
    return res.json(cargo);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const buscarFuncionariosDoCargoController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const funcionarios = await buscarFuncionariosDoCargo.execute(Number(id));
    if (!funcionarios.length) return res.status(404).json({ error: 'Nenhum funcionário encontrado' });
    return res.json(funcionarios);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
