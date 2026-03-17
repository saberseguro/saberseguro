export type TipoArquivoRelatorio = "pdf" | "xlsx" | "csv";

export type TipoRelatorio =
  | "funcionarios_listagem"
  | "pendencias_cursos";

export interface FiltrosRelatorio {
  fkEmpresaId?: number;
  fkUnidadeId?: number;
  fkSetorId?: number;
  fkCargoId?: number;
  fkFuncionarioId?: number;
  ativo?: number;
  statusCurso?: "PENDENTE" | "CONCLUIDO" | "TODOS";
  dataInicio?: string;
  dataFim?: string;
}

export interface OpcaoRelatorio {
  id: TipoRelatorio;
  titulo: string;
  descricao: string;
  formato: TipoArquivoRelatorio;
  categoria?: string;
}

export interface PayloadGerarRelatorio {
  tipo: TipoRelatorio;
  formato: TipoArquivoRelatorio;
  filtros: FiltrosRelatorio;
}

export interface RespostaGerarRelatorio {
  ok: boolean;
  fileName?: string;
  mimeType?: string;
  message?: string;
}