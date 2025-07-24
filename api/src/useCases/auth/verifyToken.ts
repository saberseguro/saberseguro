import { prisma } from "../../config/prisma-client";

export class VerifyToken {
  async execute(idUsuario: any) {
    const usuario = await prisma.usuario.findUnique({
      where: { idUsuario: Number(idUsuario) },
      include: {
        usuariorole: {
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
        },
      },
    });

    if (!usuario) {
      throw new Error("Usuário não encontrado");
    }

    return usuario;
  }
}