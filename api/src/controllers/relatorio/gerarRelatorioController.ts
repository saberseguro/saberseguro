import { Request, Response } from "express";
import { gerarRelatorio } from "../../models/relatorio/gerarRelatorio";

export const gerarRelatorioController = async (req: Request, res: Response) => {
  try {
    const { tipo, formato, filtros } = req.body;

    if (!tipo) {
      return res.status(400).json({ error: "Tipo de relatório é obrigatório." });
    }

    if (!formato) {
      return res.status(400).json({ error: "Formato do relatório é obrigatório." });
    }

    const resultado = await gerarRelatorio.execute({
      tipo,
      formato,
      filtros,
      usuario: (req as any).user,
    });

    res.setHeader("Content-Type", resultado.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${resultado.fileName}"`);

    return res.send(resultado.buffer);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Erro ao gerar relatório." });
  }
};