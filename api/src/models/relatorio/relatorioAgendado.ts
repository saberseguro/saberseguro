import { addDays, addMonths } from "date-fns";
import { prisma } from "../../config/prisma-client";

export type FrequenciaRelatorioAgendado = "semanal" | "quinzenal" | "mensal";

interface FiltrosRelatorioAgendado {
  fkUnidadeId?: number;
  fkSetorId?: number;
  fkCargoId?: number;
  fkFuncionarioId?: number;
  fkCursoId?: number;
  ativo?: number;
  statusCurso?: "PENDENTE" | "CONCLUIDO" | "TODOS";
  somentePendentes?: boolean;
}

interface CriarRelatorioAgendadoParams {
  nome: string;
  fkEmpresaId: number;
  fkUsuarioId: number;
  tipoRelatorio: string;
  formato: string;
  filtros: FiltrosRelatorioAgendado;
  emailsDestino: string;
  frequencia: FrequenciaRelatorioAgendado;
}

interface AtualizarRelatorioAgendadoParams {
  nome?: string;
  tipoRelatorio?: string;
  formato?: string;
  filtros?: FiltrosRelatorioAgendado;
  emailsDestino?: string;
  frequencia?: FrequenciaRelatorioAgendado;
  ativo?: boolean;
}

// Calcula quando deve ser o próximo envio, a partir de uma data-base
// (normalmente "agora", na criação, ou a última data de envio, depois que
// o cron manda um). Não usamos 30 dias fixos pro "mensal" pra não ir
// acumulando atraso mês a mês (fevereiro, meses de 31 dias etc.).
export function calcularProximoEnvio(
  frequencia: FrequenciaRelatorioAgendado,
  base: Date
): Date {
  switch (frequencia) {
    case "semanal":
      return addDays(base, 7);
    case "quinzenal":
      return addDays(base, 15);
    case "mensal":
      return addMonths(base, 1);
    default:
      throw new Error("Frequência inválida.");
  }
}

// Calcula o período (dataInicio/dataFim, no formato yyyy-MM-dd que os
// geradores de relatório esperam) coberto por um envio, com base na
// frequência: os últimos 7/15/30 dias, terminando ontem — nunca hoje,
// já que o cron roda de manhã e o dia de hoje ainda não fechou.
export function calcularPeriodoRelatorio(frequencia: FrequenciaRelatorioAgendado, agora: Date) {
  const ontem = addDays(agora, -1);
  const diasNoPeriodo = frequencia === "semanal" ? 7 : frequencia === "quinzenal" ? 15 : 30;
  const inicio = addDays(ontem, -(diasNoPeriodo - 1));

  const formatar = (data: Date) => data.toISOString().slice(0, 10);

  return {
    dataInicio: formatar(inicio),
    dataFim: formatar(ontem),
  };
}

export const relatorioAgendadoModel = {
  async listarPorEmpresa(fkEmpresaId: number) {
    return prisma.relatorioagendado.findMany({
      where: { fkEmpresaId },
      orderBy: { criadoEm: "desc" },
      include: {
        usuario: { select: { idUsuario: true, nome: true } },
      },
    });
  },

  async buscarPorId(idRelatorioAgendado: number) {
    return prisma.relatorioagendado.findUnique({
      where: { idRelatorioAgendado },
    });
  },

  async criar({
    nome,
    fkEmpresaId,
    fkUsuarioId,
    tipoRelatorio,
    formato,
    filtros,
    emailsDestino,
    frequencia,
  }: CriarRelatorioAgendadoParams) {
    const agora = new Date();

    return prisma.relatorioagendado.create({
      data: {
        nome,
        fkEmpresaId,
        fkUsuarioId,
        tipoRelatorio,
        formato,
        filtros: filtros as any,
        emailsDestino,
        frequencia,
        ativo: true,
        proximoEnvioEm: calcularProximoEnvio(frequencia, agora),
        editadoEm: agora,
      },
    });
  },

  async atualizar(idRelatorioAgendado: number, dados: AtualizarRelatorioAgendadoParams) {
    const agendamentoAtual = await prisma.relatorioagendado.findUnique({
      where: { idRelatorioAgendado },
    });

    if (!agendamentoAtual) return null;

    // Se a frequência mudou, recalcula proximoEnvioEm a partir de agora pra
    // não deixar um envio "perdido" na data antiga (ex.: era mensal daqui a
    // 20 dias e virou semanal — deve mandar em 7 dias, não nos 20 antigos).
    const frequenciaMudou = dados.frequencia && dados.frequencia !== agendamentoAtual.frequencia;

    return prisma.relatorioagendado.update({
      where: { idRelatorioAgendado },
      data: {
        ...(dados.nome !== undefined ? { nome: dados.nome } : {}),
        ...(dados.tipoRelatorio !== undefined ? { tipoRelatorio: dados.tipoRelatorio } : {}),
        ...(dados.formato !== undefined ? { formato: dados.formato } : {}),
        ...(dados.filtros !== undefined ? { filtros: dados.filtros as any } : {}),
        ...(dados.emailsDestino !== undefined ? { emailsDestino: dados.emailsDestino } : {}),
        ...(dados.frequencia !== undefined ? { frequencia: dados.frequencia } : {}),
        ...(dados.ativo !== undefined ? { ativo: dados.ativo } : {}),
        ...(frequenciaMudou
          ? { proximoEnvioEm: calcularProximoEnvio(dados.frequencia as FrequenciaRelatorioAgendado, new Date()) }
          : {}),
        editadoEm: new Date(),
      },
    });
  },

  async remover(idRelatorioAgendado: number) {
    return prisma.relatorioagendado.delete({
      where: { idRelatorioAgendado },
    });
  },

  async alternarAtivo(idRelatorioAgendado: number, ativo: boolean) {
    const agora = new Date();
    const dadosAtualizacao: { ativo: boolean; editadoEm: Date; proximoEnvioEm?: Date } = {
      ativo,
      editadoEm: agora,
    };

    // Ao reativar, recalcula a partir de agora pra não disparar um envio
    // imediato referente a um período em que ficou desligado.
    if (ativo) {
      const agendamento = await prisma.relatorioagendado.findUnique({
        where: { idRelatorioAgendado },
        select: { frequencia: true },
      });

      if (agendamento) {
        dadosAtualizacao.proximoEnvioEm = calcularProximoEnvio(agendamento.frequencia as FrequenciaRelatorioAgendado, agora);
      }
    }

    return prisma.relatorioagendado.update({
      where: { idRelatorioAgendado },
      data: dadosAtualizacao,
    });
  },

  // Usado pelo scheduler: tudo que está ativo e cuja vez já chegou.
  async buscarPendentesParaEnvio(agora: Date) {
    return prisma.relatorioagendado.findMany({
      where: {
        ativo: true,
        proximoEnvioEm: { lte: agora },
      },
    });
  },

  // Trava atômica: só "ganha a corrida" quem conseguir dar update na linha
  // ainda com o proximoEnvioEm antigo (evita mandar o mesmo relatório 2x
  // se o cron disparar mais de uma vez ou demorar entre buscar e enviar).
  async reservarEnvio(idRelatorioAgendado: number, proximoEnvioAntigo: Date, novoProximoEnvio: Date, agora: Date) {
    const resultado = await prisma.relatorioagendado.updateMany({
      where: {
        idRelatorioAgendado,
        proximoEnvioEm: proximoEnvioAntigo,
      },
      data: {
        proximoEnvioEm: novoProximoEnvio,
        ultimoEnvioEm: agora,
      },
    });

    return resultado.count === 1;
  },

  // Se o envio falhar depois de reservado, devolve o agendamento pro estado
  // anterior pra tentar de novo na próxima execução do cron.
  async reverterReservaEnvio(
    idRelatorioAgendado: number,
    novoProximoEnvio: Date,
    proximoEnvioAntigo: Date,
    ultimoEnvioAntigo: Date | null
  ) {
    await prisma.relatorioagendado.updateMany({
      where: {
        idRelatorioAgendado,
        proximoEnvioEm: novoProximoEnvio,
      },
      data: {
        proximoEnvioEm: proximoEnvioAntigo,
        ultimoEnvioEm: ultimoEnvioAntigo,
      },
    });
  },
};
