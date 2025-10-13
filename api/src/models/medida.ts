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
  async execute(query: any, fkEmpresaId: number, isAdmin: boolean) {
    const page = Number(query.page) || 1;
    const take = 10;
    const skip = (page - 1) * take;

    const where: any = { AND: [] };

    // 🔹 Se não for admin, filtra por empresa
    if (!isAdmin) {
      where.AND.push({
        OR: [{ fkEmpresaId: null }, { fkEmpresaId }],
      });
    }

    if (query.busca) {
      where.AND.push({
        nome: { contains: String(query.busca), mode: "insensitive" },
      });
    }

    if (query.tipo) {
      where.AND.push({ tipo: String(query.tipo) });
    }

    if (query.ativo !== undefined && query.ativo !== "") {
      where.AND.push({ ativo: Number(query.ativo) });
    }

    const [data, total] = await Promise.all([
      prisma.medida.findMany({
        where,
        orderBy: { nome: "asc" },
        skip,
        take,
      }),
      prisma.medida.count({ where }),
    ]);

    return { data, total, page, take };
  },
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
    if (!antes) throw new Error('Nenhuma medida encontrada com esse ID');

    const atualizada = await prisma.medida.update({
      where: { idMedida: id },
      data: {
        nome: data.nome,
        descricao: data.descricao,
        tipo: data.tipo,
        ativo: data.ativo
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

export const atualizarStatusMedida = {
  async execute(id: number, ativo: 0 | 1, usuario: any) {
    const antes = await prisma.medida.findUnique({ where: { idMedida: id } });
    if (!antes) throw new Error('Nenhuma medida encontrada com esse ID');

    const atualizada = await prisma.medida.update({
      where: { idMedida: id },
      data: { ativo }
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'editar',
      entidade: 'medida',
      entidadeId: id,
      descricao: `Status da medida "${antes.nome}" atualizado para ${ativo}.`,
      dadosAntes: antes,
      dadosDepois: atualizada
    });

    return atualizada;
  }
};

export const excluirMedida = {
  async execute(id: number, usuario: any) {
    const antes = await prisma.medida.findUnique({ where: { idMedida: id } });
    console.log(antes);
    if (!antes) throw new Error('Nenhuma medida encontrada com esse ID');

    await prisma.medida.delete({ where: { idMedida: id } });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'excluir',
      entidade: 'medida',
      entidadeId: id,
      descricao: `Medida "${antes.nome}" excluida com sucesso.`,
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


export const listarCursosDaMedida = {
  async execute(fkMedidaId: number) {
    return prisma.medidacurso.findMany({
      where: { fkMedidaId },
      include: {
        curso: { select: { idCurso: true, titulo: true } },
      },
      orderBy: [{ curso: { titulo: 'asc' } }, { fkCursoId: 'asc' }],
    });
  },
};

export const listarMedidasDoCurso = {
  async execute(fkCursoId: number) {
    return prisma.medidacurso.findMany({
      where: { fkCursoId },
      include: {
        medida: { select: { idMedida: true, nome: true, tipo: true } },
      },
      orderBy: [{ medida: { nome: 'asc' } }, { fkMedidaId: 'asc' }],
    });
  },
};

export const vincularCursoNaMedida = {
  async execute(
    fkMedidaId: number,
    fkCursoId: number,
    usuario: any,
    validade?: number // em dias/meses conforme seu significado
  ) {
    // valida existência da medida e do curso
    const [medida, curso] = await Promise.all([
      prisma.medida.findUnique({ where: { idMedida: fkMedidaId } }),
      prisma.curso.findUnique({ where: { idCurso: fkCursoId } }),
    ]);
    if (!medida) throw new Error('Medida não encontrada.');
    if (!curso) throw new Error('Curso não encontrado.');

    const vinculo = await prisma.medidacurso.upsert({
      where: { fkMedidaId_fkCursoId: { fkMedidaId, fkCursoId } },
      update: {
        // só atualiza validade se for fornecida; senão mantém
        ...(typeof validade === 'number' ? { validade } : {}),
      },
      create: {
        fkMedidaId,
        fkCursoId,
        validade: typeof validade === 'number' ? validade : 0,
      },
    });

    // Como não há id único, use o fkCursoId como entidadeId e detalhe ambos na descrição.
    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'criar',
      entidade: 'medidacurso',
      entidadeId: fkCursoId,
      descricao: `Vínculo criado/atualizado: medida ${fkMedidaId} ⇄ curso ${fkCursoId} (validade=${vinculo.validade}).`,
      dadosDepois: vinculo,
    });

    return vinculo;
  },
};

export const atualizarValidadeDoVinculo = {
  async execute(
    fkMedidaId: number,
    fkCursoId: number,
    novaValidade: number,
    usuario: any
  ) {
    const antes = await prisma.medidacurso.findUnique({
      where: { fkMedidaId_fkCursoId: { fkMedidaId, fkCursoId } },
    });
    if (!antes) throw new Error('Vínculo não encontrado.');

    const depois = await prisma.medidacurso.update({
      where: { fkMedidaId_fkCursoId: { fkMedidaId, fkCursoId } },
      data: { validade: novaValidade },
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'editar',
      entidade: 'medidacurso',
      entidadeId: fkCursoId,
      descricao: `Atualizada validade do vínculo medida ${fkMedidaId} ⇄ curso ${fkCursoId}: ${antes.validade} → ${depois.validade}.`,
      dadosAntes: antes,
      dadosDepois: depois,
    });

    return depois;
  },
};

// Desvincula medida⇄curso (com chave composta)
export const desvincularCursoDaMedida = {
  async execute(fkMedidaId: number, fkCursoId: number, usuario: any) {
    const antes = await prisma.medidacurso.findUnique({
      where: { fkMedidaId_fkCursoId: { fkMedidaId, fkCursoId } },
    });
    if (!antes) throw new Error('Vínculo não encontrado.');

    await prisma.medidacurso.delete({
      where: { fkMedidaId_fkCursoId: { fkMedidaId, fkCursoId } },
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'excluir',
      entidade: 'medidacurso',
      entidadeId: fkCursoId,
      descricao: `Removido vínculo medida ${fkMedidaId} ⇄ curso ${fkCursoId}.`,
      dadosAntes: antes,
    });
  },
};