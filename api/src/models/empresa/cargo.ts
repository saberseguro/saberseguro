import { prisma } from "../../config/prisma-client";
import { registrarEvento } from "../../shared/utils/registrarEvento";
import { BuscarOpts } from "../../types/BuscarOpts";

interface CargoInput {
  nome: string;
  descricao?: string;
  fkSetorId: number;
  ativo?: number;
  idUsuario: number;
  cursos?: {
    idCurso: number;
    ativo: 0 | 1;
    origem?: "EMPRESA" | "UNIDADE" | "SETOR" | "CARGO" | "FUNCIONARIO";
  }[];
  medidas?: {
    idMedida: number;
    ativo: 0 | 1;
    origem?: "EMPRESA" | "UNIDADE" | "SETOR" | "CARGO" | "FUNCIONARIO";
  }[];
}

export const buscarCargo = {
  async execute(id: number) {
    return await prisma.cargo.findUnique({
      where: { idCargo: id },
      include: {
        funcionarios: {
          select: {
            idUsuario: true,
            nome: true,
            email: true,
            ativo: true
          }
        },
      }
    });
  },
};

export const buscarCargosSetor = {
  async execute(idSetor: number, opts: BuscarOpts = {}, fkEmpresaId?: number) {

    // Buscar Setores
    const setor = await prisma.setor.findUnique({
      where: { idSetor },
      select: { fkUnidadeId: true },
    });
    const idUnidade = setor?.fkUnidadeId;


    // 1) Buscar cargos do setor
    const cargos = await prisma.cargo.findMany({
      where: { fkSetorId: idSetor },
    });

    const cargoIds = cargos.map((c) => c.idCargo);

    if ((!opts.includeCursos && !opts.includeMedidas) || cargoIds.length === 0) {
      return cargos;
    }

    // === CURSOS ===
    let cursosPorCargo: Record<number, Map<number, any>> = {};
    if (opts.includeCursos) {
      const [cargoAcessos, setorAcessos, unidadeAcessos, empresaAcessos] = await Promise.all([
        prisma.cursoacesso.findMany({
          where: { fkCargoId: { in: cargoIds } },
          include: { curso: true },
        }),
        prisma.cursoacesso.findMany({
          where: { fkSetorId: idSetor, fkCargoId: null },
          include: { curso: true },
        }),
        prisma.cursoacesso.findMany({
          where: { fkUnidadeId: idUnidade ?? undefined, fkSetorId: null, fkCargoId: null },
          include: { curso: true },
        }),
        prisma.cursoacesso.findMany({
          where: { fkEmpresaId: fkEmpresaId ?? undefined, fkUnidadeId: null, fkSetorId: null, fkCargoId: null },
          include: { curso: true },
        }),
      ]);

      for (const cId of cargoIds) cursosPorCargo[cId] = new Map();

      // Empresa
      for (const acesso of empresaAcessos) {
        for (const cId of cargoIds) {
          cursosPorCargo[cId].set(acesso.curso.idCurso, {
            idCursoAcesso: acesso.idCursoAcesso,
            idCurso: acesso.curso.idCurso,
            titulo: acesso.curso.titulo,
            ativo: acesso.curso.ativo as 0 | 1,
            origem: "EMPRESA" as const,
          });
        }
      }

      // Unidade
      for (const acesso of unidadeAcessos) {
        for (const cId of cargoIds) {
          cursosPorCargo[cId].set(acesso.curso.idCurso, {
            idCursoAcesso: acesso.idCursoAcesso,
            idCurso: acesso.curso.idCurso,
            titulo: acesso.curso.titulo,
            ativo: acesso.curso.ativo as 0 | 1,
            origem: "UNIDADE" as const,
          });
        }
      }

      // Setor
      for (const acesso of setorAcessos) {
        for (const cId of cargoIds) {
          cursosPorCargo[cId].set(acesso.curso.idCurso, {
            idCursoAcesso: acesso.idCursoAcesso,
            idCurso: acesso.curso.idCurso,
            titulo: acesso.curso.titulo,
            ativo: acesso.curso.ativo as 0 | 1,
            origem: "SETOR" as const,
          });
        }
      }

      // Cargo
      for (const acesso of cargoAcessos) {
        const cId = acesso.fkCargoId!;
        cursosPorCargo[cId].set(acesso.curso.idCurso, {
          idCursoAcesso: acesso.idCursoAcesso,
          idCurso: acesso.curso.idCurso,
          titulo: acesso.curso.titulo,
          ativo: acesso.curso.ativo as 0 | 1,
          origem: "CARGO" as const,
        });
      }
    }

    // === MEDIDAS ===
    let medidasPorCargo: Record<number, Map<number, any>> = {};
    if (opts.includeMedidas) {
      const [cargoAcessos, setorAcessos, unidadeAcessos, empresaAcessos] = await Promise.all([
        prisma.medidavinculo.findMany({
          where: { fkCargoId: { in: cargoIds } },
          include: { medida: true },
        }),
        prisma.medidavinculo.findMany({
          where: { fkSetorId: idSetor, fkCargoId: null },
          include: { medida: true },
        }),
        prisma.medidavinculo.findMany({
          where: { fkUnidadeId: idUnidade ?? undefined, fkSetorId: null, fkCargoId: null },
          include: { medida: true },
        }),
        prisma.medidavinculo.findMany({
          where: { fkEmpresaId: fkEmpresaId ?? undefined, fkUnidadeId: null, fkSetorId: null, fkCargoId: null },
          include: { medida: true },
        }),
      ]);

      for (const cId of cargoIds) medidasPorCargo[cId] = new Map();

      // Empresa
      for (const acesso of empresaAcessos) {
        for (const cId of cargoIds) {
          medidasPorCargo[cId].set(acesso.medida.idMedida, {
            idMedidaVinculo: acesso.idMedidaVinculo,
            idMedida: acesso.medida.idMedida,
            nome: acesso.medida.nome,
            tipo: acesso.medida.tipo,
            ativo: acesso.medida.ativo as 0 | 1,
            origem: "EMPRESA" as const,
          });
        }
      }

      // Unidade
      for (const acesso of unidadeAcessos) {
        for (const cId of cargoIds) {
          medidasPorCargo[cId].set(acesso.medida.idMedida, {
            idMedidaVinculo: acesso.idMedidaVinculo,
            idMedida: acesso.medida.idMedida,
            nome: acesso.medida.nome,
            tipo: acesso.medida.tipo,
            ativo: acesso.medida.ativo as 0 | 1,
            origem: "UNIDADE" as const,
          });
        }
      }

      // Setor
      for (const acesso of setorAcessos) {
        for (const cId of cargoIds) {
          medidasPorCargo[cId].set(acesso.medida.idMedida, {
            idMedidaVinculo: acesso.idMedidaVinculo,
            idMedida: acesso.medida.idMedida,
            nome: acesso.medida.nome,
            tipo: acesso.medida.tipo,
            ativo: acesso.medida.ativo as 0 | 1,
            origem: "SETOR" as const,
          });
        }
      }

      // Cargo
      for (const acesso of cargoAcessos) {
        const cId = acesso.fkCargoId!;
        medidasPorCargo[cId].set(acesso.medida.idMedida, {
          idMedidaVinculo: acesso.idMedidaVinculo,
          idMedida: acesso.medida.idMedida,
          nome: acesso.medida.nome,
          tipo: acesso.medida.tipo,
          ativo: acesso.medida.ativo as 0 | 1,
          origem: "CARGO" as const,
        });
      }
    }

    // Final - montar resultado
    const origemPrioridade = {
      CARGO: 1,
      SETOR: 2,
      UNIDADE: 3,
      EMPRESA: 4,
    } as const;

    type Origem = keyof typeof origemPrioridade;

    const resultado = cargos.map((c) => ({
      ...c,
      ...(opts.includeCursos && {
        cursos: Array.from(cursosPorCargo[c.idCargo]?.values() ?? []).sort((a, b) => {
          return origemPrioridade[a.origem as Origem] - origemPrioridade[b.origem as Origem] ||
            a.titulo.localeCompare(b.titulo);
        }),
      }),
      ...(opts.includeMedidas && {
        medidas: Array.from(medidasPorCargo[c.idCargo]?.values() ?? []).sort((a, b) => {
          return origemPrioridade[a.origem as Origem] - origemPrioridade[b.origem as Origem] ||
            a.nome.localeCompare(b.nome);
        }),
      }),
    }));

    return resultado;
  },
};

export const criarCargo = {
  async execute(data: CargoInput) {
    const { idUsuario, cursos = [], medidas = [], ...dadosCargo } = data;

    try {
      const cargo = await prisma.$transaction(async (tx) => {
        // 1) Criar cargo
        const novoCargo = await tx.cargo.create({
          data: {
            nome: dadosCargo.nome,
            descricao: dadosCargo.descricao ?? "",
            ativo: dadosCargo.ativo ?? 1,
            fkSetorId: dadosCargo.fkSetorId,
          },
        });

        // 2) Vínculo de cursos (empresa → setor → cargo, aqui é no cargo)
        if (cursos.length > 0) {
          const acessosCurso = cursos.map((c) => ({
            fkCursoId: c.idCurso,
            fkCargoId: novoCargo.idCargo,
          }));

          await tx.cursoacesso.createMany({
            data: acessosCurso,
            skipDuplicates: true,
          });
        }

        // 3) Vínculo de medidas (empresa → setor → cargo, aqui é no cargo)
        if (medidas.length > 0) {
          const medidasVinc = medidas.map((m) => ({
            fkMedidaId: m.idMedida,
            fkCargoId: novoCargo.idCargo,
          }));

          await tx.medidavinculo.createMany({
            data: medidasVinc,
            skipDuplicates: true,
          });
        }

        // 4) Evento de sucesso
        await registrarEvento({
          idUsuario,
          tipo: "criar",
          entidade: "cargo",
          entidadeId: novoCargo.idCargo,
          descricao: `Cargo: ${novoCargo.nome} criado com sucesso!`,
          dadosDepois: novoCargo,
        });

        return novoCargo;
      });

      return cargo;
    } catch (e: any) {
      // Evento de erro
      await registrarEvento({
        idUsuario,
        tipo: "erro",
        entidade: "cargo",
        descricao: `Erro ao criar cargo: ${e.message}`,
      });
      throw new Error("Erro ao criar cargo: " + e.message);
    }
  },
};

export const editarCargo = {
  async execute(id: number, data: CargoInput) {
    const { idUsuario, cursos = [], medidas = [], ...dadosCargo } = data;

    try {
      return await prisma.$transaction(async (tx) => {
        const cargoAntes = await tx.cargo.findUnique({
          where: { idCargo: id },
        });

        const cargo = await tx.cargo.update({
          where: { idCargo: id },
          data: {
            nome: dadosCargo.nome,
            descricao: dadosCargo.descricao,
            fkSetorId: dadosCargo.fkSetorId,
            ativo: dadosCargo.ativo ?? 1,
            editado_em: new Date(),
          },
        });

        // Limpa vínculos antigos
        await tx.cursoacesso.deleteMany({ where: { fkCargoId: cargo.idCargo } });
        await tx.medidavinculo.deleteMany({ where: { fkCargoId: cargo.idCargo } });

        // Vínculos de cursos
        if (cursos.length > 0) {
          const acessosCurso = cursos.map((curso) => ({
            fkCursoId: curso.idCurso,
            fkCargoId: cargo.idCargo,
          }));

          await tx.cursoacesso.createMany({
            data: acessosCurso,
            skipDuplicates: true,
          });
        }

        // Vínculos de medidas
        if (medidas.length > 0) {
          const medidasVinc = medidas.map((m) => ({
            fkMedidaId: m.idMedida,
            fkCargoId: cargo.idCargo,
          }));

          await tx.medidavinculo.createMany({
            data: medidasVinc,
            skipDuplicates: true,
          });
        }

        await registrarEvento({
          idUsuario,
          tipo: "editar",
          entidade: "cargo",
          entidadeId: cargo.idCargo,
          descricao: `Cargo: ${cargo.nome} editado com sucesso!`,
          dadosAntes: cargoAntes,
          dadosDepois: cargo,
        });

        return cargo;
      });
    } catch (e: any) {
      await registrarEvento({
        idUsuario,
        tipo: "erro",
        entidade: "cargo",
        entidadeId: id,
        descricao: `Erro ao editar cargo: ${e.message}`,
      });
      throw new Error("Erro ao editar cargo: " + e.message);
    }
  },
};

export const buscarFuncionariosDoCargo = {
  async execute(idCargo: number) {
    const funcionarios = await prisma.usuario.findMany({
      where: { fkCargoId: idCargo },
      include: {
        usuariorole: {
          include: {
            role: {
              include: {
                rolepermissao: {
                  include: { permissao: true },
                },
              },
            },
          },
        },
        usuariohorario: true,
      },
    });

    const diasSemana = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

    const usuarioIds = funcionarios.map((f) => f.idUsuario);

    const cargo = await prisma.cargo.findUnique({
      where: { idCargo },
      include: {
        setor: {
          select: {
            idSetor: true,
            fkUnidadeId: true,
          },
        },
      },
    });

    const idSetor = cargo?.setor?.idSetor ?? 0;
    const idUnidade = cargo?.setor?.fkUnidadeId ?? 0;
    const fkEmpresaId = funcionarios[0]?.fkEmpresaId ?? 0;

    // CURSOS
    const [cursoUsuario, cursoCargo, cursoSetor, cursoUnidade, cursoEmpresa] = await Promise.all([
      prisma.cursoacesso.findMany({
        where: { fkUsuarioId: { in: usuarioIds } },
        include: { curso: true },
      }),
      prisma.cursoacesso.findMany({
        where: { fkCargoId: idCargo, fkUsuarioId: null },
        include: { curso: true },
      }),
      prisma.cursoacesso.findMany({
        where: { fkSetorId: idSetor, fkCargoId: null, fkUsuarioId: null },
        include: { curso: true },
      }),
      prisma.cursoacesso.findMany({
        where: { fkUnidadeId: idUnidade, fkSetorId: null, fkCargoId: null, fkUsuarioId: null },
        include: { curso: true },
      }),
      prisma.cursoacesso.findMany({
        where: { fkEmpresaId, fkUnidadeId: null, fkSetorId: null, fkCargoId: null, fkUsuarioId: null },
        include: { curso: true },
      }),
    ]);

    // MEDIDAS
    const [medidaUsuario, medidaCargo, medidaSetor, medidaUnidade, medidaEmpresa] = await Promise.all([
      prisma.medidavinculo.findMany({
        where: { fkUsuarioId: { in: usuarioIds } },
        include: { medida: true },
      }),
      prisma.medidavinculo.findMany({
        where: { fkCargoId: idCargo, fkUsuarioId: null },
        include: { medida: true },
      }),
      prisma.medidavinculo.findMany({
        where: { fkSetorId: idSetor, fkCargoId: null, fkUsuarioId: null },
        include: { medida: true },
      }),
      prisma.medidavinculo.findMany({
        where: { fkUnidadeId: idUnidade, fkSetorId: null, fkCargoId: null, fkUsuarioId: null },
        include: { medida: true },
      }),
      prisma.medidavinculo.findMany({
        where: { fkEmpresaId, fkUnidadeId: null, fkSetorId: null, fkCargoId: null, fkUsuarioId: null },
        include: { medida: true },
      }),
    ]);

    // MONTAR RETORNO
    return funcionarios.map((f) => {
      const cursos: any[] = [];

      // USUARIO
      for (const acesso of cursoUsuario.filter(a => a.fkUsuarioId === f.idUsuario)) {
        cursos.push({
          idCursoAcesso: acesso.idCursoAcesso,
          idCurso: acesso.curso.idCurso,
          titulo: acesso.curso.titulo,
          ativo: acesso.curso.ativo as 0 | 1,
          origem: "FUNCIONARIO" as const,
        });
      }

      for (const acesso of cursoCargo) {
        cursos.push({
          idCursoAcesso: acesso.idCursoAcesso,
          idCurso: acesso.curso.idCurso,
          titulo: acesso.curso.titulo,
          ativo: acesso.curso.ativo as 0 | 1,
          origem: "CARGO" as const,
        });
      }

      for (const acesso of cursoSetor) {
        cursos.push({
          idCursoAcesso: acesso.idCursoAcesso,
          idCurso: acesso.curso.idCurso,
          titulo: acesso.curso.titulo,
          ativo: acesso.curso.ativo as 0 | 1,
          origem: "SETOR" as const,
        });
      }

      for (const acesso of cursoUnidade) {
        cursos.push({
          idCursoAcesso: acesso.idCursoAcesso,
          idCurso: acesso.curso.idCurso,
          titulo: acesso.curso.titulo,
          ativo: acesso.curso.ativo as 0 | 1,
          origem: "UNIDADE" as const,
        });
      }

      for (const acesso of cursoEmpresa) {
        cursos.push({
          idCursoAcesso: acesso.idCursoAcesso,
          idCurso: acesso.curso.idCurso,
          titulo: acesso.curso.titulo,
          ativo: acesso.curso.ativo as 0 | 1,
          origem: "EMPRESA" as const,
        });
      }

      const medidas: any[] = [];

      for (const m of medidaUsuario.filter(a => a.fkUsuarioId === f.idUsuario)) {
        medidas.push({
          idMedidaVinculo: m.idMedidaVinculo,
          idMedida: m.medida.idMedida,
          nome: m.medida.nome,
          tipo: m.medida.tipo,
          ativo: m.medida.ativo as 0 | 1,
          origem: "FUNCIONARIO" as const,
        });
      }

      for (const m of medidaCargo) {
        medidas.push({
          idMedidaVinculo: m.idMedidaVinculo,
          idMedida: m.medida.idMedida,
          nome: m.medida.nome,
          tipo: m.medida.tipo,
          ativo: m.medida.ativo as 0 | 1,
          origem: "CARGO" as const,
        });
      }

      for (const m of medidaSetor) {
        medidas.push({
          idMedidaVinculo: m.idMedidaVinculo,
          idMedida: m.medida.idMedida,
          nome: m.medida.nome,
          tipo: m.medida.tipo,
          ativo: m.medida.ativo as 0 | 1,
          origem: "SETOR" as const,
        });
      }

      for (const m of medidaUnidade) {
        medidas.push({
          idMedidaVinculo: m.idMedidaVinculo,
          idMedida: m.medida.idMedida,
          nome: m.medida.nome,
          tipo: m.medida.tipo,
          ativo: m.medida.ativo as 0 | 1,
          origem: "UNIDADE" as const,
        });
      }

      for (const m of medidaEmpresa) {
        medidas.push({
          idMedidaVinculo: m.idMedidaVinculo,
          idMedida: m.medida.idMedida,
          nome: m.medida.nome,
          tipo: m.medida.tipo,
          ativo: m.medida.ativo as 0 | 1,
          origem: "EMPRESA" as const,
        });
      }

      const roles = f.usuariorole.map((ur) => ({
        idRole: ur.role.idRole,
        nome: ur.role.nome,
      }));

      const permissoes = Array.from(
        new Set(
          f.usuariorole.flatMap((ur) =>
            ur.role.rolepermissao.map((rp) => rp.permissao.nome)
          )
        )
      );

      const usuarioHorario = f.usuariohorario.map((h) => ({
        diaSemana: h.diaSemana,
        diaSemanaNome: diasSemana[h.diaSemana],
        horarioInicio: h.horarioInicio,
        horarioFim: h.horarioFim,
      }));

      return {
        idUsuario: f.idUsuario,
        nome: f.nome,
        cpf: f.cpf,
        email: f.email,
        ativo: f.ativo,
        fkEmpresaId: f.fkEmpresaId,
        fkResponsavelTecnicoId: f.fkResponsavelTecnicoId,
        fkCargoId: f.fkCargoId,
        firebaseId: f.firebaseId,
        criado_em: f.criado_em,
        editado_em: f.editado_em,
        roles,
        permissoes,
        usuarioHorario,
        cursos,
        medidas,
      };
    });
  },
};