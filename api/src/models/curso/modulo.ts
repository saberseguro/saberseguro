import { prisma } from '../../config/prisma-client';
import { registrarEvento } from '../../shared/utils/registrarEvento';

export const buscarModulo = {
  async execute(id: number) {
    return await prisma.modulo.findUnique({
      where: { idModulo: id },
      include: {
        aulas: {
          orderBy: { ordem: 'asc' },
          include: {
            avaliacoes: true,
            materiais: true,
            videos: true
          }
        },
        avaliacoes: true
      }
    });
  }
};

export const criarModulo = {
  async execute(data: any, usuario: any) {
    const moduloCriado = await prisma.modulo.create({
      data: {
        titulo: data.titulo,
        cargaHoraria: data.cargaHoraria,
        ordem: data.ordem,
        fkCursoId: data.fkCursoId,
        ativo: data.ativo
      }
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'criar',
      entidade: 'modulo',
      entidadeId: moduloCriado.idModulo,
      descricao: `Módulo "${moduloCriado.titulo}" criado.`,
      dadosDepois: moduloCriado
    });

    return moduloCriado;
  }
};

export const editarModulo = {
  async execute(id: number, data: any, usuario: any) {
    const antes = await prisma.modulo.findUnique({ where: { idModulo: id } });

    if (!antes) {
      throw new Error(`Nenhum módulo encontrado!`);
    }

    const moduloAtualizado = await prisma.modulo.update({
      where: { idModulo: id },
      data: {
        titulo: data.titulo,
        cargaHoraria: data.cargaHoraria,
        fkCursoId: data.fkCursoId,
        ordem: data.ordem,
        ativo: data.ativo
      }
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'editar',
      entidade: 'modulo',
      entidadeId: id,
      descricao: `Módulo "${antes?.titulo}" atualizado.`,
      dadosAntes: antes,
      dadosDepois: moduloAtualizado
    });

    return moduloAtualizado;
  }
};

export const reordenarModulos = {
  async execute(idCurso: number, modulos: any[], usuario: any) {
    const idsValidos = new Set(modulos.map(m => m.idModulo));

    for (const item of modulos) {
      if (!idsValidos.has(item.idModulo)) {
        throw new Error(`O módulo ${item.idModulo} não pertence ao curso informado.`);
      }
    }

    // salva ordem em transação
    const atualizados = await prisma.$transaction(
      modulos.map((m) =>
        prisma.modulo.update({
          where: { idModulo: m.idModulo },
          data: { ordem: m.ordem }
        })
      )
    );

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: "editar",
      entidade: "modulo",
      entidadeId: idCurso,
      descricao: `Ordem dos módulos do curso ${idCurso} atualizada.`,
      dadosAntes: null,
      dadosDepois: atualizados
    });

    return atualizados;
  },
};

export const excluirModulo = {
  async execute(id: number, usuario: any) {
    const modulo = await prisma.modulo.findUnique({ where: { idModulo: id } });

    if (!modulo) {
      throw new Error(`Nenhum módulo encontrado!`);
    }

    await prisma.modulo.delete({ where: { idModulo: id } });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'excluir',
      entidade: 'modulo',
      entidadeId: id,
      descricao: `Módulo "${modulo?.titulo}" excluído.`,
      dadosAntes: modulo
    });
  }
};