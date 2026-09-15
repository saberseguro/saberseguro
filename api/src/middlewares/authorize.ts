import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/prisma-client';
import { getDay } from 'date-fns';

// Correção de performance: `authOnly`/`authorize` rodam em quase toda rota
// autenticada, e cada uma delas buscava o usuário + horários no banco de
// novo. Uma única tela costuma disparar várias chamadas de API em sequência
// (ex.: abrir a tela de Empresa dispara 5+ requisições), então isso virava
// 5+ consultas repetidas e idênticas só pra checar o horário de acesso.
// Aqui cacheamos esse resultado por poucos segundos por usuário: rápido o
// bastante pra não perceber atraso na prática, mas curto o suficiente pra
// uma desativação de conta ou mudança de horário valer quase que na hora.
const TTL_CACHE_MS = 15_000;
const cacheUsuarioHorario = new Map<number, { usuario: any; expiraEm: number }>();

async function buscarUsuarioComHorarioCache(idUsuario: number) {
  const agora = Date.now();
  const emCache = cacheUsuarioHorario.get(idUsuario);

  if (emCache && emCache.expiraEm > agora) {
    return emCache.usuario;
  }

  const usuario = await prisma.usuario.findUnique({
    where: { idUsuario },
    include: { usuariohorario: true },
  });

  cacheUsuarioHorario.set(idUsuario, { usuario, expiraEm: agora + TTL_CACHE_MS });
  return usuario;
}

// Limpeza periódica pra não acumular entradas expiradas indefinidamente.
setInterval(() => {
  const agora = Date.now();
  for (const [id, entrada] of cacheUsuarioHorario) {
    if (entrada.expiraEm <= agora) cacheUsuarioHorario.delete(id);
  }
}, 60_000).unref();

function dentroDoHorarioPermitido(usuario: { usuariohorario: { diaSemana: number; permitido: boolean; horarioInicio: string; horarioFim: string }[] }) {
  const agora = new Date();
  const diaSemana = getDay(agora);

  const horarioDoDia = usuario.usuariohorario.find(h => h.diaSemana === diaSemana && h.permitido);
  if (!horarioDoDia) return false;

  const [inicioHora, inicioMinuto] = horarioDoDia.horarioInicio.split(':').map(Number);
  const [fimHora, fimMinuto] = horarioDoDia.horarioFim.split(':').map(Number);

  const inicioPermitido = new Date(agora);
  inicioPermitido.setHours(inicioHora, inicioMinuto, 0, 0);

  const fimPermitido = new Date(agora);
  fimPermitido.setHours(fimHora, fimMinuto, 0, 0);

  return agora >= inicioPermitido && agora < fimPermitido;
}

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
      const usuario = await buscarUsuarioComHorarioCache(payload.idUsuario);

      if (!usuario) return res.status(401).json({ error: "Usuário não encontrado" });

      if (!dentroDoHorarioPermitido(usuario)) {
        const diaSemana = getDay(new Date());
        const horarioDoDia = usuario.usuariohorario.find((h: any) => h.diaSemana === diaSemana && h.permitido);

        if (!horarioDoDia) {
          return res.status(403).json({ error: "Acesso não permitido neste dia da semana." });
        }
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
        const usuario = await buscarUsuarioComHorarioCache(payload.idUsuario);

        if (!usuario) return res.status(401).json({ error: "Usuário não encontrado" });

        if (!dentroDoHorarioPermitido(usuario)) {
          const diaSemana = getDay(new Date());
          const horarioDoDia = usuario.usuariohorario.find((h: any) => h.diaSemana === diaSemana && h.permitido);

          if (!horarioDoDia) {
            return res.status(403).json({ error: "Acesso não permitido neste dia da semana." });
          }
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
