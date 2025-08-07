import { prisma } from '../../config/prisma-client';
import { registrarEvento } from '../../shared/utils/registrarEvento';

export const buscarCurso = {
  async execute(id: number) {
    return await prisma.curso.findUnique({
      where: { idCurso: id },
      include: {
        categorias: { include: { categoria: true } },
        modulos: {
          orderBy: { ordem: 'asc' },
          include: {
            avaliacoes: true,
            aulas: {
              orderBy: { ordem: 'asc' },
              include: {
                avaliacoes: true,
                materiais: true,
                videos: true,
              }
            }
          }
        },
        avaliacoes: true,
        responsaveltecnico: true,
      },
    });
  },
};

export const buscarCursos = {
  async execute(query: any) {
    const page = Number(query.page) || 1;
    const take = 10;
    const skip = (page - 1) * take;

    const where: any = {};

    console.log(query);

    if (query.ativo !== undefined && query.ativo !== "") {
      where.ativo = Number(query.ativo);
    }

    if (query.fkEmpresaId) {
      where.fkEmpresaId = Number(query.fkEmpresaId);
    }

    if (query.busca) {
      where.titulo = {
        contains: query.busca.toLowerCase(),
      }
    }

    if (query.categoria) {
      where.categorias = {
        some: {
          fkCategoriaId: Number(query.categoria),
        },
      };
    }

    const [data, total] = await Promise.all([
      prisma.curso.findMany({
        where,
        include: {
          categorias: { include: { categoria: true } },
          modulos: {
            orderBy: { ordem: 'asc' },
            include: {
              avaliacoes: true,
              aulas: {
                orderBy: { ordem: 'asc' },
                include: {
                  avaliacoes: true,
                  materiais: true,
                  videos: true,
                }
              }
            }
          },
          avaliacoes: true,
          responsaveltecnico: true,
        },
        orderBy: { criado_em: 'desc' },
        take,
        skip,
      }),
      prisma.curso.count({ where }),
    ]);

    return {
      data,
      totalPaginas: Math.ceil(total / take),
    };
  },
};

export const criarCurso = {
  async execute(data: any, usuario: any) {
    const categoriasIds: number[] = data.categorias || [];

    const categoriasValidas = await prisma.categoria.findMany({
      where: { idCategoria: { in: categoriasIds } }
    });

    if (categoriasValidas.length === 0) {
      throw new Error('O curso precisa de pelo menos uma categoria válida');
    }

    const cursoCriado = await prisma.curso.create({
      data: {
        titulo: data.titulo,
        descricao: data.descricao,
        cargaHoraria: data.cargaHoraria,
        fkEmpresaId: data.fkEmpresaId,
        fkResponsavelTecnicoId: data.fkResponsavelTecnicoId,
        categorias: {
          createMany: {
            data: categoriasValidas.map((cat) => ({
              fkCategoriaId: cat.idCategoria
            }))
          }
        }
      },
      include: {
        categorias: { include: { categoria: true } }
      }
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: "criar",
      entidade: "curso",
      entidadeId: cursoCriado.idCurso,
      descricao: `Curso: ${cursoCriado.titulo} criado com sucesso!`,
      dadosDepois: cursoCriado,
    });

    return cursoCriado;
  },
};

export const editarCurso = {
  async execute(id: number, data: any, usuario: any) {
    const antes = await prisma.curso.findUnique({
      where: { idCurso: id },
      include: {
        categorias: { include: { categoria: true } },
      }
    });

    if (!antes) {
      throw new Error('Nenhum curso encontrado com esse ID.');
    }

    const categoriasIds: number[] = data.categorias || [];

    const categoriasValidas = await prisma.categoria.findMany({
      where: { idCategoria: { in: categoriasIds } }
    });

    if (categoriasValidas.length === 0) {
      throw new Error('O curso precisa de pelo menos uma categoria válida.');
    }

    await prisma.categoriacurso.deleteMany({ where: { fkCursoId: id } });

    const cursoAtualizado = await prisma.curso.update({
      where: { idCurso: id },
      data: {
        titulo: data.titulo,
        descricao: data.descricao,
        cargaHoraria: data.cargaHoraria,
        fkResponsavelTecnicoId: data.fkResponsavelTecnicoId,
        categorias: {
          createMany: {
            data: categoriasValidas.map((cat) => ({
              fkCategoriaId: cat.idCategoria
            }))
          }
        }
      },
      include: {
        categorias: { include: { categoria: true } }
      }
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: "editar",
      entidade: "curso",
      entidadeId: id,
      descricao: `Curso "${antes.titulo}" atualizado.`,
      dadosAntes: antes,
      dadosDepois: cursoAtualizado
    });

    return cursoAtualizado;
  }
};

export const excluirCurso = {
  async execute(id: number, usuario: any) {
    const curso = await prisma.curso.findUnique({ where: { idCurso: id } });

    if (!curso) {
      throw new Error('Curso não encontrado ou já foi excluído.');
    }

    try {
      await prisma.curso.delete({ where: { idCurso: id } });

      await registrarEvento({
        idUsuario: usuario.idUsuario,
        tipo: "excluir",
        entidade: "curso",
        entidadeId: curso.idCurso,
        descricao: `Curso: ${curso.titulo} excluido com sucesso!`,
      });

    } catch (error: any) {
      if (error.code === 'P2003') {
        // Violação de constraint (ex: restrição de chave estrangeira)
        throw new Error('Não foi possível excluir o curso. Existem registros vinculados.');
      }
      throw new Error('Erro ao excluir o curso.');
    }
  },
};

// Adicionar Medidas
export const adicionarMedidasAoCurso = {
  async execute(idCurso: number, medidas: { id: number; validade: number }[], usuario: any) {
    const curso = await prisma.curso.findUnique({ where: { idCurso } });
    if (!curso) throw new Error('Curso não encontrado');

    const medidasCriadas = await prisma.medidacurso.createMany({
      data: medidas.map(m => ({
        fkCursoId: idCurso,
        fkMedidaId: m.id,
        validade: m.validade
      })),
      skipDuplicates: true
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'criar',
      entidade: 'medidacurso',
      entidadeId: idCurso,
      descricao: `Vinculadas medidas ao curso ${idCurso}.`,
      dadosDepois: medidas
    });

    return medidasCriadas;
  }
};

export const removerMedidaDoCurso = {
  async execute(idCurso: number, idMedida: number, usuario: any) {
    const vinculo = await prisma.medidacurso.findUnique({
      where: {
        fkMedidaId_fkCursoId: {
          fkMedidaId: idMedida,
          fkCursoId: idCurso
        }
      }
    });

    if (!vinculo) throw new Error('Vínculo não encontrado');

    await prisma.medidacurso.delete({
      where: {
        fkMedidaId_fkCursoId: {
          fkMedidaId: idMedida,
          fkCursoId: idCurso
        }
      }
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'excluir',
      entidade: 'medidacurso',
      entidadeId: `${idMedida}-${idCurso}`,
      descricao: `Removido vínculo da medida ${idMedida} do curso ${idCurso}.`,
      dadosAntes: vinculo
    });

    return { message: 'Vínculo removido com sucesso.' };
  }
};

// Controlar Acessos
export const buscarCursoAcessos = {
  async execute(idCurso: number) {
    return await prisma.cursoacesso.findMany({
      where: { fkCursoId: idCurso },
      include: {
        empresa: { select: { idEmpresa: true, nomeFantasia: true } },
        unidade: { select: { idUnidade: true, nomeFantasia: true } },
        setor: { select: { idSetor: true, nome: true } },
        cargo: { select: { idCargo: true, nome: true } },
        usuario: { select: { idUsuario: true, nome: true, email: true } }
      },
      orderBy: { idCursoAcesso: 'asc' }
    });
  }
};

export const criarCursoAcesso = {
  async execute(data: any, usuario: any) {
    const curso = await prisma.curso.findUnique({
      where: { idCurso: data.fkCursoId }
    });

    if (!curso) throw new Error('Curso não encontrado');

    const acesso = await prisma.cursoacesso.create({
      data: {
        fkCursoId: data.fkCursoId,
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
      entidade: 'cursoacesso',
      entidadeId: acesso.idCursoAcesso,
      descricao: `Curso ${data.fkCursoId} vinculado a estrutura.`,
      dadosDepois: acesso
    });

    return acesso;
  }
};

export const excluirCursoAcesso = {
  async execute(id: number, usuario: any) {
    const antes = await prisma.cursoacesso.findUnique({
      where: { idCursoAcesso: id }
    });

    if (!antes) throw new Error('Acesso não encontrado');

    await prisma.cursoacesso.delete({
      where: { idCursoAcesso: id }
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'excluir',
      entidade: 'cursoacesso',
      entidadeId: id,
      descricao: `Acesso ao curso ${antes.fkCursoId} removido.`,
      dadosAntes: antes
    });
  }
};