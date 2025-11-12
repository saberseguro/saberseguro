import { prisma } from '../../config/prisma-client';
import { registrarEvento } from '../../shared/utils/registrarEvento';

export const buscarAula = {
  async execute(id: number) {
    return await prisma.aula.findUnique({
      where: { idAula: id },
      include: {
        avaliacoes: true,
        materiais: true,
        videos: true,
      },
    });
  }
};

export const criarAula = {
  async execute(data: any, usuario: any) {
    const { titulo, descricao, tipo, duracao, ordem, ativo, fkModuloId } = data;

    const modulo = await prisma.modulo.findUnique({ where: { idModulo: fkModuloId } });
    if (!modulo) throw new Error("Nenhum módulo encontrado com esse ID");

    const resultado = await prisma.$transaction(async (tx) => {
      // Cria a aula
      const aulaCriada = await tx.aula.create({
        data: {
          titulo,
          descricao,
          tipo,
          duracao,
          ordem,
          ativo,
          fkModuloId,
        },
      });

      // Registra evento da aula
      await registrarEvento({
        idUsuario: usuario.idUsuario,
        tipo: 'criar',
        entidade: 'aula',
        entidadeId: aulaCriada.idAula,
        descricao: `Aula "${aulaCriada.titulo}" criada.`,
        dadosDepois: {
          aula: aulaCriada,
        },
      });

      return aulaCriada;
    });

    return resultado;
  },
};

export const editarAula = {
  async execute(id: number, data: any, usuario: any) {
    const antes = await prisma.aula.findUnique({ where: { idAula: id } });
    if (!antes) throw new Error('Nenhuma aula encontrada com esse ID');

    const aulaAtualizada = await prisma.aula.update({
      where: { idAula: id },
      data: {
        titulo: data.titulo,
        descricao: data.descricao,
        tipo: data.tipo,
        duracao: data.duracao,
        ordem: data.ordem,
        ativo: data.ativo,
      },
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'editar',
      entidade: 'aula',
      entidadeId: id,
      descricao: `Aula "${antes?.titulo}" atualizada.`,
      dadosAntes: antes,
      dadosDepois: aulaAtualizada,
    });

    return aulaAtualizada;
  }
};

export const excluirAula = {
  async execute(id: number, usuario: any) {
    const antes = await prisma.aula.findUnique({ where: { idAula: id } });
    if (!antes) throw new Error('Nenhuma aula encontrada com esse ID');

    await prisma.aula.delete({ where: { idAula: id } });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'excluir',
      entidade: 'aula',
      entidadeId: id,
      descricao: `Aula "${antes?.titulo}" excluída.`,
      dadosAntes: antes,
    });
  }
};