import { prisma } from "../../config/prisma-client";
import { registrarEvento } from "../../shared/utils/registrarEvento";
import { avaliacaousuario_status } from "@prisma/client";

export const buscarProgressoAula = {
  async execute(idUsuario: number, idAula: number) {
    const aulaUsuario = await prisma.aulausuario.findUnique({
      where: {
        unique_fkAulaId_fkUsuarioId: {
          fkAulaId: idAula,
          fkUsuarioId: idUsuario,
        },
      },
    });

    const videos = await prisma.aulavideo.findMany({
      where: { fkAulaId: idAula },
      include: {
        progresso: {
          where: { fkUsuarioId: idUsuario },
        },
      },
    });

    const avaliacoes = await prisma.avaliacao.findMany({
      where: { fkAulaId: idAula },
      include: {
        avaliacoesUsuarios: {
          where: { fkUsuarioId: idUsuario },
        },
      },
    });

    return {
      aulaUsuario,
      videos: videos.map(v => ({
        id: v.idAulaVideo,
        url: v.url,
        progresso: v.progresso?.[0] ?? null,
      })),
      avaliacoes: avaliacoes.map(av => ({
        id: av.idAvaliacao,
        titulo: av.titulo,
        status: av.avaliacoesUsuarios?.[0]?.status ?? null,
        nota: av.avaliacoesUsuarios?.[0]?.nota ?? null,
        dataFim: av.avaliacoesUsuarios?.[0]?.dataFim ?? null,
      })),
    };
  }
};

export const registrarAulaStep = {
  async execute({
    fkAulaId,
    idReferencia,
    tipo,
    progressoVideo,
    user,
  }: {
    fkAulaId: number;
    idReferencia: number;
    tipo: "video" | "avaliacao";
    progressoVideo?: number;
    user: any;
  }) {
    if (!fkAulaId || !idReferencia || !tipo || !user?.idUsuario) {
      throw new Error("Dados incompletos.");
    }

    if (tipo === "video") {
      const tempo = progressoVideo ?? 100;
      const assistido = tempo >= 100;

      await prisma.aulavideoprogresso.upsert({
        where: {
          fkUsuarioId_fkAulaVideoId: {
            fkUsuarioId: user.idUsuario,
            fkAulaVideoId: idReferencia,
          },
        },
        update: {
          tempoAssistidoSegundos: tempo,
          assistido,
        },
        create: {
          fkAulaVideoId: idReferencia,
          fkUsuarioId: user.idUsuario,
          tempoAssistidoSegundos: tempo,
          assistido,
        },
      });
    }

    // Cria ou garante aulausuario
    await prisma.aulausuario.upsert({
      where: {
        unique_fkAulaId_fkUsuarioId: {
          fkAulaId,
          fkUsuarioId: user.idUsuario,
        },
      },
      update: {},
      create: {
        fkAulaId,
        fkUsuarioId: user.idUsuario,
        assistiuVideo: 1,
        baixouMateriais: 1,
        respondeuQuiz: 1,
        concluida: 1,
      },
    });

    // Verifica os passos obrigatórios
    const stepsObrigatorios = await prisma.aulastep.findMany({
      where: {
        fkAulaId,
        obrigatorio: 1,
      },
    });

    const obrigatoriosVideo = stepsObrigatorios.filter((s) => s.tipo === "video");
    const obrigatoriosAvaliacao = stepsObrigatorios.filter((s) => s.tipo === "avaliacao");

    let assistiuVideo = 1;
    for (const step of obrigatoriosVideo) {
      const prog = await prisma.aulavideoprogresso.findUnique({
        where: {
          fkUsuarioId_fkAulaVideoId: {
            fkUsuarioId: user.idUsuario,
            fkAulaVideoId: step.fkAulaVideoId!,
          },
        },
      });

      if (!prog?.assistido) {
        assistiuVideo = 0;
        break;
      }
    }

    let respondeuQuiz = 1;
    for (const step of obrigatoriosAvaliacao) {
      const quiz = await prisma.avaliacaousuario.findFirst({
        where: {
          fkUsuarioId: user.idUsuario,
          fkAvaliacaoId: step.fkAvaliacaoId!,
          status: avaliacaousuario_status.concluida,
        },
      });

      if (!quiz) {
        respondeuQuiz = 0;
        break;
      }
    }

    const concluida = assistiuVideo === 1 && respondeuQuiz === 1 ? 1 : 0;

    await prisma.aulausuario.update({
      where: {
        unique_fkAulaId_fkUsuarioId: {
          fkAulaId,
          fkUsuarioId: user.idUsuario,
        },
      },
      data: {
        assistiuVideo,
        respondeuQuiz,
        concluida,
      },
    });

    await registrarEvento({
      idUsuario: user.idUsuario,
      tipo: "EXECUTAR",
      entidade: "aula_step",
      dadosDepois: {
        idReferencia,
        tipo,
        progresso: progressoVideo,
      },
    });

    await atualizarProgressoCurso(fkAulaId, user.idUsuario);

    return { sucesso: true };
  },
};

export const registrarUsuarioStep = {
  async execute({
    idCurso,
    idReferencia,
    tipo,
    progressoVideo,
    user,
  }: {
    idCurso: number;
    idReferencia: number;
    tipo: "avaliacao";
    progressoVideo?: number;
    user: any;
  }) {
    if (!idReferencia || !tipo || !user?.idUsuario) {
      throw new Error("Dados incompletos.");
    }

    if (tipo === "avaliacao") {
      const avaliacao = await prisma.avaliacao.findUnique({
        where: { idAvaliacao: idReferencia },
        include: {
          avaliacoesUsuarios: {
            where: {
              fkUsuarioId: user.idUsuario,
              status: "concluida",
            },
          },
        },
      });

      if (!avaliacao || avaliacao.avaliacoesUsuarios.length === 0) {
        throw new Error("Avaliação ainda não concluída.");
      }
    }

    await registrarEvento({
      idUsuario: user.idUsuario,
      tipo: "EXECUTAR",
      entidade: "curso_step",
      dadosDepois: {
        idReferencia,
        tipo,
        progresso: progressoVideo,
      },
    });

    await atualizarProgressoCursoPorIdCurso(idCurso, user.idUsuario);

    return { sucesso: true };
  },
};

export const verificarInicioCurso = {
  async execute(idUsuario: number, idCurso: number) {
    const cursoAcesso = await prisma.cursoacesso.findUnique({
      where: {
        fkUsuarioId_fkCursoId: {
          fkUsuarioId: idUsuario,
          fkCursoId: idCurso,
        },
      },
    });

    if (!cursoAcesso) {
      await prisma.cursoacesso.create({
        data: {
          fkUsuarioId: idUsuario,
          fkCursoId: idCurso,
          dataInicio: new Date(),
          concluido: 0,
        },
      });
    } else if (!cursoAcesso.dataInicio) {
      await prisma.cursoacesso.update({
        where: {
          fkUsuarioId_fkCursoId: {
            fkUsuarioId: idUsuario,
            fkCursoId: idCurso,
          },
        },
        data: {
          dataInicio: new Date(),
        },
      });
    }
  },
};

export const verificarConclusaoModulo = {
  async execute(idUsuario: number, idModulo: number) {
    // Busca todas as aulas do módulo
    const aulas = await prisma.aula.findMany({
      where: { fkModuloId: idModulo },
      select: { idAula: true },
    });

    const total = aulas.length;

    if (total === 0) return;

    // Verifica quantas dessas o usuário concluiu
    const concluidas = await prisma.aulausuario.count({
      where: {
        fkUsuarioId: idUsuario,
        fkAulaId: { in: aulas.map((a) => a.idAula) },
        concluida: 1,
      },
    });

    if (concluidas === total) {
      await prisma.moduloacesso.upsert({
        where: {
          fkUsuarioId_fkModuloId: {
            fkUsuarioId: idUsuario,
            fkModuloId: idModulo,
          },
        },
        update: { concluido: true },
        create: {
          fkUsuarioId: idUsuario,
          fkModuloId: idModulo,
          concluido: true,
        },
      });
    }
  },
};

// Auxiliares
async function atualizarProgressoModulo(fkAulaId: number, fkUsuarioId: number) {
  // Descobre a qual módulo a aula pertence
  const aula = await prisma.aula.findUnique({
    where: { idAula: fkAulaId },
    select: { fkModuloId: true },
  });
  if (!aula) return;

  const moduloId = aula.fkModuloId;

  // Busca todas as aulas do módulo com o status do usuário
  const aulasModulo = await prisma.aula.findMany({
    where: { fkModuloId: moduloId },
    include: {
      aulausuarios: { where: { fkUsuarioId } },
    },
  });

  const totalAulas = aulasModulo.length;
  const concluidas = aulasModulo.filter(
    (a) => a.aulausuarios[0]?.concluida === 1
  ).length;

  const percentual = totalAulas > 0 ? (concluidas / totalAulas) * 100 : 0;
  const concluido = percentual === 100;

  await prisma.moduloacesso.upsert({
    where: {
      fkUsuarioId_fkModuloId: {
        fkUsuarioId,
        fkModuloId: moduloId,
      },
    },
    update: { percentual, concluido },
    create: {
      fkUsuarioId,
      fkModuloId: moduloId,
      percentual,
      concluido,
    },
  });

  return { percentual, concluido, moduloId };
}

async function atualizarProgressoCurso(fkAulaId: number, fkUsuarioId: number) {
  // Descobre o curso via aula diretamente
  const aula = await prisma.aula.findUnique({
    where: { idAula: fkAulaId },
    select: { modulo: { select: { fkCursoId: true } } },
  });

  if (!aula?.modulo?.fkCursoId) return;
  const cursoId = aula.modulo.fkCursoId;

  // === 1️⃣ Buscar aulas e progresso
  const aulas = await prisma.aula.findMany({
    where: { modulo: { fkCursoId: cursoId } },
    include: {
      aulausuarios: {
        where: { fkUsuarioId },
      },
    },
  });

  const totalAulas = aulas.length;
  const concluidas = aulas.filter(a => a.aulausuarios[0]?.concluida === 1).length;
  const percentual = totalAulas > 0 ? (concluidas / totalAulas) * 100 : 0;
  let concluido = percentual === 100;

  // === 2️⃣ Buscar avaliação final do curso (sem estar em aula)
  const avaliacaoCurso = await prisma.avaliacao.findFirst({
    where: {
      fkCursoId: cursoId,
    },
    select: { idAvaliacao: true },
  });

  // === 3️⃣ Se existir, checar se o usuário concluiu
  if (avaliacaoCurso) {
    const avaliacaoConcluida = await prisma.avaliacaousuario.findFirst({
      where: {
        fkUsuarioId,
        fkAvaliacaoId: avaliacaoCurso.idAvaliacao,
        status: "concluida",
      },
    });

    if (!avaliacaoConcluida) {
      concluido = false;
    }
  }

  // === 4️⃣ Atualizar cursoacesso
  await prisma.cursoacesso.upsert({
    where: {
      fkUsuarioId_fkCursoId: { fkUsuarioId, fkCursoId: cursoId },
    },
    update: { percentual, concluido: concluido ? 1 : 0 },
    create: {
      fkUsuarioId,
      fkCursoId: cursoId,
      percentual,
      concluido: concluido ? 1 : 0,
    },
  });

  return { percentual, concluido, cursoId };
}

async function atualizarProgressoCursoPorIdCurso(fkCursoId: number, fkUsuarioId: number) {
  // === 1️⃣ Buscar aulas e progresso do usuário
  const aulas = await prisma.aula.findMany({
    where: { modulo: { fkCursoId } },
    include: {
      aulausuarios: {
        where: { fkUsuarioId },
      },
    },
  });

  const totalAulas = aulas.length;
  const concluidas = aulas.filter(a => a.aulausuarios[0]?.concluida === 1).length;

  const percentual = totalAulas > 0 ? (concluidas / totalAulas) * 100 : 0;
  let concluido = percentual === 100;

  // === 2️⃣ Buscar avaliação final do curso (fora das aulas)
  const avaliacaoCurso = await prisma.avaliacao.findFirst({
    where: {
      fkCursoId,
    },
    select: { idAvaliacao: true },
  });

  // === 3️⃣ Se o curso tiver avaliação final, verificar se foi concluída
  if (avaliacaoCurso) {
    const avaliacaoConcluida = await prisma.avaliacaousuario.findFirst({
      where: {
        fkUsuarioId,
        fkAvaliacaoId: avaliacaoCurso.idAvaliacao,
        status: "concluida",
      },
    });

    if (!avaliacaoConcluida) {
      concluido = false;
    }
  }

  // === 4️⃣ Atualizar progresso no cursoacesso
  await prisma.cursoacesso.upsert({
    where: {
      fkUsuarioId_fkCursoId: { fkUsuarioId, fkCursoId },
    },
    update: { percentual, concluido: concluido ? 1 : 0 },
    create: {
      fkUsuarioId,
      fkCursoId,
      percentual,
      concluido: concluido ? 1 : 0,
    },
  });

  return { percentual, concluido };
}