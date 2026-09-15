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

interface BuscarUsuarioContexto {
  isAdmin: boolean;
  fkEmpresaId?: number;
}

export async function buscarUsuario(params: BuscarUsuarioParams, contexto?: BuscarUsuarioContexto) {
  const { idUsuario, fkEmpresaId, fkCargoId, fkResponsavelTecnicoId } = params;

  if (!idUsuario && !fkEmpresaId && !fkCargoId && !fkResponsavelTecnicoId) {
    throw new Error('Informe idUsuario ou algum dos filtros: fkEmpresaId, fkCargoId ou fkResponsavelTecnicoId.');
  }

  const where: any = {};

  if (idUsuario) {
    where.idUsuario = idUsuario;

    // Correção de segurança: usuário não-admin só pode buscar por idUsuario
    // dentro da própria empresa (evita acessar usuários de outras empresas).
    if (contexto && !contexto.isAdmin) {
      where.fkEmpresaId = contexto.fkEmpresaId;
    }
  } else {
    where.OR = [];
    if (fkEmpresaId) where.OR.push({ fkEmpresaId });
    if (fkCargoId) where.OR.push({ fkCargoId });
    if (fkResponsavelTecnicoId) where.OR.push({ fkResponsavelTecnicoId });

    if (where.OR.length === 0) {
      throw new Error('Informe pelo menos um dos filtros válidos.');
    }

    // Correção de segurança: essa cláusula OR não tinha nenhuma restrição de
    // empresa, então um não-admin podia passar fkEmpresaId de OUTRA empresa
    // (ou um fkCargoId/fkResponsavelTecnicoId de outra empresa) e listar os
    // funcionários de lá. Adicionar fkEmpresaId aqui funciona como um AND
    // com o OR acima, confinando o resultado à própria empresa.
    if (contexto && !contexto.isAdmin) {
      where.fkEmpresaId = contexto.fkEmpresaId;
    }
  }

  const usuarios = await prisma.usuario.findMany({ where });
  const usuarioIds = usuarios.map((u) => u.idUsuario);

  // Correção de performance: antes buscava as roles de CADA usuário em uma
  // consulta separada (1 consulta a mais por usuário retornado). Agora busca
  // as roles de todos de uma vez só e agrupa em memória.
  const todasRoles: UsuarioRoleComPermissoes[] = usuarioIds.length
    ? await prisma.usuariorole.findMany({
      where: { fkUsuarioId: { in: usuarioIds } },
      include: {
        role: {
          include: {
            rolepermissao: {
              include: { permissao: true },
            },
          },
        },
      },
    })
    : [];

  const rolesPorUsuario = new Map<number, UsuarioRoleComPermissoes[]>();
  for (const r of todasRoles) {
    const lista = rolesPorUsuario.get(r.fkUsuarioId) ?? [];
    lista.push(r);
    rolesPorUsuario.set(r.fkUsuarioId, lista);
  }

  const usuariosComRoles = await Promise.all(
    usuarios.map(async (usuario) => {
      const rolesDoUsuario = rolesPorUsuario.get(usuario.idUsuario) ?? [];

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

const to01 = (v: any, def: number) => {
  if (v === undefined || v === null || v === "") return def;
  if (typeof v === "boolean") return v ? 1 : 0;
  const n = Number(v);
  return Number.isFinite(n) ? (n ? 1 : 0) : def;
};

interface HorarioDTO {
  diaSemana: number;
  horarioInicio: string;
  horarioFim: string;
  permitido?: boolean;
}

export type AjustesObrigatoriosDTO = {
  trocarsenha?: number | boolean; // 0/1 ou true/false
  assinatura?: number | boolean;  // 0/1 ou true/false
};


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
          trocarsenha: true,
          assinatura: null,
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

// Busca só o essencial pra checar permissão e gerar o link de redefinição
// (sem trazer roles/horários/cursos, que não são necessários aqui).
export async function buscarUsuarioEmailEEmpresa(idUsuario: number) {
  return prisma.usuario.findUnique({
    where: { idUsuario },
    select: { idUsuario: true, nome: true, email: true, fkEmpresaId: true },
  });
}

// Gera o link de redefinição de senha do Firebase pro e-mail do funcionário.
// Diferente do sendPasswordResetEmail do SDK do cliente (que só dispara o
// e-mail padrão do Firebase, sem expor o link em lugar nenhum), o SDK admin
// devolve o link pronto — assim o gestor pode copiá-lo e mandar por onde
// quiser (WhatsApp, e-mail próprio etc.), sem depender só da entrega do
// e-mail automático.
export async function gerarLinkRedefinicaoSenha(email: string) {
  return auth().generatePasswordResetLink(email);
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

// Busca os dados completos de UM funcionário (roles, horários de acesso e
// cursos/medidas vinculados, com a mesma herança cargo > setor > unidade >
// empresa usada na listagem por cargo) pra alimentar o modal de edição.
//
// É usada sempre que o modal de "Cadastro de Funcionários" abre pra editar
// alguém, não importa se a tela de origem foi o drill-down (Unidade > Setor
// > Cargo) ou a Lista de Funcionários — essa última só carrega um resumo
// leve de cada um (sem roles/horários/cursos/medidas), e usar esse resumo
// direto no formulário fazia a tela quebrar (roles undefined) e, pior,
// salvar apagaria as funções e os horários de acesso do funcionário.
export async function buscarUsuarioDetalhado(idUsuario: number) {
  const usuario = await prisma.usuario.findUnique({
    where: { idUsuario },
    include: {
      cargo: {
        include: {
          setor: {
            include: { unidade: true },
          },
        },
      },
      usuariorole: {
        include: {
          role: {
            include: {
              rolepermissao: { include: { permissao: true } },
            },
          },
        },
      },
      usuariohorario: true,
    },
  });

  if (!usuario) return null;

  const diasSemana = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

  const idCargo = usuario.fkCargoId ?? 0;
  const idSetor = usuario.cargo?.fkSetorId ?? 0;
  const idUnidade = usuario.cargo?.setor?.fkUnidadeId ?? 0;
  const fkEmpresaId = usuario.fkEmpresaId ?? 0;

  const [cursoUsuario, cursoCargo, cursoSetor, cursoUnidade, cursoEmpresa] = await Promise.all([
    prisma.cursoacesso.findMany({ where: { fkUsuarioId: idUsuario }, include: { curso: true } }),
    idCargo
      ? prisma.cursoacesso.findMany({ where: { fkCargoId: idCargo, fkUsuarioId: null }, include: { curso: true } })
      : Promise.resolve([]),
    idSetor
      ? prisma.cursoacesso.findMany({ where: { fkSetorId: idSetor, fkCargoId: null, fkUsuarioId: null }, include: { curso: true } })
      : Promise.resolve([]),
    idUnidade
      ? prisma.cursoacesso.findMany({ where: { fkUnidadeId: idUnidade, fkSetorId: null, fkCargoId: null, fkUsuarioId: null }, include: { curso: true } })
      : Promise.resolve([]),
    fkEmpresaId
      ? prisma.cursoacesso.findMany({ where: { fkEmpresaId, fkUnidadeId: null, fkSetorId: null, fkCargoId: null, fkUsuarioId: null }, include: { curso: true } })
      : Promise.resolve([]),
  ]);

  const [medidaUsuario, medidaCargo, medidaSetor, medidaUnidade, medidaEmpresa] = await Promise.all([
    prisma.medidavinculo.findMany({ where: { fkUsuarioId: idUsuario }, include: { medida: true } }),
    idCargo
      ? prisma.medidavinculo.findMany({ where: { fkCargoId: idCargo, fkUsuarioId: null }, include: { medida: true } })
      : Promise.resolve([]),
    idSetor
      ? prisma.medidavinculo.findMany({ where: { fkSetorId: idSetor, fkCargoId: null, fkUsuarioId: null }, include: { medida: true } })
      : Promise.resolve([]),
    idUnidade
      ? prisma.medidavinculo.findMany({ where: { fkUnidadeId: idUnidade, fkSetorId: null, fkCargoId: null, fkUsuarioId: null }, include: { medida: true } })
      : Promise.resolve([]),
    fkEmpresaId
      ? prisma.medidavinculo.findMany({ where: { fkEmpresaId, fkUnidadeId: null, fkSetorId: null, fkCargoId: null, fkUsuarioId: null }, include: { medida: true } })
      : Promise.resolve([]),
  ]);

  const cursos = [
    ...cursoUsuario.map((a) => ({ idCursoAcesso: a.idCursoAcesso, idCurso: a.curso.idCurso, titulo: a.curso.titulo, ativo: a.curso.ativo as 0 | 1, origem: "FUNCIONARIO" as const })),
    ...cursoCargo.map((a) => ({ idCursoAcesso: a.idCursoAcesso, idCurso: a.curso.idCurso, titulo: a.curso.titulo, ativo: a.curso.ativo as 0 | 1, origem: "CARGO" as const })),
    ...cursoSetor.map((a) => ({ idCursoAcesso: a.idCursoAcesso, idCurso: a.curso.idCurso, titulo: a.curso.titulo, ativo: a.curso.ativo as 0 | 1, origem: "SETOR" as const })),
    ...cursoUnidade.map((a) => ({ idCursoAcesso: a.idCursoAcesso, idCurso: a.curso.idCurso, titulo: a.curso.titulo, ativo: a.curso.ativo as 0 | 1, origem: "UNIDADE" as const })),
    ...cursoEmpresa.map((a) => ({ idCursoAcesso: a.idCursoAcesso, idCurso: a.curso.idCurso, titulo: a.curso.titulo, ativo: a.curso.ativo as 0 | 1, origem: "EMPRESA" as const })),
  ];

  const medidas = [
    ...medidaUsuario.map((m) => ({ idMedidaVinculo: m.idMedidaVinculo, idMedida: m.medida.idMedida, nome: m.medida.nome, tipo: m.medida.tipo, ativo: m.medida.ativo as 0 | 1, origem: "FUNCIONARIO" as const })),
    ...medidaCargo.map((m) => ({ idMedidaVinculo: m.idMedidaVinculo, idMedida: m.medida.idMedida, nome: m.medida.nome, tipo: m.medida.tipo, ativo: m.medida.ativo as 0 | 1, origem: "CARGO" as const })),
    ...medidaSetor.map((m) => ({ idMedidaVinculo: m.idMedidaVinculo, idMedida: m.medida.idMedida, nome: m.medida.nome, tipo: m.medida.tipo, ativo: m.medida.ativo as 0 | 1, origem: "SETOR" as const })),
    ...medidaUnidade.map((m) => ({ idMedidaVinculo: m.idMedidaVinculo, idMedida: m.medida.idMedida, nome: m.medida.nome, tipo: m.medida.tipo, ativo: m.medida.ativo as 0 | 1, origem: "UNIDADE" as const })),
    ...medidaEmpresa.map((m) => ({ idMedidaVinculo: m.idMedidaVinculo, idMedida: m.medida.idMedida, nome: m.medida.nome, tipo: m.medida.tipo, ativo: m.medida.ativo as 0 | 1, origem: "EMPRESA" as const })),
  ];

  const roles = usuario.usuariorole.map((ur) => ({ idRole: ur.role.idRole, nome: ur.role.nome }));

  const permissoes = Array.from(
    new Set(usuario.usuariorole.flatMap((ur) => ur.role.rolepermissao.map((rp) => rp.permissao.nome)))
  );

  const usuarioHorario = usuario.usuariohorario.map((h) => ({
    diaSemana: h.diaSemana,
    diaSemanaNome: diasSemana[h.diaSemana],
    horarioInicio: h.horarioInicio,
    horarioFim: h.horarioFim,
  }));

  return {
    idUsuario: usuario.idUsuario,
    nome: usuario.nome,
    cpf: usuario.cpf,
    telefone: usuario.telefone,
    email: usuario.email,
    ativo: usuario.ativo,
    fkEmpresaId: usuario.fkEmpresaId,
    fkResponsavelTecnicoId: usuario.fkResponsavelTecnicoId,
    fkCargoId: usuario.fkCargoId,
    criado_em: usuario.criado_em,
    editado_em: usuario.editado_em,
    roles,
    permissoes,
    usuarioHorario,
    cursos,
    medidas,
    cargo: usuario.cargo
      ? {
        idCargo: usuario.cargo.idCargo,
        nome: usuario.cargo.nome,
        setor: usuario.cargo.setor
          ? {
            idSetor: usuario.cargo.setor.idSetor,
            nome: usuario.cargo.setor.nome,
            unidade: usuario.cargo.setor.unidade
              ? { idUnidade: usuario.cargo.setor.unidade.idUnidade, nomeFantasia: usuario.cargo.setor.unidade.nomeFantasia }
              : null,
          }
          : null,
      }
      : null,
  };
}
