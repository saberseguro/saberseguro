import jwt from 'jsonwebtoken';
import { env } from '../config/env';

interface TokenPayload {
  idUsuario: number;
  email: string;
  nome?: string;
  roles?: string[];
  permissoes: string[];
  fkEmpresaId?: number;
  fkResponsavelTecnicoId?: number;
  fkCargoId?: number;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '1d',
    algorithm: 'HS256',
  });
}
