import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export function authorize(permissoesNecessarias: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Token não fornecido' });

    const [, token] = authHeader.split(' ');
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as any;

      const permissoesDoUsuario = payload.permissoes || [];

      const temPermissao = permissoesNecessarias.every((p) =>
        permissoesDoUsuario.includes(p)
      );

      if (!temPermissao) return res.status(403).json({ error: 'Acesso negado' });

      req.user = payload;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido' });
    }
  };
}

export function authOnly() {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Token não fornecido" });

    const [, token] = authHeader.split(" ");
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as any;
      req.user = payload; // payload já contém idUsuario, nome, email, etc
      next();
    } catch (err) {
      return res.status(401).json({ error: "Token inválido ou expirado" });
    }
  };
}