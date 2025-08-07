import { Request, Response } from "express";
import { criarAulaVideo } from "../../models/curso/aulavideo";

export const criarAulaVideoController = async (req: Request, res: Response) => {
  try {
    const aulaVideo = await criarAulaVideo.execute(req.body, req.user as any);
    return res.status(201).json(aulaVideo);
  } catch (err: any) {
    if (err.message?.includes("Aula não encontrada")) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
};