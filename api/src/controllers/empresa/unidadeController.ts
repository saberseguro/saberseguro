import { Request, Response } from 'express';
import { buscarUnidade, buscarUnidadesEmpresa, criarUnidade, editarUnidade } from '../../models/empresa/unidade';
import { BuscarOpts } from '../../types/BuscarOpts';

export const buscarUnidadeController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) return res.status(400).json({ error: 'ID da unidade ausente' });

    const unidade = await buscarUnidade.execute(parseInt(id));
    if (!unidade) return res.status(404).json({ error: 'Nenhuma unidade encontrada' });
    return res.json(unidade);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const buscarUnidadesEmpresaController = async (req: Request, res: Response) => {
  try {
    const idEmpresa = Number(req.params.id);
    if (isNaN(idEmpresa)) return res.status(400).json({ error: "ID inválido" });

    const opts: BuscarOpts = {
      includeCursos: req.query.includeCursos === "1",
      includeMedidas: req.query.includeMedidas === "1",
    };

    const unidades = await buscarUnidadesEmpresa.execute(idEmpresa, opts);
    return res.json(unidades);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};


export const criarUnidadeController = async (req: Request, res: Response) => {
  try {
    const idUsuario = (req.user as any)?.idUsuario;

    const unidade = await criarUnidade.execute({ ...req.body, idUsuario });
    return res.status(201).json(unidade);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const editarUnidadeController = async (req: Request, res: Response) => {
  try {
    const idUsuario = (req.user as any)?.idUsuario;

    const { id } = req.params;

    if (!id) return res.status(400).json({ error: 'ID da unidade ausente' });

    const unidade = await editarUnidade.execute(parseInt(id), { ...req.body, idUsuario });
    return res.json(unidade);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
