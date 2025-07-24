import admin from '../../infra/firebase/firebase';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma-client';
import { generateToken } from '../../services/authService';
import { registrarEvento } from '../../shared/utils/registrarEvento';

type UsuarioRoleComPermissoes = Prisma.usuarioroleGetPayload<{
  include: {
    role: {
      include: {
        rolepermissao: {
          include: {
            permissao: true
          }
        }
      }
    }
  }
}>;

export async function loginUser(idToken: string) {
  const decoded = await admin.auth().verifyIdToken(idToken);
  const { uid, email } = decoded;

  if (!email) {
    throw new Error("Email não encontrado no token");
  }

  let usuario = await prisma.usuario.findUnique({
    where: { firebaseId: uid },
  });

  if (!usuario) {
    throw new Error("Usuário não encontrado!");
  }

  if (usuario.ativo === 0) {
    throw new Error("Usuário inativo!");
  }

  const token = generateToken({ idUsuario: usuario.idUsuario, email: usuario.email });

  // Busque roles e permissões
  const rolesDoUsuario: UsuarioRoleComPermissoes[] = await prisma.usuariorole.findMany({
    where: { fkUsuarioId: usuario.idUsuario },
    include: {
      role: {
        include: {
          rolepermissao: {
            include: {
              permissao: true
            }
          }
        }
      }
    }
  });

  // Extraia permissões únicas
  const permissoes = Array.from(new Set(
    rolesDoUsuario.flatMap((r) =>
      r.role.rolepermissao.map((p) => p.permissao.nome)
    )
  ));

  try {
    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: "login",
      descricao: `Token: ${token}`,
    });
  } catch (e) {
    throw new Error("Erro ao registrar evento de login:" + e);
  }

  return {
    usuario: {
      idUsuario: usuario.idUsuario,
      email: usuario.email,
      nome: usuario.nome,
      role: rolesDoUsuario.map((r) => r.role.nome),
      permissoes,
    },
    token,
  };
}
