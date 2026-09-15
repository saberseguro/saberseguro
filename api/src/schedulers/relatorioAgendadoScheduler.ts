import cron from "node-cron";
import { prisma } from "../config/prisma-client";
import {
  relatorioAgendadoModel,
  calcularProximoEnvio,
  calcularPeriodoRelatorio,
  type FrequenciaRelatorioAgendado,
} from "../models/relatorio/relatorioAgendado";
import { gerarRelatorio } from "../models/relatorio/gerarRelatorio";
import { enviarRelatorioPorEmail } from "../services/email/enviarRelatorioPorEmail";
import { opcoesRelatorio } from "../models/relatorio/relatorioOpcoes";

function tituloDoRelatorio(tipo: string) {
  return opcoesRelatorio.find((o) => o.id === tipo)?.titulo || tipo;
}

async function processarAgendamento(agendamento: Awaited<ReturnType<typeof relatorioAgendadoModel.buscarPendentesParaEnvio>>[number], agora: Date) {
  const frequencia = agendamento.frequencia as FrequenciaRelatorioAgendado;
  const proximoEnvioAntigo = agendamento.proximoEnvioEm;
  const ultimoEnvioAntigo = agendamento.ultimoEnvioEm;
  const novoProximoEnvio = calcularProximoEnvio(frequencia, agora);

  // Reserva atomicamente: só segue quem conseguir trocar o proximoEnvioEm
  // ainda no valor antigo. Se outra execução do cron já pegou esse mesmo
  // agendamento entre a busca e aqui, ganhou == false e a gente pula.
  const ganhou = await relatorioAgendadoModel.reservarEnvio(
    agendamento.idRelatorioAgendado,
    proximoEnvioAntigo,
    novoProximoEnvio,
    agora
  );

  if (!ganhou) return;

  try {
    const empresa = await prisma.empresa.findUnique({ where: { idEmpresa: agendamento.fkEmpresaId } });

    const filtrosBase = (agendamento.filtros as Record<string, any>) || {};

    // O período (dataInicio/dataFim) é calculado na hora, nunca guardado —
    // só faz sentido pra lista de presença, que é o único relatório com
    // filtro de período; os outros dois são "foto" do estado atual.
    const filtrosComPeriodo =
      agendamento.tipoRelatorio === "lista_presenca_cursos"
        ? { ...filtrosBase, fkEmpresaId: agendamento.fkEmpresaId, ...calcularPeriodoRelatorio(frequencia, agora) }
        : { ...filtrosBase, fkEmpresaId: agendamento.fkEmpresaId };

    const resultado = await gerarRelatorio.execute({
      tipo: agendamento.tipoRelatorio,
      formato: agendamento.formato,
      filtros: filtrosComPeriodo,
      usuario: { idUsuario: agendamento.fkUsuarioId, fkEmpresaId: agendamento.fkEmpresaId },
    });

    const destinatarios = agendamento.emailsDestino
      .split(",")
      .map((email: string) => email.trim())
      .filter(Boolean);

    if (!destinatarios.length) {
      throw new Error("Agendamento sem e-mails de destino válidos.");
    }

    const nomeEmpresa = empresa?.nomeFantasia || empresa?.razaoSocial || "";
    const tituloRelatorio = tituloDoRelatorio(agendamento.tipoRelatorio);

    await enviarRelatorioPorEmail.execute({
      para: destinatarios,
      assunto: `[${nomeEmpresa}] Relatório agendado: ${agendamento.nome}`,
      html: `
        <p>Olá,</p>
        <p>Segue em anexo o relatório <strong>${tituloRelatorio}</strong> (${agendamento.nome}), gerado automaticamente conforme a configuração de envio automático${nomeEmpresa ? ` da empresa <strong>${nomeEmpresa}</strong>` : ""}.</p>
        <p>Este é um e-mail automático, não é necessário responder.</p>
      `,
      buffer: resultado.buffer,
      nomeArquivo: resultado.fileName,
      mimeType: resultado.mimeType,
    });

    console.log(
      `[SCHEDULER] Relatório agendado enviado: idRelatorioAgendado=${agendamento.idRelatorioAgendado} nome="${agendamento.nome}"`
    );
  } catch (error) {
    console.error(
      `[SCHEDULER] Erro ao enviar relatório agendado idRelatorioAgendado=${agendamento.idRelatorioAgendado}`,
      error
    );

    // Devolve o estado anterior pra tentar de novo na próxima execução,
    // em vez de deixar o agendamento "perdido" até a próxima data calculada.
    await relatorioAgendadoModel.reverterReservaEnvio(
      agendamento.idRelatorioAgendado,
      novoProximoEnvio,
      proximoEnvioAntigo,
      ultimoEnvioAntigo
    );
  }
}

export async function executarRelatoriosAgendadosPendentes() {
  const agora = new Date();
  const pendentes = await relatorioAgendadoModel.buscarPendentesParaEnvio(agora);

  for (const agendamento of pendentes) {
    await processarAgendamento(agendamento, agora);
  }

  return { total: pendentes.length };
}

// Roda todo dia às 6h (horário de Brasília) e verifica o que está pendente
// desde o dia anterior — o próprio filtro `proximoEnvioEm <= agora` já cobre
// atrasos (ex.: servidor fora do ar num dia), então não precisa ser exato.
export function iniciarRelatorioAgendadoScheduler() {
  cron.schedule(
    "0 6 * * *",
    async () => {
      try {
        const resultado = await executarRelatoriosAgendadosPendentes();
        console.log("[SCHEDULER] Relatórios agendados verificados", resultado);
      } catch (error) {
        console.error("[SCHEDULER] Erro ao executar relatórios agendados", error);
      }
    },
    {
      timezone: "America/Sao_Paulo",
    }
  );
}
