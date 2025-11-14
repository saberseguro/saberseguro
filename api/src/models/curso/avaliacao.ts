import { avaliacao_tipoAplicacao, pergunta_tipo } from '@prisma/client';
import { prisma } from '../../config/prisma-client';
import { registrarEvento } from '../../shared/utils/registrarEvento';

// Avaliação
export const buscarAvaliacao = {
  async execute(id: number) {
    return await prisma.avaliacao.findUnique({
      where: { idAvaliacao: id },
      include: {
        perguntas: {
          include: { alternativas: true }
        }
      }
    });
  }
};

export const buscarAvaliacoes = {
  async execute() {
    return await prisma.avaliacao.findMany({
      include: {
        perguntas: {
          include: {
            alternativas: true
          }
        }
      },
      orderBy: {
        criado_em: 'desc'
      }
    });
  }
};

export const criarAvaliacao = {
  async execute(data: any, usuario: any) {

    const isCurso = data.aplicacao === "CURSO";
    const isAula = data.aplicacao === "AULA";

    if (isCurso && !data.fkCursoId) {
      throw new Error("fkCursoId é obrigatório ao criar avaliação de curso.");
    }

    if (isAula && (!data.fkAulaId)) {
      throw new Error("fkAulaId e fkModuloId são obrigatórios ao criar avaliação de aula.");
    }

    // evitar conflitos
    if (isCurso) {
      data.fkAulaId = null;
    }

    if (isAula) {
      data.fkCursoId = null;
    }

    const avaliacao = await prisma.avaliacao.create({
      data: {
        titulo: data.titulo,
        tempo_limite: data.tempo_limite,
        tipoAplicacao: data.tipoAplicacao as avaliacao_tipoAplicacao,
        fkCursoId: data.fkCursoId,
        fkModuloId: data.fkModuloId,
        fkAulaId: data.fkAulaId,
      }
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'criar',
      entidade: 'avaliacao',
      entidadeId: avaliacao.idAvaliacao,
      descricao: `Avaliação "${avaliacao.titulo}" criada.`,
      dadosDepois: avaliacao,
    });

    return avaliacao;
  }
};

export const editarAvaliacao = {
  async execute(id: number, data: any, usuario: any) {
    const antes = await prisma.avaliacao.findUnique({ where: { idAvaliacao: id } });
    if (!antes) throw new Error('Avaliação não encontrada.');

    const isCurso = data.aplicacao === "CURSO";
    const isAula = data.aplicacao === "AULA";

    if (isCurso && !data.fkCursoId) {
      throw new Error("fkCursoId é obrigatório ao editar avaliação de curso.");
    }

    if (isAula && (!data.fkAulaId)) {
      throw new Error("fkAulaId e fkModuloId são obrigatórios ao editar avaliação de aula.");
    }

    // impedir conflito → limpa campos não usados
    if (isCurso) {
      data.fkAulaId = null;
    }

    if (isAula) {
      data.fkCursoId = null;
    }

    const avaliacao = await prisma.avaliacao.update({
      where: { idAvaliacao: id },
      data: {
        titulo: data.titulo,
        tempo_limite: data.tempo_limite,
        tipoAplicacao: data.tipoAplicacao as avaliacao_tipoAplicacao,
        fkCursoId: data.fkCursoId,
        fkModuloId: data.fkModuloId,
        fkAulaId: data.fkAulaId,
      }
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'editar',
      entidade: 'avaliacao',
      entidadeId: id,
      descricao: `Avaliação "${avaliacao.titulo}" editada.`,
      dadosAntes: antes,
      dadosDepois: avaliacao
    });

    return avaliacao;
  }
};

export const excluirAvaliacao = {
  async execute(id: number, usuario: any) {
    const antes = await prisma.avaliacao.findUnique({ where: { idAvaliacao: id } });
    if (!antes) throw new Error('Avaliação não encontrada.');

    await prisma.avaliacao.delete({ where: { idAvaliacao: id } });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'excluir',
      entidade: 'avaliacao',
      entidadeId: id,
      descricao: `Avaliação "${antes.titulo}" excluída.`,
      dadosAntes: antes
    });
  }
};

// Pergunta
export const buscarPergunta = {
  async execute(id: number) {
    return await prisma.pergunta.findUnique({
      where: { idPergunta: id },
      include: { alternativas: true }
    });
  }
};

export const criarPergunta = {
  async execute(idAvaliacao: number, data: any, usuario: any) {
    const avaliacao = await prisma.avaliacao.findUnique({
      where: { idAvaliacao }
    });

    console.log(avaliacao);

    if (!avaliacao) throw new Error('Avaliação não encontrada.');

    const pergunta = await prisma.pergunta.create({
      data: {
        enunciado: data.enunciado,
        tipo: data.tipo as pergunta_tipo,
        fkAvaliacaoId: idAvaliacao,

        alternativas: {
          create: data.alternativas?.map((alt: any) => ({
            texto: alt.texto,
            correta: alt.correta,
            ativo: 1
          })) ?? []
        }
      },
      include: { alternativas: true }
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'criar',
      entidade: 'pergunta',
      entidadeId: pergunta.idPergunta,
      descricao: `Pergunta criada com alternativas.`,
      dadosDepois: pergunta,
    });

    return pergunta;
  }
};

export const editarPergunta = {
  async execute(id: number, data: any, usuario: any) {
    const antes = await prisma.pergunta.findUnique({
      where: { idPergunta: id },
      include: { alternativas: true }
    });
    if (!antes) throw new Error('Pergunta não encontrada.');

    // Remove alternativas antigas
    await prisma.alternativa.deleteMany({
      where: { fkPerguntaId: id }
    });

    // Atualiza pergunta + recria alternativas
    const pergunta = await prisma.pergunta.update({
      where: { idPergunta: id },
      data: {
        enunciado: data.enunciado,
        tipo: data.tipo as pergunta_tipo,
        alternativas: {
          create: data.alternativas?.map((alt: any) => ({
            texto: alt.texto,
            correta: alt.correta,
            ativo: 1
          })) ?? []
        }
      },
      include: { alternativas: true }
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'editar',
      entidade: 'pergunta',
      entidadeId: id,
      descricao: `Pergunta editada com alternativas atualizadas.`,
      dadosAntes: antes,
      dadosDepois: pergunta
    });

    return pergunta;
  }
};

export const excluirPergunta = {
  async execute(id: number, usuario: any) {
    const antes = await prisma.pergunta.findUnique({ where: { idPergunta: id } });
    if (!antes) throw new Error('Pergunta não encontrada.');

    await prisma.pergunta.delete({ where: { idPergunta: id } });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'excluir',
      entidade: 'pergunta',
      entidadeId: id,
      descricao: `Pergunta excluída.`,
      dadosAntes: antes
    });
  }
};

// Alternativa
export const buscarAlternativa = {
  async execute(id: number) {
    return await prisma.alternativa.findUnique({ where: { idAlternativa: id } });
  }
};

export const criarAlternativa = {
  async execute(idPergunta: number, data: any, usuario: any) {
    const pergunta = await prisma.pergunta.findUnique({
      where: { idPergunta }
    });

    if (!pergunta) throw new Error('Pergunta não encontrada.');

    const alternativa = await prisma.alternativa.create({
      data: {
        texto: data.texto,
        correta: data.correta ?? 0,
        fkPerguntaId: idPergunta
      }
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'criar',
      entidade: 'alternativa',
      entidadeId: alternativa.idAlternativa,
      descricao: `Alternativa criada para a pergunta "${pergunta.enunciado}"`,
      dadosDepois: alternativa,
    });

    return alternativa;
  }
};

export const editarAlternativa = {
  async execute(id: number, data: any, usuario: any) {
    const antes = await prisma.alternativa.findUnique({ where: { idAlternativa: id } });
    if (!antes) throw new Error('Alternativa não encontrada.');

    const alternativa = await prisma.alternativa.update({
      where: { idAlternativa: id },
      data: {
        texto: data.texto,
        correta: data.correta
      }
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'editar',
      entidade: 'alternativa',
      entidadeId: id,
      descricao: `Alternativa editada.`,
      dadosAntes: antes,
      dadosDepois: alternativa
    });

    return alternativa;
  }
};

export const excluirAlternativa = {
  async execute(id: number, usuario: any) {
    const antes = await prisma.alternativa.findUnique({ where: { idAlternativa: id } });
    if (!antes) throw new Error('Alternativa não encontrada.');

    await prisma.alternativa.delete({ where: { idAlternativa: id } });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'excluir',
      entidade: 'alternativa',
      entidadeId: id,
      descricao: `Alternativa excluída.`,
      dadosAntes: antes
    });
  }
};

export const resultadoAvaliacao = {
  async execute(idAvaliacao: number, usuario: any) {
    const tentativas = await prisma.avaliacaousuario.findMany({
      where: {
        fkAvaliacaoId: idAvaliacao,
        fkUsuarioId: usuario.idUsuario,
        status: 'concluida'
      },
      include: {
        respostas: true,
        avaliacao: {
          include: {
            perguntas: {
              include: {
                alternativas: true
              }
            }
          }
        }
      },
      orderBy: {
        dataFim: 'desc'
      }
    });

    // 🔄 Em vez de lançar erro, retorna lista vazia
    if (!tentativas.length) {
      return { tentativas: [] };
    }

    const resultadoFinal = tentativas.map((tentativa) => ({
      idAvaliacaoUsuario: tentativa.idAvaliacaoUsuario,
      nota: tentativa.nota,
      dataFim: tentativa.dataFim,
      resultado: tentativa.avaliacao.perguntas.map((pergunta) => {
        const respostaDoUsuario = tentativa.respostas.find(
          (r) => r.fkPerguntaId === pergunta.idPergunta
        );

        const isDissertativa = pergunta.tipo === "dissertativa";

        return {
          idPergunta: pergunta.idPergunta,
          enunciado: pergunta.enunciado,
          tipo: pergunta.tipo,
          respostaTexto: isDissertativa ? respostaDoUsuario?.resposta ?? "" : null,
          alternativas: isDissertativa
            ? []
            : pergunta.alternativas.map((alt) => ({
              idAlternativa: alt.idAlternativa,
              texto: alt.texto,
              correta: alt.correta === 1,
              selecionada: alt.idAlternativa === respostaDoUsuario?.fkAlternativaId,
            })),
        };
      }),
    }));

    return { tentativas: resultadoFinal };
  },
};

// Responder avaliação
export const iniciarAvaliacao = {
  async execute(idAvaliacao: number, usuario: any) {
    const avaliacao = await prisma.avaliacao.findUnique({ where: { idAvaliacao } });
    if (!avaliacao) throw new Error('Avaliação não encontrada.');

    // Verifica se já existe tentativa em andamento
    const tentativaExistente = await prisma.avaliacaousuario.findFirst({
      where: {
        fkAvaliacaoId: idAvaliacao,
        fkUsuarioId: usuario.idUsuario,
        status: 'andamento'
      }
    });

    if (tentativaExistente) return tentativaExistente;

    const novaTentativa = await prisma.avaliacaousuario.create({
      data: {
        fkAvaliacaoId: idAvaliacao,
        fkUsuarioId: usuario.idUsuario,
        status: 'andamento'
      }
    });

    return novaTentativa;
  }
};

export const responderAvaliacao = {
  async execute(idAvaliacao: number, data: any, usuario: any) {
    const { respostas, duracaoSegundos } = data;

    const avaliacaoUsuario = await prisma.avaliacaousuario.findFirst({
      where: {
        fkAvaliacaoId: idAvaliacao,
        fkUsuarioId: usuario.idUsuario,
        status: 'andamento'
      }
    });

    if (!avaliacaoUsuario) throw new Error('Avaliação não foi iniciada.');

    const respostasCriadas = [];

    for (const respostaItem of respostas) {
      const idPergunta = Number(respostaItem.idPergunta);
      const alternativas = respostaItem.alternativas ?? [];

      const ehDissertativa = typeof alternativas[0] === "string";

      if (ehDissertativa) {
        const respostaTexto = alternativas[0];

        const respostaExistente = await prisma.resposta.findFirst({
          where: {
            fkAvaliacaoUsuarioId: avaliacaoUsuario.idAvaliacaoUsuario,
            fkPerguntaId: idPergunta,
          }
        });

        const resposta = respostaExistente
          ? await prisma.resposta.update({
            where: { idResposta: respostaExistente.idResposta },
            data: {
              resposta: respostaTexto,
              fkAlternativaId: null,  // dissertativa não tem alternativa
            },
          })
          : await prisma.resposta.create({
            data: {
              resposta: respostaTexto,
              fkPerguntaId: idPergunta,
              fkAvaliacaoUsuarioId: avaliacaoUsuario.idAvaliacaoUsuario,
              fkAlternativaId: null,
            }
          });

        respostasCriadas.push(resposta);
        continue; // pula para a próxima pergunta
      }

      // Caso seja objetiva (com alternativas numéricas)
      for (const idAlternativa of alternativas) {
        const respostaExistente = await prisma.resposta.findFirst({
          where: {
            fkAvaliacaoUsuarioId: avaliacaoUsuario.idAvaliacaoUsuario,
            fkPerguntaId: idPergunta,
            fkAlternativaId: Number(idAlternativa),
          }
        });

        const resposta = respostaExistente
          ? await prisma.resposta.update({
            where: { idResposta: respostaExistente.idResposta },
            data: {
              resposta: '',
              fkAlternativaId: Number(idAlternativa),
            },
          })
          : await prisma.resposta.create({
            data: {
              resposta: '',
              fkPerguntaId: idPergunta,
              fkAlternativaId: Number(idAlternativa),
              fkAvaliacaoUsuarioId: avaliacaoUsuario.idAvaliacaoUsuario
            }
          });

        respostasCriadas.push(resposta);
      }
    }

    return respostasCriadas;
  }
};

export const finalizarAvaliacao = {
  async execute(idAvaliacao: number, usuario: any) {
    const avaliacaoUsuario = await prisma.avaliacaousuario.findFirst({
      where: {
        fkAvaliacaoId: idAvaliacao,
        fkUsuarioId: usuario.idUsuario,
        status: 'andamento'
      },
      include: {
        respostas: true
      }
    });

    if (!avaliacaoUsuario) throw new Error('Avaliação em andamento não encontrada.');

    const perguntas = await prisma.pergunta.findMany({
      where: { fkAvaliacaoId: idAvaliacao },
      include: {
        alternativas: true
      }
    });

    // Cálculo da nota
    let totalCorretas = 0;
    let totalObjetivas = 0;

    for (const pergunta of perguntas) {
      const resposta = avaliacaoUsuario.respostas.find(r => r.fkPerguntaId === pergunta.idPergunta);
      if (!resposta) continue;

      const correta = pergunta.alternativas.find(a => a.idAlternativa === resposta.fkAlternativaId && a.correta === 1);
      if (correta) totalCorretas++;

      if (pergunta.tipo !== 'dissertativa') totalObjetivas++;
    }

    const notaFinal = totalObjetivas > 0 ? (totalCorretas / totalObjetivas) * 10 : null;

    const resultado = await prisma.avaliacaousuario.update({
      where: { idAvaliacaoUsuario: avaliacaoUsuario.idAvaliacaoUsuario },
      data: {
        dataFim: new Date(),
        nota: notaFinal,
        status: 'concluida'
      }
    });

    return resultado;
  }
};