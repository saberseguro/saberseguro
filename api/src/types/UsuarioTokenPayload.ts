export interface UsuarioTokenPayload {
  idUsuario: number;
  email: string;
  nome?: string;
  roles: string[];
  permissoes: string[];
}
