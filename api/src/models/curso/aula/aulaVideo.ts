import { prisma } from '../../../config/prisma-client';
import { registrarEvento } from '../../../shared/utils/registrarEvento';

export const listarAulaVideo = {
  async execute(idAula: number) {
    return await prisma.aulavideo.findMany({
      where: { fkAulaId: idAula },
      orderBy: { idAulaVideo: 'asc' },
    });
  },
};

export const criarAulaVideo = {
  async execute(idAula: number, data: any, usuario: any) {
    const { url } = data;
    if (!url) throw new Error('URL é obrigatória');

    const criado = await prisma.aulavideo.create({
      data: { fkAulaId: idAula, url },
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'criar',
      entidade: 'aulaVideo',
      entidadeId: criado.idAulaVideo,
      descricao: `Vídeo adicionado à aula ${idAula}`,
      dadosDepois: criado,
    });

    return criado;
  },
};

export const editarAulaVideo = {
  async execute(id: number, data: any, usuario: any) {
    const antes = await prisma.aulavideo.findUnique({ where: { idAulaVideo: id } });
    if (!antes) throw new Error('Nenhum vídeo encontrado com esse ID');

    const atualizado = await prisma.aulavideo.update({ where: { idAulaVideo: id }, data });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'editar',
      entidade: 'aulaVideo',
      entidadeId: id,
      descricao: `Vídeo atualizado.`,
      dadosAntes: antes,
      dadosDepois: atualizado,
    });

    return atualizado;
  },
};

export const excluirAulaVideo = {
  async execute(id: number, usuario: any) {
    const antes = await prisma.aulavideo.findUnique({ where: { idAulaVideo: id } });
    if (!antes) throw new Error('Nenhum vídeo encontrado com esse ID');

    await prisma.aulavideo.delete({ where: { idAulaVideo: id } });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'excluir',
      entidade: 'aulaVideo',
      entidadeId: id,
      descricao: `Vídeo removido da aula.`,
      dadosAntes: antes,
    });
  },
};
