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
  telefone?: string;
  email: string;
  senha: string;
  ativo?: number;
  fkEmpresaId?: number;
  fkCargoId?: number;
  fkResponsavelTecnicoId?: number;
  roles: number[];
  idUsuario: number;
  horarios?: HorarioDTO[];
  cursos?: { idCurso: number; ativo: 0 | 1; origem?: "EMPRESA" | "UNIDADE" | "SETOR" | "CARGO" }[];
  medidas?: { idMedida: number; ativo: 0 | 1; origem?: "EMPRESA" | "UNIDADE" | "SETOR" | "CARGO" }[];
}

export async function criarUsuario(data: NovoUsuarioDTO) {
  try {
    const {
      nome,
      cpf,
      telefone,
      email,
      senha,
      ativo = 1,
      fkEmpresaId,
      fkCargoId,
      fkResponsavelTecnicoId,
      roles,
      horarios = [],
      cursos = [],
      medidas = [],
      idUsuario,
    } = data;

    const jaExiste = await prisma.usuario.findUnique({ where: { email } });
    if (jaExiste) throw new Error("E-mail já cadastrado");

    const firebaseUser = await auth().createUser({
      email,
      password: senha,
      displayName: nome,
    });

    const firebaseId = firebaseUser.uid;

    const novoUsuario = await prisma.$transaction(async (tx) => {
      // 1. Criar usuário
      const usuario = await tx.usuario.create({
        data: {
          nome,
          cpf,
          telefone,
          email,
          firebaseId,
          ativo,
          fkEmpresaId,
          fkCargoId,
          fkResponsavelTecnicoId,
        },
      });

      const id = usuario.idUsuario;

      // 2. Criar horários (se existirem)
      if (horarios.length > 0) {
        const horariosValidos = horarios.filter(h => h.horarioInicio && h.horarioFim);
        if (horariosValidos.length > 0) {
          await tx.usuariohorario.createMany({
            data: horariosValidos.map(h => ({
              diaSemana: h.diaSemana,
              permitido: h.permitido ?? true,
              horarioInicio: h.horarioInicio,
              horarioFim: h.horarioFim,
              fkUsuarioId: id,
            })),
          });
        }
      }

      // 3. Criar roles
      if (roles.length > 0) {
        await tx.usuariorole.createMany({
          data: roles.map(roleId => ({
            fkUsuarioId: id,
            fkRoleId: roleId,
          })),
        });
      }

      // 4. Vínculo de cursos no usuário
      if (cursos.length > 0) {
        await tx.cursoacesso.createMany({
          data: cursos.map((c) => ({
            fkCursoId: c.idCurso,
            fkUsuarioId: id,
          })),
          skipDuplicates: true,
        });
      }

      // 5. Vínculo de medidas no usuário
      if (medidas.length > 0) {
        await tx.medidavinculo.createMany({
          data: medidas.map((m) => ({
            fkMedidaId: m.idMedida,
            fkUsuarioId: id,
          })),
          skipDuplicates: true,
        });
      }

      return usuario;
    });

    // 6. Evento de sucesso
    await registrarEvento({
      idUsuario,
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
  telefone?: string;
  ativo?: number;
  fkEmpresaId?: number;
  fkCargoId?: number;
  fkResponsavelTecnicoId?: number;
  roles?: number[];
  editadoPor: number;
  horarios?: HorarioDTO[];
  cursos?: { idCurso: number; ativo: 0 | 1; origem?: "EMPRESA" | "UNIDADE" | "SETOR" | "CARGO" }[];
  medidas?: { idMedida: number; ativo: 0 | 1; origem?: "EMPRESA" | "UNIDADE" | "SETOR" | "CARGO" }[];
}

export async function editarUsuario(data: EditarUsuarioDTO) {
  const {
    idUsuario,
    nome,
    cpf,
    telefone,
    ativo,
    fkCargoId,
    fkEmpresaId,
    fkResponsavelTecnicoId,
    roles = [],
    horarios = [],
    cursos = [],
    medidas = [],
    editadoPor,
  } = data;

  try {
    return await prisma.$transaction(async (tx) => {
      // 1) Buscar dados antigos para log
      const usuarioAntes = await tx.usuario.findUnique({
        where: { idUsuario },
      });
      if (!usuarioAntes) throw new Error("Usuário não encontrado");

      // 2) Atualizar dados do usuário
      const usuario = await tx.usuario.update({
        where: { idUsuario },
        data: {
          nome,
          cpf,
          telefone,
          ativo,
          fkCargoId,
          fkEmpresaId,
          fkResponsavelTecnicoId,
          editado_em: new Date(),
        },
      });

      // 3) Atualizar roles
      await tx.usuariorole.deleteMany({ where: { fkUsuarioId: idUsuario } });
      if (roles.length > 0) {
        await tx.usuariorole.createMany({
          data: roles.map((roleId) => ({
            fkUsuarioId: idUsuario,
            fkRoleId: roleId,
          })),
        });
      }

      // 4) Atualizar horários
      await tx.usuariohorario.deleteMany({ where: { fkUsuarioId: idUsuario } });
      const horariosValidos = horarios.filter((h) => h.horarioInicio && h.horarioFim);
      if (horariosValidos.length > 0) {
        await tx.usuariohorario.createMany({
          data: horariosValidos.map((h) => ({
            diaSemana: h.diaSemana,
            permitido: h.permitido ?? true,
            horarioInicio: h.horarioInicio,
            horarioFim: h.horarioFim,
            fkUsuarioId: idUsuario,
          })),
        });
      }

      // 5) Limpa vínculos antigos de cursos e medidas
      await tx.cursoacesso.deleteMany({
        where: {
          fkUsuarioId: idUsuario,
          fkEmpresaId: null,
          fkUnidadeId: null,
          fkSetorId: null,
          fkCargoId: null,
        },
      });

      await tx.medidavinculo.deleteMany({
        where: {
          fkUsuarioId: idUsuario,
          fkEmpresaId: null,
          fkUnidadeId: null,
          fkSetorId: null,
          fkCargoId: null,
        },
      });

      // 6) Vincular novos cursos
      if (cursos.length > 0) {
        await tx.cursoacesso.createMany({
          data: cursos.map((c) => ({
            fkCursoId: c.idCurso,
            fkUsuarioId: idUsuario,
          })),
          skipDuplicates: true,
        });
      }

      // 7) Vincular novas medidas
      if (medidas.length > 0) {
        await tx.medidavinculo.createMany({
          data: medidas.map((m) => ({
            fkMedidaId: m.idMedida,
            fkUsuarioId: idUsuario,
          })),
          skipDuplicates: true,
        });
      }

      // 8) Registrar evento
      await registrarEvento({
        idUsuario: editadoPor,
        tipo: "editar",
        entidade: "usuario",
        entidadeId: idUsuario,
        descricao: `Usuário ${usuario.nome} editado com sucesso!`,
        dadosAntes: usuarioAntes,
        dadosDepois: usuario,
      });

      return usuario;
    });
  } catch (e: any) {
    await registrarEvento({
      idUsuario: data.editadoPor,
      tipo: "erro",
      entidade: "usuario",
      entidadeId: data.idUsuario,
      descricao: `Erro ao editar usuário: ${e.message}`,
    });
    throw new Error("Erro ao editar usuário: " + e.message);
  }
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
      usuariohorario: true,
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

  const horarios = usuario.usuariohorario.map((h) => ({
    diaSemanaNumero: h.diaSemana,
    diaSemana: diasSemana[h.diaSemana],
    permitido: h.permitido,
    horarioInicio: h.horarioInicio,
    horarioFim: h.horarioFim,
  }));

  return horarios;
}