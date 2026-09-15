import { Request, Response } from "express";
import { relatorioAgendadoModel } from "../../models/relatorio/relatorioAgendado";

// Mesmo raciocínio de segurança usado em gerarRelatorioController.ts e nas
// rotas de usuário: quem não é admin só pode ver/criar/editar agendamentos
// da própria empresa, não importa o que vier no corpo/query da requisição.
function resolverEmpresaContexto(req: Request) {
  const usuarioLogado = (req as any).user;
  const isAdmin = Array.isArray(usuarioLogado?.roles) && usuarioLogado.roles.includes("admin");

  return { usuarioLogado, isAdmin };
}

export const listarRelatorioAgendadoController = async (req: Request, res: Response) => {
  try {
    const { usuarioLogado, isAdmin } = resolverEmpresaContexto(req);
    const fkEmpresaIdQuery = req.query.fkEmpresaId ? Number(req.query.fkEmpresaId) : undefined;
    const fkEmpresaId = isAdmin ? fkEmpresaIdQuery : usuarioLogado?.fkEmpresaId;

    if (!fkEmpresaId) {
      return res.status(400).json({ error: "Empresa é obrigatória." });
    }

    const agendamentos = await relatorioAgendadoModel.listarPorEmpresa(fkEmpresaId);
    return res.json(agendamentos);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Erro ao listar relatórios agendados." });
  }
};

export const criarRelatorioAgendadoController = async (req: Request, res: Response) => {
  try {
    const { usuarioLogado, isAdmin } = resolverEmpresaContexto(req);
    const { nome, fkEmpresaId, tipoRelatorio, formato, filtros, emailsDestino, frequencia } = req.body;

    const fkEmpresaIdSeguro = isAdmin ? fkEmpresaId : usuarioLogado?.fkEmpresaId;

    if (!nome || !tipoRelatorio || !formato || !emailsDestino || !frequencia) {
      return res.status(400).json({ error: "Preencha nome, relatório, formato, e-mails e frequência." });
    }

    if (!fkEmpresaIdSeguro) {
      return res.status(400).json({ error: "Empresa é obrigatória." });
    }

    if (!["semanal", "quinzenal", "mensal"].includes(frequencia)) {
      return res.status(400).json({ error: "Frequência inválida." });
    }

    const agendamento = await relatorioAgendadoModel.criar({
      nome,
      fkEmpresaId: fkEmpresaIdSeguro,
      fkUsuarioId: usuarioLogado.idUsuario,
      tipoRelatorio,
      formato,
      filtros: filtros || {},
      emailsDestino,
      frequencia,
    });

    return res.status(201).json(agendamento);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Erro ao criar relatório agendado." });
  }
};

export const atualizarRelatorioAgendadoController = async (req: Request, res: Response) => {
  try {
    const { usuarioLogado, isAdmin } = resolverEmpresaContexto(req);
    const idRelatorioAgendado = Number(req.params.id);

    const agendamentoExistente = await relatorioAgendadoModel.buscarPorId(idRelatorioAgendado);
    if (!agendamentoExistente) {
      return res.status(404).json({ error: "Relatório agendado não encontrado." });
    }

    if (!isAdmin && agendamentoExistente.fkEmpresaId !== usuarioLogado?.fkEmpresaId) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    const { nome, tipoRelatorio, formato, filtros, emailsDestino, frequencia, ativo } = req.body;

    if (frequencia && !["semanal", "quinzenal", "mensal"].includes(frequencia)) {
      return res.status(400).json({ error: "Frequência inválida." });
    }

    const agendamento = await relatorioAgendadoModel.atualizar(idRelatorioAgendado, {
      nome,
      tipoRelatorio,
      formato,
      filtros,
      emailsDestino,
      frequencia,
      ativo,
    });

    return res.json(agendamento);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Erro ao atualizar relatório agendado." });
  }
};

export const removerRelatorioAgendadoController = async (req: Request, res: Response) => {
  try {
    const { usuarioLogado, isAdmin } = resolverEmpresaContexto(req);
    const idRelatorioAgendado = Number(req.params.id);

    const agendamentoExistente = await relatorioAgendadoModel.buscarPorId(idRelatorioAgendado);
    if (!agendamentoExistente) {
      return res.status(404).json({ error: "Relatório agendado não encontrado." });
    }

    if (!isAdmin && agendamentoExistente.fkEmpresaId !== usuarioLogado?.fkEmpresaId) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    await relatorioAgendadoModel.remover(idRelatorioAgendado);
    return res.status(204).send();
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Erro ao remover relatório agendado." });
  }
};

export const alternarAtivoRelatorioAgendadoController = async (req: Request, res: Response) => {
  try {
    const { usuarioLogado, isAdmin } = resolverEmpresaContexto(req);
    const idRelatorioAgendado = Number(req.params.id);
    const { ativo } = req.body;

    const agendamentoExistente = await relatorioAgendadoModel.buscarPorId(idRelatorioAgendado);
    if (!agendamentoExistente) {
      return res.status(404).json({ error: "Relatório agendado não encontrado." });
    }

    if (!isAdmin && agendamentoExistente.fkEmpresaId !== usuarioLogado?.fkEmpresaId) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    const agendamento = await relatorioAgendadoModel.alternarAtivo(idRelatorioAgendado, Boolean(ativo));
    return res.json(agendamento);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Erro ao atualizar status do relatório agendado." });
  }
};
