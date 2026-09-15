import { prisma } from "../../config/prisma-client";
import { registrarEvento } from "../../shared/utils/registrarEvento";
import { evolutionWhatsappService } from "../../services/whatsapp/evolutionWhatsappService";

interface ExecutarNotificacoesParams {
  usuarioExecutor?: any;
  forcar?: boolean;
  limite?: number;
}

type CursoAcessoPendente = Awaited<
  ReturnType<typeof buscarCursoAcessosPendentes>
>[number];

function normalizarTelefoneWhatsapp(telefone?: string | null) {
  if (!telefone) return null;

  const digitos = telefone.replace(/\D/g, "");

  if (digitos.length === 10 || digitos.length === 11) {
    return `55${digitos}`;
  }

  if (
    digitos.startsWith("55") &&
    (digitos.length === 12 || digitos.length === 13)
  ) {
    return digitos;
  }

  return null;
}

function arredondarPercentual(percentual: number | null | undefined) {
  return Math.max(0, Math.min(100, Math.round(percentual ?? 0)));
}

async function buscarCursoAcessosPendentes(forcar = false) {
  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

  return prisma.cursoacesso.findMany({
    where: {
      fkUsuarioId: { not: null },
      concluido: 0,
      percentual: { lt: 100 },
      curso: {
        ativo: 1,
      },
      usuario: {
        ativo: 1,
        telefone: { not: null },
      },
      ...(forcar
        ? {}
        : {
            OR: [
              { ultimaNotificacaoWhatsapp: null },
              { ultimaNotificacaoWhatsapp: { lt: seteDiasAtras } },
            ],
          }),
    },
    include: {
      curso: {
        select: {
          idCurso: true,
          titulo: true,
          ativo: true,
        },
      },
      usuario: {
        select: {
          idUsuario: true,
          nome: true,
          telefone: true,
          ativo: true,
        },
      },
    },
    orderBy: {
      atualizado_em: "asc",
    },
  });
}

function montarMensagem(acesso: CursoAcessoPendente) {
  const percentual = arredondarPercentual(acesso.percentual);

  return `Ola, ${acesso.usuario?.nome}!

Identificamos que o curso "${acesso.curso.titulo}" ainda nao foi concluido.
Seu progresso atual e de ${percentual}%.

Acesse o sistema para finalizar seu treinamento e emitir seu certificado.`;
}

export const listarCursosPendentesWhatsapp = {
  async execute(params?: { forcar?: boolean }) {
    const acessos = await buscarCursoAcessosPendentes(params?.forcar ?? false);

    return acessos
      .map((acesso) => ({
        idCursoAcesso: acesso.idCursoAcesso,
        idUsuario: acesso.usuario?.idUsuario,
        nomeUsuario: acesso.usuario?.nome,
        telefone: acesso.usuario?.telefone,
        telefoneWhatsapp: normalizarTelefoneWhatsapp(acesso.usuario?.telefone),
        idCurso: acesso.curso.idCurso,
        tituloCurso: acesso.curso.titulo,
        percentual: arredondarPercentual(acesso.percentual),
        ultimaNotificacaoWhatsapp: acesso.ultimaNotificacaoWhatsapp,
        qtdNotificacoesWhatsapp: acesso.qtdNotificacoesWhatsapp,
      }))
      .filter((item) => !!item.telefoneWhatsapp);
  },
};

export const executarNotificacoesCursosPendentesWhatsapp = {
  async execute(params: ExecutarNotificacoesParams = {}) {
    const forcar = params.forcar ?? false;
    const limite = Number(params.limite) > 0 ? Number(params.limite) : undefined;
    const acessos = await buscarCursoAcessosPendentes(forcar);
    const selecionados = limite ? acessos.slice(0, limite) : acessos;

    const resultado = {
      totalPendentes: acessos.length,
      processados: 0,
      enviados: 0,
      simulados: 0,
      ignorados: 0,
      erros: 0,
      detalhes: [] as any[],
    };

    for (const acesso of selecionados) {
      const telefoneWhatsapp = normalizarTelefoneWhatsapp(
        acesso.usuario?.telefone
      );

      if (!telefoneWhatsapp || !acesso.usuario) {
        resultado.ignorados += 1;
        resultado.detalhes.push({
          idCursoAcesso: acesso.idCursoAcesso,
          status: "telefone_invalido",
        });
        continue;
      }

      const mensagem = montarMensagem(acesso);

      try {
        const envio = await evolutionWhatsappService.enviarMensagem({
          telefone: telefoneWhatsapp,
          mensagem,
        });

        resultado.processados += 1;

        if (!envio.sucesso) {
          resultado.erros += 1;
        } else if (envio.simulado) {
          resultado.simulados += 1;
        } else {
          resultado.enviados += 1;
        }

        if (envio.sucesso) {
          await prisma.cursoacesso.update({
            where: { idCursoAcesso: acesso.idCursoAcesso },
            data: {
              ultimaNotificacaoWhatsapp: new Date(),
              qtdNotificacoesWhatsapp: {
                increment: 1,
              },
            },
          });
        }

        await registrarEvento({
          idUsuario: acesso.usuario.idUsuario,
          tipo: envio.simulado
            ? "simular_notificacao_whatsapp"
            : "enviar_notificacao_whatsapp",
          entidade: "cursoacesso",
          entidadeId: acesso.idCursoAcesso,
          descricao: `Lembrete de curso pendente para "${acesso.curso.titulo}": ${envio.status}.`,
          dadosDepois: {
            telefone: telefoneWhatsapp,
            curso: acesso.curso.titulo,
            percentual: arredondarPercentual(acesso.percentual),
            envio,
            executadoPor: params.usuarioExecutor?.idUsuario ?? null,
          },
        });

        resultado.detalhes.push({
          idCursoAcesso: acesso.idCursoAcesso,
          idUsuario: acesso.usuario.idUsuario,
          idCurso: acesso.curso.idCurso,
          telefone: telefoneWhatsapp,
          status: envio.status,
          simulado: envio.simulado,
        });
      } catch (error: any) {
        resultado.processados += 1;
        resultado.erros += 1;

        await registrarEvento({
          idUsuario: acesso.usuario.idUsuario,
          tipo: "erro_notificacao_whatsapp",
          entidade: "cursoacesso",
          entidadeId: acesso.idCursoAcesso,
          descricao: `Erro ao notificar curso pendente: ${error.message}`,
          dadosDepois: {
            curso: acesso.curso.titulo,
            erro: error.message,
            executadoPor: params.usuarioExecutor?.idUsuario ?? null,
          },
        });

        resultado.detalhes.push({
          idCursoAcesso: acesso.idCursoAcesso,
          status: "erro",
          erro: error.message,
        });
      }
    }

    return resultado;
  },
};
