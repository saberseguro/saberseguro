import admin from '../../infra/firebase/firebase';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma-client';
import { generateToken } from '../../services/authService';
import { registrarEvento } from '../../shared/utils/registrarEvento';
import { getDay } from 'date-fns';

type UsuarioRoleComPermissoes = Prisma.usuarioroleGetPayload<{
  include: {
    role: {
      include: {
        rolepermissao: {
          include: {
            permissao: true;
          };
        };
      };
    };
  };
}>;

export async function loginUser(idToken: string) {
  const decoded = await admin.auth().verifyIdToken(idToken);
  const { uid, email } = decoded;

  if (!email) throw new Error("Email não encontrado no token.");

  const usuario = await prisma.usuario.findUnique({
    where: { firebaseId: uid },
    include: {
      usuarioHorario: true,
    },
  });

  if (!usuario) throw new Error("Usuário não encontrado.");
  if (usuario.ativo === 0) throw new Error("Usuário inativo.");

  // Verificação de horário
  const agora = new Date();
  const diaSemana = getDay(agora); // 0 = domingo, 1 = segunda, ..., 6 = sábado

  const horarioDoDia = usuario.usuarioHorario.find(
    (h) => h.diaSemana === diaSemana
  );

  if (!horarioDoDia) {
    throw new Error("Acesso não permitido neste dia.");
  }

  const [inicioHora, inicioMinuto] = horarioDoDia.horarioInicio.split(':').map(Number);
  const [fimHora, fimMinuto] = horarioDoDia.horarioFim.split(':').map(Number);

  const inicioPermitido = new Date(agora);
  inicioPermitido.setHours(inicioHora, inicioMinuto, 0, 0);

  const fimPermitido = new Date(agora);
  fimPermitido.setHours(fimHora, fimMinuto, 0, 0);

  if (agora < inicioPermitido || agora >= fimPermitido) {
    throw new Error("Acesso não permitido neste horário.");
  }

  const tempoRestanteSegundos = Math.floor((fimPermitido.getTime() - agora.getTime()) / 1000);
  if (tempoRestanteSegundos <= 0) {
    throw new Error("Tempo de sessão insuficiente. Acesso negado.");
  }

  // Buscar roles e permissões
  const rolesDoUsuario: UsuarioRoleComPermissoes[] = await prisma.usuariorole.findMany({
    where: { fkUsuarioId: usuario.idUsuario },
    include: {
      role: {
        include: {
          rolepermissao: {
            include: {
              permissao: true,
            },
          },
        },
      },
    },
  });

  const permissoes = Array.from(
    new Set(
      rolesDoUsuario.flatMap((r) =>
        r.role.rolepermissao.map((p) => p.permissao.nome)
      )
    )
  );

  const token = generateToken(
    {
      idUsuario: usuario.idUsuario,
      email: usuario.email,
      nome: usuario.nome ?? "",
      roles: rolesDoUsuario.map((r) => r.role.nome),
      permissoes,
      fkEmpresaId: usuario.fkEmpresaId ?? undefined,
      fkResponsavelTecnicoId: usuario.fkResponsavelTecnicoId ?? undefined,
      fkCargoId: usuario.fkCargoId ?? undefined,
    },
    tempoRestanteSegundos
  );

  try {
    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: "login",
      descricao: `Token: ${token}`,
    });
  } catch (e) {
    throw new Error("Erro ao registrar evento de login: " + e);
  }

  return {
    usuario: {
      idUsuario: usuario.idUsuario,
      email: usuario.email,
      nome: usuario.nome,
      role: rolesDoUsuario.map((r) => r.role.nome),
      permissoes,
      fkEmpresaId: usuario.fkEmpresaId,
      fkResponsavelTecnicoId: usuario.fkResponsavelTecnicoId,
      fkCargoId: usuario.fkCargoId,
    },
    token,
  };
}