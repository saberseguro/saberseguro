export type StatusResumo = {
  status: "NAO_INICIADO" | "EM_ANDAMENTO" | "CONCLUIDO" | "ATRASADO";
  quantidade: number;
};

export type CertificadosPorMes = {
  mes: string; // "2025-01"
  total: number;
};

export type StatusCursoFuncionario =
  | "NAO_INICIADO"
  | "EM_ANDAMENTO"
  | "CONCLUIDO"
  | "ATRASADO";

export type FuncionarioCursoAndamento = {
  funcionarioId: number;
  funcionarioNome: string;
  cursoId: number;
  cursoNome: string;
  unidade: string;
  setor: string;
  cargo: string;
  status: StatusCursoFuncionario;
  percentualConclusao: number;
  dataConclusao: string | null;
};

export type DashboardHomeDTO = {
  kpis: {
    funcionariosAtivos: number;
    cursosDisponiveis: number;
    totalVinculosObrigatorios: number;
    cursosNaoIniciados: number;
    cursosEmAndamento: number;
    cursosConcluidos: number;
    cursosAtrasados: number;
    certificadosTotal: number;
    certificadosUltimos30Dias: number;
  };
  statusCursos: StatusResumo[];
  certificadosPorMes: CertificadosPorMes[];
  funcionariosCursos: FuncionarioCursoAndamento[];
};
