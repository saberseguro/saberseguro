import { Request, Response } from 'express';
import { getDashboardHome } from '../models/dashboard';

export const buscarDashBoard = async (req: Request, res: Response) => {
   try {
    const usuario = req.user;
    const fkEmpresaId = usuario?.fkEmpresaId;

    const dados = await getDashboardHome.execute(fkEmpresaId ?? 0);

    res.json(dados);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ erro: error.message ?? "Erro ao carregar dashboard" });
  }
};