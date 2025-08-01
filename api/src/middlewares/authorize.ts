import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/prisma-client';
import { getDay } from 'date-fns';

// Verificação básica, verifica apenas se o token é válido e se está dentro do horário de acesso
export async function authOnly(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Token não fornecido" });

  const [, token] = authHeader.split(" ");
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as any;
    req.user = payload;

    const rolesDoUsuario = payload.roles || [];

    // Pula validação de horário se for admin
    if (!rolesDoUsuario.includes("admin")) {
      const usuario = await prisma.usuario.findUnique({
        where: { idUsuario: payload.idUsuario },
        include: { usuarioHorario: true },
      });

      if (!usuario) return res.status(401).json({ error: "Usuário não encontrado" });

      const agora = new Date();
      const diaSemana = getDay(agora);

      const horarioDoDia = usuario.usuarioHorario.find(h => h.diaSemana === diaSemana);

      if (!horarioDoDia) {
        return res.status(403).json({ error: "Acesso não permitido neste dia da semana." });
      }

      const [inicioHora, inicioMinuto] = horarioDoDia.horarioInicio.split(':').map(Number);
      const [fimHora, fimMinuto] = horarioDoDia.horarioFim.split(':').map(Number);

      const inicioPermitido = new Date(agora);
      inicioPermitido.setHours(inicioHora, inicioMinuto, 0, 0);

      const fimPermitido = new Date(agora);
      fimPermitido.setHours(fimHora, fimMinuto, 0, 0);

      if (agora < inicioPermitido || agora >= fimPermitido) {
        return res.status(403).json({ error: "Acesso fora do horário permitido." });
      }
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

// Verificação avançada, verifica o token, se ele é valido e se o horário do dia é valido e também verifica se o usuario tem permissão para acessar a rota
export function authorize(permissoesNecessarias: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Token não fornecido' });

    const [, token] = authHeader.split(' ');
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as any;

      const permissoesDoUsuario = payload.permissoes || [];
      const rolesDoUsuario = payload.roles || [];

      const temPermissao = permissoesNecessarias.every((p) =>
        permissoesDoUsuario.includes(p)
      );

      if (!temPermissao) return res.status(403).json({ error: 'Acesso negado' });

      // Se for admin, pula validação de horário
      if (!rolesDoUsuario.includes("admin")) {
        const usuario = await prisma.usuario.findUnique({
          where: { idUsuario: payload.idUsuario },
          include: { usuarioHorario: true },
        });

        if (!usuario) return res.status(401).json({ error: "Usuário não encontrado" });

        const agora = new Date();
        const diaSemana = getDay(agora);
        const horarioDoDia = usuario.usuarioHorario.find(h => h.diaSemana === diaSemana);

        if (!horarioDoDia) {
          return res.status(403).json({ error: "Acesso não permitido neste dia da semana." });
        }

        const [inicioHora, inicioMinuto] = horarioDoDia.horarioInicio.split(':').map(Number);
        const [fimHora, fimMinuto] = horarioDoDia.horarioFim.split(':').map(Number);

        const inicioPermitido = new Date(agora);
        inicioPermitido.setHours(inicioHora, inicioMinuto, 0, 0);

        const fimPermitido = new Date(agora);
        fimPermitido.setHours(fimHora, fimMinuto, 0, 0);

        if (agora < inicioPermitido || agora >= fimPermitido) {
          return res.status(403).json({ error: "Acesso fora do horário permitido." });
        }
      }

      req.user = payload;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
  };
}