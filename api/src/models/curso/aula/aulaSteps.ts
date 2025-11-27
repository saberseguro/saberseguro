import { prisma } from '../../../config/prisma-client';
import { registrarEvento } from '../../../shared/utils/registrarEvento';

export const listarAulaStep = {
  async execute(idAula: number) {
    return await prisma.aulastep.findMany({
      where: { fkAulaId: idAula },
      orderBy: { ordem: 'asc' },
    });
  },
};

export const criarAulaStep = {
  async execute(idAula: number, data: any, usuario: any) {
    const count = await prisma.aulastep.count({ where: { fkAulaId: idAula } });
    const stepCriado = await prisma.aulastep.create({
      data: {
        tipo: data.tipo,
        fkAulaId: idAula,
        fkAulaVideoId: data.fkAulaVideoId ?? null,
        fkMaterialId: data.fkMaterialId ?? null,
        fkAvaliacaoId: data.fkAvaliacaoId ?? null,
        obrigatorio: data.obrigatorio ?? 1,
        ordem: count + 1,
      },
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'criar',
      entidade: 'aulaStep',
      entidadeId: stepCriado.idAulaStep,
      descricao: `Step "${data.tipo}" criado na aula ${idAula}.`,
      dadosDepois: stepCriado,
    });

    return stepCriado;
  },
};

export const editarAulaStep = {
  async execute(id: number, data: any, usuario: any) {
    const antes = await prisma.aulastep.findUnique({ where: { idAulaStep: id } });
    if (!antes) throw new Error('Nenhum step encontrado com esse ID');

    const atualizado = await prisma.aulastep.update({
      where: { idAulaStep: id },
      data,
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'editar',
      entidade: 'aulaStep',
      entidadeId: id,
      descricao: `Step atualizado.`,
      dadosAntes: antes,
      dadosDepois: atualizado,
    });

    return atualizado;
  },
};

export const excluirAulaStep = {
  async execute(id: number, usuario: any) {
    const step = await prisma.aulastep.findUnique({ where: { idAulaStep: id } });
    if (!step) throw new Error('Nenhum step encontrado com esse ID');

    await prisma.$transaction(async (tx) => {
      await tx.aulastep.delete({ where: { idAulaStep: id } });

      const restantes = await tx.aulastep.findMany({
        where: { fkAulaId: step.fkAulaId },
        orderBy: { ordem: 'asc' },
      });

      for (let i = 0; i < restantes.length; i++) {
        if (restantes[i].ordem !== i + 1) {
          await tx.aulastep.update({
            where: { idAulaStep: restantes[i].idAulaStep },
            data: { ordem: i + 1 },
          });
        }
      }
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'excluir',
      entidade: 'aulaStep',
      entidadeId: id,
      descricao: `Step removido da aula.`,
      dadosAntes: step,
    });
  },
};

export const reordenarAulaSteps = {
  async execute(idAula: number, itens: Array<{ idAulaStep: number; ordem: number }>, usuario: any) {
    await prisma.$transaction(async (tx) => {
      for (const item of itens) {
        await tx.aulastep.update({
          where: { idAulaStep: item.idAulaStep },
          data: { ordem: item.ordem },
        });
      }
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'editar',
      entidade: 'aulaStep',
      entidadeId: idAula,
      descricao: `Ordem dos steps atualizada.`,
      dadosDepois: itens,
    });
  },
};
