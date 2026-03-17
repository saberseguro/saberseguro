export interface EmpresaResumo {
  idEmpresa: number;
  razaoSocial: string;
  nomeFantasia?: string | null;
  cnpj?: string | null;
}

export interface Usuario {
  idUsuario: number;
  email: string;
  nome: string;
  cpf: string;
  assinatura?: string;
  trocarsenha: boolean;
  ativo: number;
  role: string[];
  permissoes: string[];
  fkEmpresaId?: number;
  fkResponsavelTecnicoId?: number;
  fkCargoId?: number;
  empresa?: EmpresaResumo;
}

export interface DiaHorarioAcesso {
  diaSemana: string;
  permitido: boolean;
  horarioInicio: string;
  horarioFim: string;
}

export type HorarioAcesso = DiaHorarioAcesso[];