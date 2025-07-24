import jwt from 'jsonwebtoken';
import { env } from '../config/env';

interface TokenPayload {
  idUsuario: number;
  email: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '1d',
    algorithm: 'HS256',
  });
}
