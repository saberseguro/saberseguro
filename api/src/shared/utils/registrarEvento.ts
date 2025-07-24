import { prisma } from "../../config/prisma-client";

interface RegistrarEventoParams {
  idUsuario: number;
  tipo: string;
  descricao?: string;
  entidade?: string;
  entidadeId?: number;
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
    await prisma.logEvento.create({
      data: {
        fkUsuarioId: idUsuario,
        tipo,
        descricao,
        entidade,
        entidade_id: entidadeId,
        dados_antes: dadosAntes,
        dados_depois: dadosDepois,
      },
    });
  } catch (error) {
    console.error("Erro ao registrar evento:", error);
  }
}
