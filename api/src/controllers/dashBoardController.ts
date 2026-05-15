import { Request, Response } from 'express';
import { getDashboardHome } from '../models/dashboard';

export const buscarDashBoard = async (req: Request, res: Response) => {
  try {
    const usuario = req.user;

    const fkEmpresaIdQuery = req.query.fkEmpresaId
      ? Number(req.query.fkEmpresaId)
      : null;

    const fkEmpresaId =
      fkEmpresaIdQuery ||
      usuario?.fkEmpresaId;

    if (!fkEmpresaId) {
      return res.status(400).json({
        erro: "Empresa não selecionada.",
      });
    }

    const dados = await getDashboardHome.execute(fkEmpresaId);

    res.json(dados);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      erro: error.message ?? "Erro ao carregar dashboard",
    });
  }
};