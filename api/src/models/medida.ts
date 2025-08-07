import { prisma } from "../config/prisma-client";
import { registrarEvento } from "../shared/utils/registrarEvento";

export const buscarMedida = {
  async execute(id: number) {
    return await prisma.medida.findUnique({
      where: { idMedida: id }
    });
  }
};

export const buscarMedidas = {
  async execute(fkEmpresaId: number) {
    return await prisma.medida.findMany({
      where: {
        OR: [
          { fkEmpresaId: null },
          { fkEmpresaId: fkEmpresaId }
        ]
      },
      orderBy: { nome: 'asc' }
    });
  }
};

export const criarMedida = {
  async execute(data: any, usuario: any) {
    const medida = await prisma.medida.create({
      data: {
        nome: data.nome,
        tipo: data.tipo,
        descricao: data.descricao,
        fkEmpresaId: usuario.fkEmpresaId,
        ativo: 1
      }
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'criar',
      entidade: 'medida',
      entidadeId: medida.idMedida,
      descricao: `Medida "${medida.nome}" criada com sucesso.`,
      dadosDepois: medida
    });

    return medida;
  }
};

export const editarMedida = {
  async execute(id: number, data: any, usuario: any) {
    const antes = await prisma.medida.findUnique({ where: { idMedida: id } });
    if (!antes || antes.ativo === 0) throw new Error('Nenhuma medida encontrada com esse ID');

    const atualizada = await prisma.medida.update({
      where: { idMedida: id },
      data: {
        nome: data.nome,
        descricao: data.descricao,
        tipo: data.tipo,
      }
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'editar',
      entidade: 'medida',
      entidadeId: id,
      descricao: `Medida "${antes.nome}" atualizada.`,
      dadosAntes: antes,
      dadosDepois: atualizada
    });

    return atualizada;
  }
};

export const excluirMedida = {
  async execute(id: number, usuario: any) {
    const antes = await prisma.medida.findUnique({ where: { idMedida: id } });
    if (!antes || antes.ativo === 0) throw new Error('Nenhuma medida encontrada com esse ID');

    await prisma.medida.update({
      where: { idMedida: id },
      data: { ativo: 0 }
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'excluir',
      entidade: 'medida',
      entidadeId: id,
      descricao: `Medida "${antes.nome}" desativada.`,
      dadosAntes: antes
    });
  }
};

// Vínculos
export const buscarVinculosDaMedida = {
  async execute(idMedida: number) {
    return await prisma.medidavinculo.findMany({
      where: { fkMedidaId: idMedida },
      include: {
        empresa: { select: { idEmpresa: true, nomeFantasia: true } },
        unidade: { select: { idUnidade: true, nomeFantasia: true } },
        setor: { select: { idSetor: true, nome: true } },
        cargo: { select: { idCargo: true, nome: true } },
        usuario: { select: { idUsuario: true, nome: true, email: true } }
      },
      orderBy: { idMedidaVinculo: 'asc' }
    });
  }
};

export const criarMedidaVinculo = {
  async execute(data: any, usuario: any) {
    const medida = await prisma.medida.findUnique({
      where: { idMedida: data.fkMedidaId }
    });

    if (!medida) throw new Error('Medida não encontrada');

    const vinculo = await prisma.medidavinculo.create({
      data: {
        fkMedidaId: data.fkMedidaId,
        fkEmpresaId: data.fkEmpresaId ?? null,
        fkUnidadeId: data.fkUnidadeId ?? null,
        fkSetorId: data.fkSetorId ?? null,
        fkCargoId: data.fkCargoId ?? null,
        fkUsuarioId: data.fkUsuarioId ?? null
      }
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'criar',
      entidade: 'medidavinculo',
      entidadeId: vinculo.idMedidaVinculo,
      descricao: `Criado vínculo da medida ${data.fkMedidaId} com estrutura.`,
      dadosDepois: vinculo
    });

    return vinculo;
  }
};

export const excluirMedidaVinculo = {
  async execute(id: number, usuario: any) {
    const antes = await prisma.medidavinculo.findUnique({
      where: { idMedidaVinculo: id }
    });

    if (!antes) throw new Error('Vínculo não encontrado');

    await prisma.medidavinculo.delete({
      where: { idMedidaVinculo: id }
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'excluir',
      entidade: 'medidavinculo',
      entidadeId: id,
      descricao: `Vínculo da medida ${antes.fkMedidaId} removido.`,
      dadosAntes: antes
    });
  }
};