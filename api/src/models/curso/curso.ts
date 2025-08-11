import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma-client';
import { registrarEvento } from '../../shared/utils/registrarEvento';

type CursoCompleto = Prisma.cursoGetPayload<{
  include: {
    modulos: { include: { aulas: true, avaliacoes: true } };
    avaliacoes: true;
  };
}>;

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

// Sincronização
export const syncCurso = {
  async execute(idCursoParam: number, payload: any, user: any): Promise<CursoCompleto> {
    return prisma.$transaction(async (tx) => {
      // 1) Upsert curso
      const cursoData = {
        titulo: payload.titulo,
        descricao: payload.descricao,
        cargaHoraria: Number(payload.cargaHoraria) || 0,
        ativo: payload.ativo ?? 1,
        fkResponsavelTecnicoId: payload.fkResponsavelTecnicoId,
        fkEmpresaId: payload.fkEmpresaId ?? null,
      };

      let cursoBase = idCursoParam > 0
        ? await tx.curso.update({ where: { idCurso: idCursoParam }, data: cursoData })
        : await tx.curso.create({ data: cursoData });

      const idCurso = cursoBase.idCurso;

      // 2) Módulos: excluir os que sumiram
      const modPayload = (payload.modulos ?? []);
      const modIdsPos = modPayload.filter((m: any) => m.idModulo > 0).map((m: any) => m.idModulo);
      const modExist = await tx.modulo.findMany({ where: { fkCursoId: idCurso }, select: { idModulo: true } });
      const toDeleteMods = modExist.map(m => m.idModulo).filter(id => !modIdsPos.includes(id));
      if (toDeleteMods.length) {
        await tx.aula.deleteMany({ where: { fkModuloId: { in: toDeleteMods } } }).catch(() => { });
        await tx.modulo.deleteMany({ where: { idModulo: { in: toDeleteMods } } });
      }

      // 3) Upsert módulos (+ordem)
      for (const [mIdx, m] of modPayload.entries()) {
        const modData = {
          titulo: m.titulo,
          descricao: m.descricao,
          ordem: mIdx + 1,
          ativo: m.ativo ?? 1,
          cargaHoraria: Number(m.cargaHoraria) || 0, // era '00h'
          fkCursoId: idCurso,
        };

        let idModulo = m.idModulo;
        if (idModulo > 0) {
          await tx.modulo.update({ where: { idModulo }, data: modData });
        } else {
          const created = await tx.modulo.create({ data: modData });
          idModulo = created.idModulo;
        }

        // 4) Aulas do módulo
        const aulasPayload = m.aulas ?? [];
        const aulasIdsPos = aulasPayload.filter((a: any) => a.idAula > 0).map((a: any) => a.idAula);
        const aulasExist = await tx.aula.findMany({ where: { fkModuloId: idModulo }, select: { idAula: true } });
        const toDeleteAulas = aulasExist.map(a => a.idAula).filter(id => !aulasIdsPos.includes(id));

        // Remove aulas que sumiram (com filhos)
        if (toDeleteAulas.length) {
          await tx.aulavideo.deleteMany({ where: { fkAulaId: { in: toDeleteAulas } } }).catch(() => { });
          await tx.materialcomplementar.deleteMany({ where: { fkAulaId: { in: toDeleteAulas } } }).catch(() => { });
          await tx.aula.deleteMany({ where: { idAula: { in: toDeleteAulas } } });
        }

        for (const [aIdx, a] of aulasPayload.entries()) {
          const aulaData = {
            titulo: a.titulo,
            descricao: a.descricao ?? null,
            ordem: aIdx + 1,
            ativo: a.ativo ?? 1,
            duracao: Number(a.duracao) || 0,
            tipo: a.tipo ?? '',
            fkModuloId: idModulo,
          };

          let idAula = a.idAula > 0 ? a.idAula : 0;

          if (a.idAula > 0) {
            // UPDATE aula
            await tx.aula.update({ where: { idAula }, data: aulaData });
          } else {
            // CREATE aula e pega o id para filhos
            const created = await tx.aula.create({ data: aulaData });
            idAula = created.idAula;
          }

          const videosPayload = Array.isArray(a.videos) ? a.videos : [];
          const keepVideoIds = videosPayload
            .filter((v: any) => (v.idAulaVideo ?? 0) > 0)
            .map((v: any) => v.idAulaVideo);

          // apaga os vídeos que sumiram
          await tx.aulavideo.deleteMany({
            where: {
              fkAulaId: idAula,
              idAulaVideo: { notIn: keepVideoIds.length ? keepVideoIds : [0] },
            },
          });

          // cria/atualiza vídeos
          for (const v of videosPayload) {
            if (!v.idAulaVideo || v.idAulaVideo < 0) {
              await tx.aulavideo.create({
                data: { url: v.url, fkAulaId: idAula },
              });
            } else {
              await tx.aulavideo.update({
                where: { idAulaVideo: v.idAulaVideo },
                data: { url: v.url },
              });
            }
          }

          const matsPayload = Array.isArray(a.materiais) ? a.materiais : [];
          const keepMatIds = matsPayload
            .filter((m: any) => (m.idMaterialComplementar ?? 0) > 0)
            .map((m: any) => m.idMaterialComplementar);

          // apaga os materiais que sumiram
          await tx.materialcomplementar.deleteMany({
            where: {
              fkAulaId: idAula,
              idMaterialComplementar: { notIn: keepMatIds.length ? keepMatIds : [0] },
            },
          });

          for (const m of matsPayload) {
            const matData = {
              titulo: m.titulo,
              tipo: m.tipo ?? 'LINK', // precisa casar com enum do Prisma
              material: m.material,
              ativo: m.ativo ?? 1,
              fkAulaId: idAula,
            };

            if (!m.idMaterialComplementar || m.idMaterialComplementar < 0) {
              await tx.materialcomplementar.create({ data: matData });
            } else {
              await tx.materialcomplementar.update({
                where: { idMaterialComplementar: m.idMaterialComplementar },
                data: {
                  titulo: matData.titulo,
                  tipo: matData.tipo,
                  material: matData.material,
                  ativo: matData.ativo,
                },
              });
            }
          }
        }
      }

      // 5) CATEGORIAS — sincroniza a pivot categoriacurso
      // Aceita payload.categorias como number[] OU [{ idCategoria }] (flex)
      const catIdsFromPayload: number[] = Array.isArray(payload.categorias)
        ? payload.categorias
          .map((c: any) => (typeof c === 'number' ? c : c?.idCategoria ?? c?.fkCategoriaId))
          .filter((v: any) => typeof v === 'number')
        : [];

      // estado atual
      const catExist = await tx.categoriacurso.findMany({
        where: { fkCursoId: idCurso },
        select: { fkCategoriaId: true },
      });
      const existIds = catExist.map((x) => x.fkCategoriaId);

      // diff
      const toAdd = catIdsFromPayload.filter((id) => !existIds.includes(id));
      const toRemove = existIds.filter((id) => !catIdsFromPayload.includes(id));

      if (toRemove.length) {
        await tx.categoriacurso.deleteMany({
          where: { fkCursoId: idCurso, fkCategoriaId: { in: toRemove } },
        });
      }

      if (toAdd.length) {
        // como tem @@unique(fkCursoId, fkCategoriaId), podemos usar createMany com skipDuplicates
        await tx.categoriacurso.createMany({
          data: toAdd.map((fkCategoriaId) => ({ fkCursoId: idCurso, fkCategoriaId })),
          skipDuplicates: true,
        });
      }

      // 6) Retorna curso completo
      const cursoFull = await tx.curso.findUniqueOrThrow({
        where: { idCurso },
        include: {
          modulos: {
            include: {
              aulas: {
                include: {
                  videos: true,
                  materiais: true,
                  avaliacoes: true, // se tu também atrela avaliação à aula
                },
                orderBy: { ordem: 'asc' },
              },
              avaliacoes: true, // se manténs avaliação no nível do módulo também
            },
            orderBy: { ordem: 'asc' },
          },
          avaliacoes: true, // se tens avaliações no nível do curso
          categorias: { include: { categoria: true } },
        },
      });

      return cursoFull as any;
    });
  }
};