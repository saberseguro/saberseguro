import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

interface TokenPayload {
  idUsuario: number;
  email: string;
  nome?: string;
  cpf: string;
  roles?: string[];
  permissoes: string[];
  fkEmpresaId?: number;
  fkResponsavelTecnicoId?: number;
  fkCargoId?: number;
}

export function generateToken(
  payload: TokenPayload,
  expiresIn: string | number = '1d'
): string {
  const options: SignOptions = {
    expiresIn: expiresIn as any,
    algorithm: 'HS256',
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
}