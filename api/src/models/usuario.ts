import { prisma } from "../config/prisma-client";
import { Prisma } from '@prisma/client';
import { registrarEvento } from "../shared/utils/registrarEvento";
import { auth } from "firebase-admin";

interface UsuarioInput {
  nome: string;
  email: string;
  ativo?: number;
  fkEmpresaId?: number;
  fkCargoId?: number;
  fkResponsavelTecnicoId?: number;
  roles: number[];
  firebaseId: string;
}

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
}

interface NovoUsuarioDTO {
  nome: string;
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
  const diaAtual = new Date().getDay();

  const usuario = await prisma.usuario.findUnique({
    where: { email },
  });

  if (!usuario) return null;

  const diasSemana = ["Domingo", "Segunda-Feira", "Terça-Feira", "Quarta-Feira", "Quinta-Feira", "Sexta-Feira", "Sábado"];

  const horario = await prisma.usuarioHorario.findFirst({
    where: {
      fkUsuarioId: usuario.idUsuario,
      diaSemana: diaAtual,
    },
    select: {
      diaSemana: true,
      horarioInicio: true,
      horarioFim: true,
    },
  });

  return { ...horario, diaSemana: diasSemana[horario?.diaSemana || 0] };
}