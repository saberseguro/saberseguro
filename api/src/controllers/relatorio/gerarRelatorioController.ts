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

    const usuarioLogado = (req as any).user;
    const isAdmin = Array.isArray(usuarioLogado?.roles) && usuarioLogado.roles.includes("admin");

    // Correção de segurança: os geradores de relatório confiavam cegamente
    // no fkEmpresaId enviado pelo front, então um gestor podia trocar esse
    // valor na requisição e baixar relatórios (presença, funcionários,
    // pendências) de OUTRA empresa. Quem não é admin só pode gerar
    // relatório da própria empresa, não importa o que vier em filtros.
    const filtrosSeguro = {
      ...filtros,
      fkEmpresaId: isAdmin ? filtros?.fkEmpresaId : usuarioLogado?.fkEmpresaId,
    };

    const resultado = await gerarRelatorio.execute({
      tipo,
      formato,
      filtros: filtrosSeguro,
      usuario: usuarioLogado,
    });

    res.setHeader("Content-Type", resultado.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${resultado.fileName}"`);

    return res.send(resultado.buffer);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Erro ao gerar relatório." });
  }
};