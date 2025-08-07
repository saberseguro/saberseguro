import { prisma } from "../../config/prisma-client";
import { registrarEvento } from "../../shared/utils/registrarEvento";

export const criarAulaVideo = {
  async execute(data: any, usuario: any) {
    const aula = await prisma.aula.findUnique({
      where: { idAula: data.fkAulaId }
    });

    if (!aula) throw new Error("Aula não encontrada");

    const novoVideo = await prisma.aulavideo.create({
      data: {
        url: data.url,
        fkAulaId: data.fkAulaId,
      }
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: "criar",
      entidade: "aulavideo",
      entidadeId: novoVideo.idAulaVideo,
      descricao: `Vídeo adicionado à aula ${aula.titulo}`,
      dadosDepois: novoVideo,
    });

    return novoVideo;
  }
};
