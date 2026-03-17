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
  const { uid, email, phone_number } = decoded;

  let usuario;

  // 🔹 1. Identificar se é login por e-mail ou telefone
  if (email) {
    usuario = await prisma.usuario.findUnique({
      where: { firebaseId: uid },
      include: {
        usuariohorario: true,
        empresa: true,
      },
    });
  } else if (phone_number) {
    // Limpa número (+55 etc)
    const numeroLimpo = phone_number.replace(/\D/g, "");

    // 🔹 Remove o DDI +55, se existir
    const numeroSemDDI = numeroLimpo.startsWith("55")
      ? numeroLimpo.slice(2)
      : numeroLimpo;

    // 🔹 Busca no banco (por número exato ou últimos 9 dígitos)
    usuario = await prisma.usuario.findFirst({
      where: {
        OR: [
          { telefone: numeroSemDDI },
          { telefone: { endsWith: numeroSemDDI.slice(-9) } },
        ],
      },
      include: { usuariohorario: true },
    });
  }

  if (!usuario) throw new Error("Usuário não encontrado.");
  if (usuario.ativo === 0) throw new Error("Usuário inativo.");

  // 🔹 2. Buscar roles e permissões
  const rolesDoUsuario: UsuarioRoleComPermissoes[] = await prisma.usuariorole.findMany({
    where: { fkUsuarioId: usuario.idUsuario },
    include: {
      role: {
        include: {
          rolepermissao: {
            include: { permissao: true },
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

  // 🔹 3. Respeitar horários de acesso
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

  // 🔹 4. Gerar seu token JWT interno
  const token = generateToken(
    {
      idUsuario: usuario.idUsuario,
      email: usuario.email,
      telefone: usuario.telefone ?? "",
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
      descricao: `Login via ${email ? "e-mail" : "telefone"} (${phone_number})`,
    });
  } catch (e) {
    throw new Error("Erro ao registrar evento de login: " + e);
  }

  return {
    usuario: {
      ...usuario,
      role: nomesRoles,
      permissoes,
    },
    token,
  };
}

export async function trocarSenha(idUsuario: number) {
  if (!idUsuario || Number.isNaN(Number(idUsuario))) {
    throw new Error("idUsuario inválido");
  }

  const usuarioAtualizado = await prisma.usuario.update({
    where: { idUsuario: Number(idUsuario) },
    data: { trocarsenha: false },
  });

  try {
    await registrarEvento({
      idUsuario: idUsuario,
      tipo: "editar",
      entidade: "usuario",
      entidadeId: idUsuario,
      descricao: `Senha alterada com sucesso`,
    });
  } catch (e) {
    throw new Error("Erro ao registrar evento de troca de senha: " + e);
  }

  return usuarioAtualizado;
}

export async function atualizarAssinatura(url: string, idUsuario: number) {
  if (!url || !idUsuario) {
    throw new Error("Faltando dados");
  }

  // Atualiza campo trocarsenha para false
  const usuarioAtualizado = await prisma.usuario.update({
    where: { idUsuario: Number(idUsuario) },
    data: { assinatura: url },
  });

  try {
    await registrarEvento({
      idUsuario: idUsuario,
      tipo: "editar",
      entidade: "usuario",
      entidadeId: idUsuario,
      descricao: `Assinatura atualizada com sucesso`,
    });
  } catch (e) {
    throw new Error("Erro ao registrar evento de atualização de assinatura: " + e);
  }

  return usuarioAtualizado;
}