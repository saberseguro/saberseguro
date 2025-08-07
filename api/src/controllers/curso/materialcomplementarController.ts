import { Request, Response } from "express";
import { criarMaterialComplementar } from "../../models/curso/materialcomplementar";

export const criarMaterialComplementarController = async (req: Request, res: Response) => {
  try {
    const material = await criarMaterialComplementar.execute(req.body, req.user as any);
    return res.status(201).json(material);
  } catch (err: any) {
    if (err.message?.includes("Aula não encontrada")) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
};