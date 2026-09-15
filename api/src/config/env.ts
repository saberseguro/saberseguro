import 'dotenv/config';

export const env = {
  PORT: process.env.PORT || 3333,
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  EVOLUTION_API_URL: process.env.EVOLUTION_API_URL || '',
  EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY || '',
  EVOLUTION_INSTANCE: process.env.EVOLUTION_INSTANCE || '',
  WHATSAPP_NOTIFICACOES_ATIVO: process.env.WHATSAPP_NOTIFICACOES_ATIVO || 'false',
};
