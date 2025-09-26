import { Request, Response } from "express";
import {
  registrarAulaStep,
  verificarInicioCurso,
  verificarConclusaoModulo,
  buscarProgressoAula,
} from "../../models/curso/aulausuario";

export const buscarProgressoAulaController = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const idAula = parseInt(req.params.idAula);
    if (isNaN(idAula)) {
      return res.status(400).json({ error: "ID da aula inválido." });
    }

    const progresso = await buscarProgressoAula.execute(user.idUsuario, idAula);
    return res.json(progresso);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const registrarAulaStepController = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const result = await registrarAulaStep.execute({
      ...req.body,
      user,
    });
    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const iniciarCursoController = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { idCurso } = req.body as { idCurso: number };
    await verificarInicioCurso.execute(user.idUsuario, idCurso);
    return res.json({ sucesso: true });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const verificarConclusaoModuloController = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { idModulo } = req.body as { idModulo: number };
    await verificarConclusaoModulo.execute(user.idUsuario, idModulo);
    return res.json({ sucesso: true });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};
