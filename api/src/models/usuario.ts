import { prisma } from "../config/prisma-client";
import { Prisma } from '@prisma/client';
import { registrarEvento } from "../shared/utils/registrarEvento";
import { auth } from "firebase-admin";

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

interface BuscarUsuarioParams {
  idUsuario?: number;
  fkEmpresaId?: number;
  fkCargoId?: number;
  fkResponsavelTecnicoId?: number;
}

export async function buscarUsuario(params: BuscarUsuarioParams) {
  const { idUsuario, fkEmpresaId, fkCargoId, fkResponsavelTecnicoId } = params;

  if (!idUsuario && !fkEmpresaId && !fkCargoId && !fkResponsavelTecnicoId) {
    throw new Error('Informe idUsuario ou algum dos filtros: fkEmpresaId, fkCargoId ou fkResponsavelTecnicoId.');
  }

  const where: any = {};

  if (idUsuario) {
    where.idUsuario = idUsuario;
  } else {
    where.OR = [];
    if (fkEmpresaId) where.OR.push({ fkEmpresaId });
    if (fkCargoId) where.OR.push({ fkCargoId });
    if (fkResponsavelTecnicoId) where.OR.push({ fkResponsavelTecnicoId });

    if (where.OR.length === 0) {
      throw new Error('Informe pelo menos um dos filtros válidos.');
    }
  }

  const usuarios = await prisma.usuario.findMany({ where });

  const usuariosComRoles = await Promise.all(
    usuarios.map(async (usuario) => {
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

      return {
        idUsuario: usuario.idUsuario,
        nome: usuario.nome,
        email: usuario.email,
        role: rolesDoUsuario.map((r) => r.role.nome),
        permissoes,
        fkEmpresaId: usuario.fkEmpresaId,
        fkResponsavelTecnicoId: usuario.fkResponsavelTecnicoId,
        fkCargoId: usuario.fkCargoId,
      };
    })
  );

  return usuariosComRoles;
}

interface HorarioDTO {
  diaSemana: number;
  horarioInicio: string;
  horarioFim: string;
  permitido?: boolean;
}

interface NovoUsuarioDTO {
  nome: string;
  cpf: string;
  email: string;
  senha: string;
  ativo?: number;
  fkEmpresaId?: number;
  fkCargoId?: number;
  fkResponsavelTecnicoId?: number;
  roles: number[];
  idUsuario: number;
  horarios?: HorarioDTO[];
}

export async function criarUsuario(data: NovoUsuarioDTO) {
  try {
    const {
      nome,
      cpf,
      email,
      senha,
      ativo = 1,
      fkEmpresaId,
      fkCargoId,
      fkResponsavelTecnicoId,
      roles,
    } = data;

    const jaExiste = await prisma.usuario.findUnique({ where: { email } });
    if (jaExiste) throw new Error("E-mail já cadastrado");

    const firebaseUser = await auth().createUser({
      email,
      password: senha,
      displayName: nome,
    });

    const firebaseId = firebaseUser.uid;

    const novoUsuario = await prisma.usuario.create({
      data: {
        nome,
        cpf,
        email,
        firebaseId,
        ativo,
        fkEmpresaId,
        fkCargoId,
        fkResponsavelTecnicoId,
      },
    });

    if (data.horarios && data.horarios.length > 0) {
      for (const h of data.horarios.filter(h => h.horarioInicio && h.horarioFim)) {
        await prisma.usuarioHorario.create({
          data: {
            diaSemana: h.diaSemana,
            permitido: h.permitido ?? true,
            horarioInicio: h.horarioInicio,
            horarioFim: h.horarioFim,
            fkUsuarioId: novoUsuario.idUsuario,
          },
        });
      }
    }

    await Promise.all(
      roles.map((roleId) =>
        prisma.usuariorole.create({
          data: {
            fkUsuarioId: novoUsuario.idUsuario,
            fkRoleId: roleId,
          },
        })
      )
    );

    await registrarEvento({
      idUsuario: data.idUsuario,
      tipo: "criar",
      entidade: "usuario",
      entidadeId: novoUsuario.idUsuario,
      descricao: `Usuário: ${novoUsuario.nome} criado com sucesso!`,
      dadosDepois: novoUsuario,
    });

    return novoUsuario;
  } catch (e: any) {
    await registrarEvento({
      idUsuario: data.idUsuario,
      tipo: "erro",
      entidade: "usuario",
      descricao: `Erro ao criar usuario: ${e.message}`,
    });
    throw new Error("Erro ao criar usuario: " + e.message);
  }
}

interface EditarUsuarioDTO {
  idUsuario: number;
  nome?: string;
  cpf?: string;
  ativo?: number;
  fkEmpresaId?: number;
  fkCargoId?: number;
  fkResponsavelTecnicoId?: number;
  roles?: number[];
  editadoPor: number;
  horarios?: HorarioDTO[];
}

export async function editarUsuario(data: EditarUsuarioDTO) {
  const {
    idUsuario,
    nome,
    cpf,
    ativo,
    fkCargoId,
    fkEmpresaId,
    fkResponsavelTecnicoId,
    roles,
    editadoPor,
  } = data;

  const usuarioExistente = await prisma.usuario.findUnique({ where: { idUsuario } });
  if (!usuarioExistente) throw new Error('Usuário não encontrado');

  await prisma.usuario.update({
    where: { idUsuario },
    data: {
      nome,
      cpf,
      ativo,
      fkCargoId,
      fkEmpresaId,
      fkResponsavelTecnicoId,
      editado_em: new Date(),
    },
  });

  if (roles && roles.length > 0) {
    await prisma.usuariorole.deleteMany({ where: { fkUsuarioId: idUsuario } });

    await Promise.all(
      roles.map((roleId) =>
        prisma.usuariorole.create({
          data: {
            fkUsuarioId: idUsuario,
            fkRoleId: roleId,
          },
        })
      )
    );
  }

  if (data.horarios && data.horarios.length > 0) {
    await prisma.usuarioHorario.deleteMany({
      where: { fkUsuarioId: idUsuario }
    });

    for (const h of data.horarios.filter(h => h.horarioInicio && h.horarioFim)) {
      await prisma.usuarioHorario.create({
        data: {
          diaSemana: h.diaSemana,
          permitido: h.permitido ?? true,
          horarioInicio: h.horarioInicio,
          horarioFim: h.horarioFim,
          fkUsuarioId: idUsuario,
        },
      });
    }
  }

  await registrarEvento({
    idUsuario: editadoPor,
    tipo: 'edição',
    entidade: 'usuario',
    entidadeId: idUsuario,
    descricao: `Usuário ${idUsuario} editado.`,
  });

  return { success: true };
}

export const buscarRolesComPermissoes = async () => {
  const roles = await prisma.role.findMany({
    include: {
      rolepermissao: {
        include: { permissao: true }
      }
    }
  });
  return roles;
}

export async function verificarHorarioAcesso(email: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { email },
    include: {
      usuarioHorario: true,
    },
  });

  if (!usuario) return null;

  const diasSemana = [
    "Domingo",
    "Segunda-Feira",
    "Terça-Feira",
    "Quarta-Feira",
    "Quinta-Feira",
    "Sexta-Feira",
    "Sábado"
  ];

  const horarios = usuario.usuarioHorario.map((h) => ({
    diaSemanaNumero: h.diaSemana,
    diaSemana: diasSemana[h.diaSemana],
    permitido: h.permitido,
    horarioInicio: h.horarioInicio,
    horarioFim: h.horarioFim,
  }));

  return horarios;
}