export interface Usuario {
  idUsuario: number;
  email: string;
  nome: string;
  roles: string[];
  permissoes: string[];
  fkEmpresaId?: number;
  fkResponsavelTecnicoId?: number;
  fkCargoId?: number;
}

export interface HorarioAcesso {
  diaSemana: string;
  horarioInicio: string;
  horarioFim: string;
}