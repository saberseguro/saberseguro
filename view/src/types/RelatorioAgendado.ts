import type { TipoArquivoRelatorio, TipoRelatorio } from "./Relatorio";

export type FrequenciaRelatorioAgendado = "semanal" | "quinzenal" | "mensal";

// Mesmos filtros da Central de Relatórios, exceto dataInicio/dataFim: o
// período de cada envio agendado é calculado na hora pelo backend, com
// base na frequência (ver relatorioAgendado.ts no back), pra nunca mandar
// um relatório com um período velho travado na data em que o agendamento
// foi criado.
export interface FiltrosRelatorioAgendado {
  fkUnidadeId?: number;
  fkSetorId?: number;
  fkCargoId?: number;
  fkFuncionarioId?: number;
  ativo?: number;
  statusCurso?: "PENDENTE" | "CONCLUIDO" | "TODOS";
}

export interface RelatorioAgendado {
  idRelatorioAgendado: number;
  nome: string;
  fkEmpresaId: number;
  fkUsuarioId: number;
  tipoRelatorio: TipoRelatorio;
  formato: TipoArquivoRelatorio;
  filtros: FiltrosRelatorioAgendado;
  emailsDestino: string;
  frequencia: FrequenciaRelatorioAgendado;
  ativo: boolean;
  proximoEnvioEm: string;
  ultimoEnvioEm?: string | null;
  criadoEm: string;
  editadoEm: string;
  usuario?: { idUsuario: number; nome: string } | null;
}

export interface PayloadRelatorioAgendado {
  nome: string;
  fkEmpresaId?: number;
  tipoRelatorio: TipoRelatorio;
  formato: TipoArquivoRelatorio;
  filtros: FiltrosRelatorioAgendado;
  emailsDestino: string;
  frequencia: FrequenciaRelatorioAgendado;
}
