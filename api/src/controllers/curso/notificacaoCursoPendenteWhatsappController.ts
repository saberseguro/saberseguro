import { Request, Response } from "express";
import {
  executarNotificacoesCursosPendentesWhatsapp,
  listarCursosPendentesWhatsapp,
} from "../../models/curso/notificacaoCursoPendenteWhatsapp";

export const simularNotificacoesCursosPendentesWhatsappController = async (
  req: Request,
  res: Response
) => {
  try {
    const resultado =
      await executarNotificacoesCursosPendentesWhatsapp.execute({
        usuarioExecutor: req.user,
        forcar: req.body?.forcar === true,
        limite: req.body?.limite ? Number(req.body.limite) : undefined,
      });

    return res.json(resultado);
  } catch (err: any) {
    console.error("Erro ao simular notificacoes de cursos pendentes:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const listarNotificacoesCursosPendentesWhatsappController = async (
  req: Request,
  res: Response
) => {
  try {
    const resultado = await listarCursosPendentesWhatsapp.execute({
      forcar: req.query?.forcar === "true",
    });

    return res.json(resultado);
  } catch (err: any) {
    console.error("Erro ao listar cursos pendentes para notificacao:", err);
    return res.status(500).json({ error: err.message });
  }
};
