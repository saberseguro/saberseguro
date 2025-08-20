import { Request, Response } from 'express';
import {
  criarSetor,
  editarSetor,
  buscarSetoresUnidade,
  buscarCargosSetor,
  buscarsetor,
} from '../../models/empresa/setor';
import { BuscarOpts } from '../../types/BuscarOpts';

export const buscarSetoreController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'ID do setor ausente' });
    const setor = await buscarsetor.execute(parseInt(id));
    if (!setor) return res.status(404).json({ error: 'Nenhum setor encontrado' });
    return res.json(setor);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const buscarSetoresUnidadeController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'ID da unidade ausente' });

    const { fkEmpresaId } = req.query;

    const opts: BuscarOpts = {
      includeCursos: req.query.includeCursos === "1",
      includeMedidas: req.query.includeMedidas === "1",
    };

    const setores = await buscarSetoresUnidade.execute(
      parseInt(id),
      opts,
      fkEmpresaId ? parseInt(fkEmpresaId as string) : undefined
    );
    if (!setores.length) return res.status(404).json({ error: 'Nenhum setor encontrado' });
    return res.json(setores);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const buscarCargosSetorController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'ID do setor ausente' });
    const cargos = await buscarCargosSetor.execute(parseInt(id));
    if (!cargos.length) return res.status(404).json({ error: 'Nenhum cargo encontrado' });
    return res.json(cargos);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const criarSetorController = async (req: Request, res: Response) => {
  try {
    const idUsuario = (req.user as any)?.idUsuario;
    const setor = await criarSetor.execute({ ...req.body, idUsuario });
    return res.status(201).json(setor);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const editarSetorController = async (req: Request, res: Response) => {
  try {
    const idUsuario = (req.user as any)?.idUsuario;
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'ID do setor ausente' });
    const setor = await editarSetor.execute(parseInt(id), { ...req.body, idUsuario });
    return res.json(setor);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};