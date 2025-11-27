import { Prisma, aulastep_tipo } from '@prisma/client';
import { prisma } from '../../config/prisma-client';
import { registrarEvento } from '../../shared/utils/registrarEvento';
import { gerarCertificado } from './certificado';

// helper: normalização segura de arrays
const arr = <T = unknown>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

// helper: garantir que apenas um dos campos de escopo foi enviado
function assertSingleScope(data: any) {
  const scopes = ['fkEmpresaId', 'fkUnidadeId', 'fkSetorId', 'fkCargoId', 'fkUsuarioId'];
  const filled = scopes.filter(k => data[k] != null);
  if (filled.length !== 1) {
    throw new Error('Envie exatamente um escopo (empresa, unidade, setor, cargo ou usuario).');
  }
  return filled[0] as 'fkEmpresaId' | 'fkUnidadeId' | 'fkSetorId' | 'fkCargoId' | 'fkUsuarioId';
}

type CursoCompleto = Prisma.cursoGetPayload<{
  include: {
    modulos: {
      include: {
        aulas: {
          include: {
            steps: true;
            avaliacoes: true;
            materiais: true;
            videos: true;
          };
        };
        avaliacoes: true;
      };
    };
    avaliacoes: true;
  };
}>;

type AlternativaPayload = {
  idAlternativa?: number;
  texto?: string;
  correta?: number;
  ativo?: number;
};

type PerguntaPayload = {
  idPergunta?: number;
  enunciado?: string;
  tipo?: string;
  ativo?: number;
  alternativas?: AlternativaPayload[];
};

type AvaliacaoPayload = {
  idAvaliacao?: number;
  fkCursoId?: number | null;
  fkModuloId?: number | null;
  fkAulaId?: number | null;
  titulo?: string;
  tempo_limite?: number;
  tipoAplicacao?: string;
  ativo?: number;
  perguntas?: PerguntaPayload[];
};

export const buscarCursoCompleto = {
  async execute(id: number, usuario: any) {
    // 🔀 Função auxiliar para embaralhar arrays
    const shuffleArray = <T,>(array: T[]): T[] => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    // 🔹 Busca completa do curso com relacionamentos
    const curso = await prisma.curso.findUnique({
      where: { idCurso: id },
      include: {
        categorias: { include: { categoria: true } },
        modulos: {
          orderBy: { ordem: "asc" },
          include: {
            aulas: {
              orderBy: { ordem: "asc" },
              include: {
                steps: {
                  include: {
                    avaliacao: {
                      include: {
                        perguntas: { include: { alternativas: true } },
                        avaliacoesUsuarios: {
                          where: { fkUsuarioId: usuario.idUsuario },
                        },
                      },
                    },
                  },
                },
                materiais: true,
                videos: true,
                aulausuarios: {
                  where: { fkUsuarioId: usuario.idUsuario },
                },
              },
            },
            avaliacoes: {
              include: {
                perguntas: { include: { alternativas: true } },
                avaliacoesUsuarios: {
                  where: { fkUsuarioId: usuario.idUsuario },
                },
              },
            },
          },
        },
        avaliacoes: {
          include: {
            perguntas: { include: { alternativas: true } },
            avaliacoesUsuarios: {
              where: { fkUsuarioId: usuario.idUsuario },
            },
          },
        },
        responsaveltecnico: true,
        acessos: {
          where: { fkUsuarioId: usuario.idUsuario },
        },
      },
    });

    if (!curso) return null;

    // 🔹 Array de steps consolidado
    let steps: any[] = [];

    // === 1️⃣ Steps das aulas ===
    curso.modulos.forEach((mod) => {
      mod.aulas.forEach((aula) => {
        aula.steps.forEach((s) => {
          // Ignora avaliações inválidas
          if (
            s.tipo?.startsWith("avaliacao") &&
            (!s.fkAvaliacaoId || !s.avaliacao)
          ) {
            return;
          }

          // Embaralha alternativas de avaliações
          if (s.avaliacao?.perguntas) {
            s.avaliacao.perguntas.forEach((p: any) => {
              if (p.alternativas?.length > 1) {
                p.alternativas = shuffleArray(p.alternativas);
              }
            });
          }

          steps.push({
            ...s,
            tipoStep: "aula",
            idModulo: mod.idModulo,
            idAula: aula.idAula,
          });
        });
      });
    });

    // === 2️⃣ Embaralha alternativas das avaliações do curso ===
    curso.avaliacoes.forEach((av) => {
      if (av.perguntas) {
        av.perguntas.forEach((p: any) => {
          if (p.alternativas?.length > 1) {
            p.alternativas = shuffleArray(p.alternativas);
          }
        });
      }
    });

    // === 3️⃣ Adiciona avaliações de curso (sem duplicar as que já estão nos steps) ===
    const avaliacaoIdsJaUsadas = new Set(
      steps
        .filter((s) => s.fkAvaliacaoId)
        .map((s) => s.fkAvaliacaoId)
    );

    curso.avaliacoes.forEach((av) => {
      if (!avaliacaoIdsJaUsadas.has(av.idAvaliacao)) {
        steps.push({
          idAulaStep: `av-curso-${curso.idCurso}-${av.idAvaliacao}`,
          tipo: "avaliacao_curso",
          obrigatorio: true,
          fkAvaliacaoId: av.idAvaliacao,
          avaliacao: av,
        });
      }
    });

    // 🔹 Retorna o curso completo com steps prontos
    return { ...curso, steps };
  },
};

export const buscarCursos = {
  async execute(query: any) {
    const page = Number(query.page) || 1;
    const take = Number(query.take) || 10;
    const skip = (page - 1) * take;
    const lean = String(query.lean ?? "") === "1";

    const where: any = {};

    const user = query.user;
    const isAdmin = user?.roles?.includes("admin");

    if (!isAdmin && user?.fkEmpresaId) {
      where.fkEmpresaId = user.fkEmpresaId;
    }

    if (isAdmin) {
      if (query.fkEmpresaId) {
        const idEmp = Number(query.fkEmpresaId);
        const includeGlobais = String(query.includeGlobais ?? "") === "1";

        where.AND = where.AND ?? [];
        where.AND.push(
          includeGlobais
            ? { OR: [{ fkEmpresaId: idEmp }, { fkEmpresaId: null }] }
            : { fkEmpresaId: idEmp }
        );
      }
    }

    if (query.busca) {
      where.titulo = { contains: query.busca, mode: "insensitive" };
    }

    if (query.ativo !== undefined && query.ativo !== "") {
      where.ativo = Number(query.ativo);
    }

    if (query.categoria) {
      where.categorias = { some: { fkCategoriaId: Number(query.categoria) } };
    }

    if (lean) {
      const [data, total] = await Promise.all([
        prisma.curso.findMany({
          where,
          select: { idCurso: true, titulo: true, ativo: true, fkEmpresaId: true },
          orderBy: { criado_em: "desc" },
          take,
          skip,
        }),
        prisma.curso.count({ where }),
      ]);
      return { data, totalPaginas: Math.ceil(total / take) };
    }

    const [data, total] = await Promise.all([
      prisma.curso.findMany({
        where,
        include: {
          categorias: { include: { categoria: true } },
          modulos: {
            orderBy: { ordem: "asc" },
            include: {
              avaliacoes: { include: { perguntas: { include: { alternativas: true } } } },
              aulas: {
                orderBy: { ordem: "asc" },
                include: {
                  avaliacoes: { include: { perguntas: { include: { alternativas: true } } } },
                  materiais: true,
                  videos: true,
                  steps: true,
                },
              },
            },
          },
          avaliacoes: { include: { perguntas: { include: { alternativas: true } } } },
          responsaveltecnico: true,
        },
        orderBy: { criado_em: "desc" },
        take,
        skip,
      }),
      prisma.curso.count({ where }),
    ]);

    return { data, totalPaginas: Math.ceil(total / take) };
  },
};

export const buscarMeusCursos = {
  async execute(usuario: any) {

    const isAdmin = usuario.role?.includes("admin");

    if (!usuario.idUsuario || typeof usuario.idUsuario !== "number" || isNaN(usuario.idUsuario) || isAdmin) {
      throw new Error("ID do usuario inválido ou usuario administrador.");
    }

    const { idUsuario, fkCargoId } = usuario;

    // 🔹 1. Buscar hierarquia via cargo → setor → unidade → empresa
    const cargo = await prisma.cargo.findUnique({
      where: { idCargo: fkCargoId },
      select: {
        setor: {
          select: {
            idSetor: true,
            unidade: {
              select: {
                idUnidade: true,
                empresa: { select: { idEmpresa: true } },
              },
            },
          },
        },
      },
    });

    const fkSetorId = cargo?.setor?.idSetor ?? 0;
    const fkUnidadeId = cargo?.setor?.unidade?.idUnidade ?? 0;
    const fkEmpresaId = cargo?.setor?.unidade?.empresa?.idEmpresa ?? 0;

    // 🔹 2. Cursos via cursoacesso (direto por estrutura)
    const acessosDiretos = await prisma.cursoacesso.findMany({
      where: {
        OR: [
          { fkUsuarioId: idUsuario },
          { fkCargoId },
          { fkSetorId },
          { fkUnidadeId },
          { fkEmpresaId },
        ],
      },
      select: { fkCursoId: true, percentual: true, concluido: true },
    });

    const cursoIdsDiretos = acessosDiretos.map((a) => a.fkCursoId);

    // 🔹 3. Medidas vinculadas à estrutura
    const medidas = await prisma.medidavinculo.findMany({
      where: {
        OR: [
          { fkUsuarioId: idUsuario },
          { fkCargoId },
          { fkSetorId },
          { fkUnidadeId },
          { fkEmpresaId },
        ],
      },
      select: { fkMedidaId: true },
    });

    const medidaIds = medidas.map((m) => m.fkMedidaId);

    // 🔹 4. Cursos vinculados a essas medidas
    const cursosMedidas = await prisma.medidacurso.findMany({
      where: { fkMedidaId: { in: medidaIds } },
      select: { fkCursoId: true },
    });

    const cursoIdsMedidas = cursosMedidas.map((c) => c.fkCursoId);

    // 🔹 5. Unificar e remover duplicados
    const todosCursoIds = Array.from(new Set([...cursoIdsDiretos, ...cursoIdsMedidas]));

    if (todosCursoIds.length === 0) return [];

    // 🔹 6. Buscar cursos com dados mínimos para o carrossel
    const cursos = await prisma.curso.findMany({
      where: {
        idCurso: { in: todosCursoIds },
        ativo: 1,
      },
      select: {
        idCurso: true,
        titulo: true,
        descricao: true,
        cargaHoraria: true,
        acessos: {
          where: { fkUsuarioId: idUsuario },
          select: {
            percentual: true,
            concluido: true,
          },
        },
      },
      orderBy: { titulo: 'asc' },
    });

    return cursos;
  },
};

export const criarCurso = {
  async execute(data: any, usuario: any) {
    const categoriasIds = (data.categorias || []).map((c: any) =>
      typeof c === "number" ? c : c.idCategoria
    );

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
            data: categoriasIds.map((id: number) => ({
              fkCategoriaId: id
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
      },
    });

    if (!antes) {
      throw new Error("Nenhum curso encontrado com esse ID.");
    }

    if (!Array.isArray(data.categorias)) {
      throw new Error("Formato de categorias inválido — esperado array.");
    }

    // 🔹 Extrai apenas os IDs das categorias (aceita ambos formatos)
    const categoriasIds = (data.categorias || [])
      .map((c: any) => c.idCategoria || c.fkCategoriaId)
      .filter(Boolean);

    if (!categoriasIds.length) {
      throw new Error("O curso precisa de pelo menos uma categoria válida.");
    }

    // 🔹 Busca as categorias válidas no banco
    const categoriasValidas = await prisma.categoria.findMany({
      where: { idCategoria: { in: categoriasIds } },
    });

    if (!categoriasValidas.length) {
      throw new Error("Nenhuma categoria válida encontrada.");
    }

    // 🔹 Limpa vínculos antigos
    await prisma.categoriacurso.deleteMany({ where: { fkCursoId: id } });

    // 🔹 Atualiza o curso e recria vínculos
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
              fkCategoriaId: cat.idCategoria,
            })),
          },
        },
      },
      include: {
        categorias: { include: { categoria: true } },
      },
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: "editar",
      entidade: "curso",
      entidadeId: id,
      descricao: `Curso "${antes.titulo}" atualizado.`,
      dadosAntes: antes,
      dadosDepois: cursoAtualizado,
    });

    return cursoAtualizado;
  },
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

export const finalizarCurso = {
  async execute(idCurso: number, user: any) {
    const idUsuario = user.idUsuario;

    // 1️⃣ Marca como concluído na tabela cursoacesso
    const acesso = await prisma.cursoacesso.upsert({
      where: {
        fkUsuarioId_fkCursoId: {
          fkCursoId: idCurso,
          fkUsuarioId: idUsuario,
        },
      },
      update: {
        percentual: 100,
        concluido: 1,
        dataConclusao: new Date(),
      },
      create: {
        fkCursoId: idCurso,
        fkUsuarioId: idUsuario,
        dataInicio: new Date(),
        dataConclusao: new Date(),
        percentual: 100,
        concluido: 1,
      },
    });

    // 2️⃣ Busca o curso para pegar dados do certificado
    const curso = await prisma.curso.findUnique({
      where: { idCurso },
      select: {
        titulo: true,
        fkEmpresaId: true,
      },
    });

    if (!curso) throw new Error("Curso não encontrado para gerar certificado.");

    // 3️⃣ Gera (ou reaproveita) o certificado
    const certificado = await gerarCertificado.execute(
      {
        idCurso,
        idUsuario,
        idEmpresa: curso.fkEmpresaId,
        titulo: curso.titulo,
      },
      user
    );

    // 4️⃣ Loga evento
    await registrarEvento({
      idUsuario,
      tipo: "concluir_curso",
      entidade: "curso",
      entidadeId: idCurso,
      descricao: `Curso "${curso.titulo}" concluído. Certificado registrado.`,
    });

    // 5️⃣ Retorna resultado
    return { acesso, certificado };
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
    const scopeKey = assertSingleScope(data);

    const curso = await prisma.curso.findUnique({
      where: { idCurso: Number(data.fkCursoId) },
    });
    if (!curso) throw new Error("Curso não encontrado");

    const acesso = await prisma.$transaction(async (tx) => {
      // 1. Cria ou atualiza cursoacesso
      const cursoAcesso = await tx.cursoacesso.upsert({
        where: {
          uniq_cursoacesso_scope: {
            fkCursoId: Number(data.fkCursoId),
            fkEmpresaId: data.fkEmpresaId ?? null,
            fkUnidadeId: data.fkUnidadeId ?? null,
            fkSetorId: data.fkSetorId ?? null,
            fkCargoId: data.fkCargoId ?? null,
            fkUsuarioId: data.fkUsuarioId ?? null,
          },
        },
        create: {
          fkCursoId: Number(data.fkCursoId),
          fkEmpresaId: data.fkEmpresaId ?? null,
          fkUnidadeId: data.fkUnidadeId ?? null,
          fkSetorId: data.fkSetorId ?? null,
          fkCargoId: data.fkCargoId ?? null,
          fkUsuarioId: data.fkUsuarioId ?? null,
        },
        update: {},
      });

      // 2. Busca os módulos do curso
      const modulos = await tx.modulo.findMany({
        where: { fkCursoId: Number(data.fkCursoId) },
        select: { idModulo: true },
      });

      // 3. Cria moduloacesso para cada módulo, se ainda não existir
      for (const mod of modulos) {
        await tx.moduloacesso.upsert({
          where: {
            fkUsuarioId_fkModuloId: {
              fkUsuarioId: data.fkUsuarioId,
              fkModuloId: mod.idModulo,
            },
          },
          update: {},
          create: {
            fkUsuarioId: data.fkUsuarioId,
            fkModuloId: mod.idModulo,
            percentual: 0,
            concluido: false,
          },
        });
      }

      // 4. Registra evento
      await registrarEvento({
        idUsuario: usuario.idUsuario,
        tipo: "criar",
        entidade: "cursoacesso",
        entidadeId: cursoAcesso.idCursoAcesso,
        descricao: `Vínculo criado (escopo: ${scopeKey}) para curso ${data.fkCursoId}.`,
        dadosDepois: cursoAcesso,
      });

      return cursoAcesso;
    });

    return acesso;
  },
};

export const registrarCursoAcesso = {
  async execute(idCurso: number, idUsuario: number) {
    if (!idCurso || !idUsuario) {
      throw new Error("Curso e usuário são obrigatórios.");
    }

    // 🔍 Verifica se já existe acesso
    const existente = await prisma.cursoacesso.findFirst({
      where: { fkCursoId: idCurso, fkUsuarioId: idUsuario },
    });

    if (existente) return existente;

    // 🆕 Cria o novo acesso
    const novo = await prisma.cursoacesso.create({
      data: {
        fkCursoId: idCurso,
        fkUsuarioId: idUsuario,
        dataInicio: new Date(),
      },
    });

    await registrarEvento({ idUsuario, tipo: "cursoacesso", descricao: "Novo acesso ao curso", entidade: "curso", entidadeId: idCurso });

    return novo;
  },
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
      // === 1. Upsert do curso ===
      const cursoData = {
        titulo: payload.titulo,
        descricao: payload.descricao,
        cargaHoraria: Number(payload.cargaHoraria) || 0,
        ativo: payload.ativo ?? 1,
        fkResponsavelTecnicoId: payload.fkResponsavelTecnicoId,
        fkEmpresaId: payload.fkEmpresaId && payload.fkEmpresaId > 0 ? payload.fkEmpresaId : null,
      };

      const cursoBase =
        idCursoParam > 0
          ? await tx.curso.update({ where: { idCurso: idCursoParam }, data: cursoData })
          : await tx.curso.create({ data: cursoData });

      const idCurso = cursoBase.idCurso;

      // === 2. Avaliações do curso ===
      if (Array.isArray(payload.avaliacoes)) {
        await syncAvaliacoes(tx, { fkCursoId: idCurso }, arr(payload.avaliacoes));
      }

      // === 3. Módulos ===
      const modPayload = Array.isArray(payload.modulos) ? payload.modulos : [];
      const modIdsPos = modPayload.filter((m: any) => m.idModulo > 0).map((m: any) => m.idModulo);
      const modExist = await tx.modulo.findMany({ where: { fkCursoId: idCurso }, select: { idModulo: true } });
      const toDeleteMods = modExist.map((m) => m.idModulo).filter((id) => !modIdsPos.includes(id));

      if (toDeleteMods.length) {
        const aulasToDel = await tx.aula.findMany({ where: { fkModuloId: { in: toDeleteMods } }, select: { idAula: true } });
        const idsAula = aulasToDel.map((a) => a.idAula);
        if (idsAula.length) {
          await tx.aulastep.deleteMany({ where: { fkAulaId: { in: idsAula } } });
          await tx.aulavideo.deleteMany({ where: { fkAulaId: { in: idsAula } } });
          await tx.materialcomplementar.deleteMany({ where: { fkAulaId: { in: idsAula } } });
          await tx.aula.deleteMany({ where: { idAula: { in: idsAula } } });
        }
        await tx.modulo.deleteMany({ where: { idModulo: { in: toDeleteMods } } });
      }

      // === 4. Upsert de módulos e suas aulas ===
      for (const [mIdx, m] of modPayload.entries()) {
        const modData = {
          titulo: m.titulo,
          descricao: m.descricao,
          ordem: mIdx + 1,
          ativo: m.ativo ?? 1,
          cargaHoraria: Number(m.cargaHoraria) || 0,
          fkCursoId: idCurso,
        };

        let idModulo = m.idModulo;
        if (idModulo > 0) {
          await tx.modulo.update({ where: { idModulo }, data: modData });
        } else {
          const created = await tx.modulo.create({ data: modData });
          idModulo = created.idModulo;
        }

        // === Avaliações do módulo ===
        if (Array.isArray(m.avaliacoes)) {
          await syncAvaliacoes(tx, { fkModuloId: idModulo }, arr(m.avaliacoes));
        }

        // === Aulas ===
        const aulasPayload = Array.isArray(m.aulas) ? m.aulas : [];
        const aulasIdsPos = aulasPayload.filter((a: any) => a.idAula > 0).map((a: any) => a.idAula);
        const aulasExist = await tx.aula.findMany({ where: { fkModuloId: idModulo }, select: { idAula: true } });
        const toDeleteAulas = aulasExist.map((a) => a.idAula).filter((id) => !aulasIdsPos.includes(id));

        if (toDeleteAulas.length) {
          await tx.aulastep.deleteMany({ where: { fkAulaId: { in: toDeleteAulas } } });
          await tx.aulavideo.deleteMany({ where: { fkAulaId: { in: toDeleteAulas } } });
          await tx.materialcomplementar.deleteMany({ where: { fkAulaId: { in: toDeleteAulas } } });
          await tx.aula.deleteMany({ where: { idAula: { in: toDeleteAulas } } });
        }

        for (const [aIdx, a] of aulasPayload.entries()) {
          const aulaData = {
            titulo: a.titulo,
            descricao: a.descricao ?? null,
            ordem: aIdx + 1,
            ativo: a.ativo ?? 1,
            duracao: Number(a.duracao) || 0,
            tipo: a.tipo ?? "",
            fkModuloId: idModulo,
          };

          let idAula = a.idAula > 0 ? a.idAula : 0;
          if (a.idAula > 0) {
            await tx.aula.update({ where: { idAula }, data: aulaData });
          } else {
            const created = await tx.aula.create({ data: aulaData });
            idAula = created.idAula;
          }

          // === Avaliações da aula ===
          if (Array.isArray(a.avaliacoes)) {
            await syncAvaliacoes(tx, { fkAulaId: idAula }, arr(a.avaliacoes));
          }

          // === Vídeos ===
          const videoIdMap: Record<number, number> = {};
          if (Array.isArray(a.videos)) {
            const videosPayload = a.videos;
            const keepVideoIds = videosPayload.filter((v: any) => (v.idAulaVideo ?? 0) > 0).map((v: any) => v.idAulaVideo);

            await tx.aulavideo.deleteMany({
              where: { fkAulaId: idAula, idAulaVideo: { notIn: keepVideoIds.length ? keepVideoIds : [0] } },
            });

            for (const v of videosPayload) {
              if (!v.idAulaVideo || v.idAulaVideo < 0) {
                const created = await tx.aulavideo.create({
                  data: { url: v.url, fkAulaId: idAula },
                });
                videoIdMap[v.idAulaVideo ?? -1] = created.idAulaVideo;
              } else {
                await tx.aulavideo.update({
                  where: { idAulaVideo: v.idAulaVideo },
                  data: { url: v.url },
                });
                videoIdMap[v.idAulaVideo] = v.idAulaVideo;
              }
            }
          }

          // === Materiais ===
          const matIdMap: Record<number, number> = {};
          if (Array.isArray(a.materiais)) {
            const matsPayload = a.materiais;
            const keepMatIds = matsPayload
              .filter((m: any) => (m.idMaterialComplementar ?? 0) > 0)
              .map((m: any) => m.idMaterialComplementar);

            await tx.materialcomplementar.deleteMany({
              where: { fkAulaId: idAula, idMaterialComplementar: { notIn: keepMatIds.length ? keepMatIds : [0] } },
            });

            for (const m of matsPayload) {
              const matData = {
                titulo: m.titulo,
                tipo: m.tipo ?? "LINK",
                material: m.material,
                ativo: m.ativo ?? 1,
                fkAulaId: idAula,
              };

              if (!m.idMaterialComplementar || m.idMaterialComplementar < 0) {
                const created = await tx.materialcomplementar.create({ data: matData });
                matIdMap[m.idMaterialComplementar ?? -1] = created.idMaterialComplementar;
              } else {
                await tx.materialcomplementar.update({
                  where: { idMaterialComplementar: m.idMaterialComplementar },
                  data: matData,
                });
                matIdMap[m.idMaterialComplementar] = m.idMaterialComplementar;
              }
            }
          }

          // === Steps (fluxo) ===
          if (Array.isArray(a.steps)) {
            const stepsPayload = a.steps;
            const keepStepIds = stepsPayload.filter((s: any) => (s.idAulaStep ?? 0) > 0).map((s: any) => s.idAulaStep);

            await tx.aulastep.deleteMany({
              where: { fkAulaId: idAula, idAulaStep: { notIn: keepStepIds.length ? keepStepIds : [0] } },
            });

            for (const [sIdx, s] of stepsPayload.entries()) {
              const dataStep = {
                tipo:
                  aulastep_tipo[s.tipo?.toLowerCase() as keyof typeof aulastep_tipo] ??
                  aulastep_tipo.video,
                ordem: sIdx + 1,
                obrigatorio: s.obrigatorio ?? 1,
                fkAulaId: idAula,
                fkAulaVideoId:
                  s.fkAulaVideoId && s.fkAulaVideoId > 0
                    ? s.fkAulaVideoId
                    : videoIdMap?.[s.fkAulaVideoId] ?? null,
                fkMaterialId:
                  s.fkMaterialId && s.fkMaterialId > 0
                    ? s.fkMaterialId
                    : matIdMap?.[s.fkMaterialId] ?? null,
                fkAvaliacaoId: s.fkAvaliacaoId && s.fkAvaliacaoId > 0 ? s.fkAvaliacaoId : null,
              };

              if (!s.idAulaStep || s.idAulaStep < 0) {
                await tx.aulastep.create({ data: dataStep });
              } else {
                await tx.aulastep.update({
                  where: { idAulaStep: s.idAulaStep },
                  data: dataStep,
                });
              }
            }
          }
        }
      }

      // === 5. Categorias ===
      const catIdsFromPayload: number[] = Array.isArray(payload.categorias)
        ? payload.categorias
          .map((c: any) =>
            typeof c === "number" ? c : c?.idCategoria ?? c?.fkCategoriaId
          )
          .filter((v: any) => typeof v === "number")
        : [];

      const catExist = await tx.categoriacurso.findMany({
        where: { fkCursoId: idCurso },
        select: { fkCategoriaId: true },
      });
      const existIds = catExist.map((x) => x.fkCategoriaId);

      const toAdd = catIdsFromPayload.filter((id) => !existIds.includes(id));
      const toRemove = existIds.filter((id) => !catIdsFromPayload.includes(id));

      if (toRemove.length) {
        await tx.categoriacurso.deleteMany({
          where: { fkCursoId: idCurso, fkCategoriaId: { in: toRemove } },
        });
      }

      if (toAdd.length) {
        await tx.categoriacurso.createMany({
          data: toAdd.map((fkCategoriaId) => ({ fkCursoId: idCurso, fkCategoriaId })),
          skipDuplicates: true,
        });
      }

      // === 6. Retorno completo ===
      const cursoFull = await tx.curso.findUniqueOrThrow({
        where: { idCurso },
        include: {
          modulos: {
            include: {
              aulas: {
                include: {
                  videos: true,
                  materiais: true,
                  avaliacoes: {
                    include: {
                      perguntas: { include: { alternativas: true } },
                    },
                  },
                  steps: { orderBy: { ordem: "asc" } },
                },
                orderBy: { ordem: "asc" },
              },
              avaliacoes: {
                include: { perguntas: { include: { alternativas: true } } },
              },
            },
            orderBy: { ordem: "asc" },
          },
          avaliacoes: {
            include: { perguntas: { include: { alternativas: true } } },
          },
          categorias: { include: { categoria: true } },
        },
      });

      return cursoFull as any;
    }, { timeout: 120000 });
  },
};

// Avaliações
async function syncAlternativas(tx: any, fkPerguntaId: number, alternativasPayload: AlternativaPayload[]) {
  const keepIds = arr<AlternativaPayload>(alternativasPayload)
    .filter((al) => (al.idAlternativa ?? 0) > 0)
    .map((al) => al.idAlternativa);

  // apaga alternativas que sumiram
  await tx.alternativa.deleteMany({
    where: {
      fkPerguntaId,
      idAlternativa: { notIn: keepIds.length ? keepIds : [0] },
    },
  });

  for (const al of alternativasPayload) {
    const data = {
      texto: al.texto ?? '',
      correta: Number(al.correta) === 1 ? 1 : 0,
      ativo: al.ativo ?? 1,
      fkPerguntaId,
    };

    if (!al.idAlternativa || al.idAlternativa < 0) {
      await tx.alternativa.create({ data });
    } else {
      await tx.alternativa.update({
        where: { idAlternativa: al.idAlternativa },
        data: { texto: data.texto, correta: data.correta, ativo: data.ativo },
      });
    }
  }
}

async function syncPerguntas(tx: any, fkAvaliacaoId: number, perguntasPayload: PerguntaPayload[]) {
  const keepIds = arr<PerguntaPayload>(perguntasPayload)
    .filter((p) => (p.idPergunta ?? 0) > 0)
    .map((p) => p.idPergunta);

  // apaga perguntas que sumiram (alternativas caem por cascade)
  await tx.pergunta.deleteMany({
    where: {
      fkAvaliacaoId,
      idPergunta: { notIn: keepIds.length ? keepIds : [0] },
    },
  });

  for (const p of perguntasPayload) {
    const dataPerg = {
      enunciado: p.enunciado ?? '',
      tipo: p.tipo ?? 'OBJETIVA', // alinhar com enum pergunta_tipo
      ativo: p.ativo ?? 1,
      fkAvaliacaoId,
    };

    let idPergunta = p.idPergunta ?? 0;
    if (!p.idPergunta || p.idPergunta < 0) {
      const created = await tx.pergunta.create({ data: dataPerg });
      idPergunta = created.idPergunta;
    } else {
      await tx.pergunta.update({
        where: { idPergunta },
        data: { enunciado: dataPerg.enunciado, tipo: dataPerg.tipo, ativo: dataPerg.ativo },
      });
    }

    // alternativas
    await syncAlternativas(tx, idPergunta, arr<AlternativaPayload>(p.alternativas));
  }
}

async function syncAvaliacoes(tx: any, escopo: { fkCursoId?: number; fkModuloId?: number; fkAulaId?: number }, avalsPayload: AvaliacaoPayload[]) {
  // validação de escopo exclusivo
  const setCount = [escopo.fkCursoId, escopo.fkModuloId, escopo.fkAulaId].filter((v) => !!v).length;
  if (setCount !== 1) throw new Error('syncAvaliacoes: escopo inválido (defina exatamente um fk*)');

  const whereEscopo: any = {
    fkCursoId: escopo.fkCursoId ?? null,
    fkModuloId: escopo.fkModuloId ?? null,
    fkAulaId: escopo.fkAulaId ?? null,
  };

  // IDs atuais no banco para o escopo
  const atuais = await tx.avaliacao.findMany({
    where: whereEscopo,
    select: { idAvaliacao: true },
  });
  const atuaisIds = atuais.map((x: any) => x.idAvaliacao);

  const keepIds = arr<AvaliacaoPayload>(avalsPayload)
    .filter((av) => (av.idAvaliacao ?? 0) > 0)
    .map((av) => av.idAvaliacao);

  const toDelete = atuaisIds.filter((id: number) => !keepIds.includes(id));
  if (toDelete.length) {
    await tx.avaliacao.deleteMany({ where: { idAvaliacao: { in: toDelete } } });
  }

  // Upsert por avaliação
  for (const av of avalsPayload) {
    const dataAv = {
      titulo: av.titulo ?? '',
      tempo_limite: Number(av.tempo_limite) || 0,
      tipoAplicacao: av.tipoAplicacao ?? 'PADRAO',
      ativo: av.ativo ?? 1,
      fkCursoId: escopo.fkCursoId ?? null,
      fkModuloId: escopo.fkModuloId ?? null,
      fkAulaId: escopo.fkAulaId ?? null,
    };

    let idAvaliacao = av.idAvaliacao ?? 0;
    if (!av.idAvaliacao || av.idAvaliacao < 0) {
      const created = await tx.avaliacao.create({ data: dataAv });
      idAvaliacao = created.idAvaliacao;
    } else {
      await tx.avaliacao.update({
        where: { idAvaliacao },
        data: {
          titulo: dataAv.titulo,
          tempo_limite: dataAv.tempo_limite,
          tipoAplicacao: dataAv.tipoAplicacao,
          ativo: dataAv.ativo,
          fkCursoId: dataAv.fkCursoId,
          fkModuloId: dataAv.fkModuloId,
          fkAulaId: dataAv.fkAulaId,
        },
      });
    }

    await syncPerguntas(tx, idAvaliacao, arr<PerguntaPayload>(av.perguntas));
  }
}