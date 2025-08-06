export interface UsuarioTokenPayload {
  idUsuario: number;
  email: string;
  nome?: string;
  cpf: string;
  roles: string[];
  permissoes: string[];
  fkEmpresaId?: number;
  fkResponsavelTecnicoId?: number;
  fkCargoId?: number;
}
