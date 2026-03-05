export type StatusResumo = {
  status: "NAO_INICIADO" | "EM_ANDAMENTO" | "CONCLUIDO" | "ATRASADO";
  quantidade: number;
};

export type CertificadosPorMes = {
  mes: string; // "2025-01"
  total: number;
};

export type DashboardHomeDTO = {
  kpis: {
    funcionariosAtivos: number;
    cursosDisponiveis: number;
    totalVinculosObrigatorios: number; // funcionario × curso
    cursosNaoIniciados: number;
    cursosEmAndamento: number;
    cursosConcluidos: number;
    cursosAtrasados: number;
    certificadosTotal: number;
    certificadosUltimos30Dias: number;
  };
  statusCursos: StatusResumo[];
  certificadosPorMes: CertificadosPorMes[];
};
