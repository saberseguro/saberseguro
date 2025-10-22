import { prisma } from "../../config/prisma-client";

interface RegistrarEventoParams {
  idUsuario: number;
  tipo: string;
  descricao?: string;
  entidade?: string;
  entidadeId?: any;
  dadosAntes?: any;
  dadosDepois?: any;
}

export async function registrarEvento({
  idUsuario,
  tipo,
  descricao,
  entidade,
  entidadeId,
  dadosAntes,
  dadosDepois,
}: RegistrarEventoParams) {
  try {
    await prisma.logevento.create({
      data: {
        fkUsuarioId: idUsuario,
        tipo,
        descricao,
        entidade,
        entidade_id: entidadeId as any,
        dados_antes: dadosAntes ? JSON.stringify(dadosAntes) : null,
        dados_depois: dadosDepois ? JSON.stringify(dadosDepois) : null,
      },
    });
  } catch (error) {
    console.error("Erro ao registrar evento:", error);
  }
}
