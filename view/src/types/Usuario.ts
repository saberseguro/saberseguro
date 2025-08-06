export interface Usuario {
  idUsuario: number;
  email: string;
  nome: string;
  cpf: string;
  ativo: number;
  role: string[];
  permissoes: string[];
  fkEmpresaId?: number;
  fkResponsavelTecnicoId?: number;
  fkCargoId?: number;
}

export interface DiaHorarioAcesso {
  diaSemana: string;
  permitido: boolean;
  horarioInicio: string;
  horarioFim: string;
}

export type HorarioAcesso = DiaHorarioAcesso[];