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
      },
    });
  },
};

export const buscarCursos = {
  async execute(query: any) {
    const where: any = {};
    if (query.ativo !== undefined) where.ativo = Number(query.ativo);
    if (query.fkEmpresaId) where.fkEmpresaId = Number(query.fkEmpresaId);
    return await prisma.curso.findMany({
      where,
      include: {
        categorias: { include: { categoria: true } },
      },
      orderBy: { criado_em: 'desc' },
    });
  },
};

export const criarCurso = {
  async execute(data: any, usuario: any) {
    const cursoCriado = await prisma.curso.create({
      data: {
        titulo: data.titulo,
        descricao: data.descricao,
        cargaHoraria: data.cargaHoraria,
        fkEmpresaId: usuario.fkEmpresaId,
        fkResponsavelTecnicoId: data.fkResponsavelTecnicoId,
        categorias: {
          createMany: {
            data: data.categorias.map((id: number) => ({ fkCategoriaId: id }))
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
  async execute(id: number, data: any) {
    await prisma.categoriacurso.deleteMany({ where: { fkCursoId: id } });
    const cursoAtualizado = await prisma.curso.update({
      where: { idCurso: id },
      data: {
        titulo: data.titulo,
        descricao: data.descricao,
        cargaHoraria: data.cargaHoraria,
        categorias: {
          createMany: {
            data: data.categorias.map((id: number) => ({ fkCategoriaId: id }))
          }
        }
      },
      include: {
        categorias: { include: { categoria: true } }
      }
    });
    return cursoAtualizado;
  },
};

export const excluirCurso = {
  async execute(id: number) {
    await prisma.curso.delete({ where: { idCurso: id } });
  },
};