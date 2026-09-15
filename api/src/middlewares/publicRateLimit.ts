import { Request, Response, NextFunction } from 'express';

interface Registro {
  count: number;
  resetAt: number;
}

const registros = new Map<string, Registro>();

/**
 * Limitador de requisições simples, em memória, sem dependências externas.
 *
 * Usado em rotas públicas (sem autenticação obrigatória) para dificultar
 * enumeração de usuários e abuso por força bruta, sem exigir instalação
 * de pacotes novos nem alterar o comportamento normal da rota.
 */
export function publicRateLimit(maxRequisicoes: number, janelaMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const chave = req.ip || 'desconhecido';
    const agora = Date.now();

    const registro = registros.get(chave);

    if (!registro || agora > registro.resetAt) {
      registros.set(chave, { count: 1, resetAt: agora + janelaMs });
      return next();
    }

    if (registro.count >= maxRequisicoes) {
      return res.status(429).json({ error: "Muitas requisições. Tente novamente em instantes." });
    }

    registro.count += 1;
    next();
  };
}

// Limpeza periódica para o Map não crescer indefinidamente em memória.
setInterval(() => {
  const agora = Date.now();
  for (const [chave, registro] of registros) {
    if (agora > registro.resetAt) registros.delete(chave);
  }
}, 5 * 60 * 1000).unref();
