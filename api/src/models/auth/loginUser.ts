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
      usuariohorario: true,
    },
  });

  if (!usuario) throw new Error("Usuário não encontrado.");
  if (usuario.ativo === 0) throw new Error("Usuário inativo.");

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

  const nomesRoles = rolesDoUsuario.map((r) => r.role.nome);
  const isAdmin = nomesRoles.includes("admin");

  let tempoRestanteSegundos = 3600;

  if (!isAdmin) {
    const agora = new Date();
    const diaSemana = getDay(agora);

    const horarioDoDia = usuario.usuariohorario.find(
      (h) => h.diaSemana === diaSemana && h.permitido
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

    tempoRestanteSegundos = Math.floor((fimPermitido.getTime() - agora.getTime()) / 1000);
    if (tempoRestanteSegundos <= 0) {
      throw new Error("Tempo de sessão insuficiente. Acesso negado.");
    }
  }

  const token = generateToken(
    {
      idUsuario: usuario.idUsuario,
      email: usuario.email,
      nome: usuario.nome ?? "",
      cpf: usuario.cpf ?? "",
      roles: nomesRoles,
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
      cpf: usuario.cpf,
      role: nomesRoles,
      permissoes,
      fkEmpresaId: usuario.fkEmpresaId,
      fkResponsavelTecnicoId: usuario.fkResponsavelTecnicoId,
      fkCargoId: usuario.fkCargoId,
    },
    token,
  };
}