import { prisma } from '../../config/prisma-client';
import { registrarEvento } from '../../shared/utils/registrarEvento';
import { BuscarOpts } from '../../types/BuscarOpts';

interface SetorInput {
  nome: string;
  descricao: string;
  ambiente?: string;
  fkUnidadeId: number;
  ativo?: number;
  idUsuario: number;
  cursos?: {
    idCurso: number;
    ativo: 0 | 1;
    origem?: "EMPRESA" | "UNIDADE" | "SETOR";
  }[];
  medidas?: {
    idMedida: number;
    ativo: 0 | 1;
    origem?: "EMPRESA" | "UNIDADE" | "SETOR";
  }[];
}

export const buscarsetor = {
  async execute(id: number) {
    return await prisma.setor.findUnique({
      where: { idSetor: id },
    });
  }
};

export const buscarSetoresUnidade = {
  async execute(idUnidade: number, opts: BuscarOpts = {}, fkEmpresaId?: number) {
    // 1) Buscar setores da unidade
    const setores = await prisma.setor.findMany({
      where: { fkUnidadeId: idUnidade },
      select: {
        idSetor: true,
        nome: true,
        ativo: true,
        fkUnidadeId: true,
      },
    });

    const setorIds = setores.map((s) => s.idSetor);

    // early return se não quiser cursos/medidas
    if ((!opts.includeCursos && !opts.includeMedidas) || setorIds.length === 0) {
      return setores;
    }

    // === CURSOS ===
    let cursosPorSetor: Record<number, Map<number, any>> = {};

    if (opts.includeCursos) {
      const [setorAcessos, unidadeAcessos, empresaAcessos] = await Promise.all([
        prisma.cursoacesso.findMany({
          where: { fkSetorId: { in: setorIds } },
          include: { curso: true },
        }),
        prisma.cursoacesso.findMany({
          where: { fkUnidadeId: idUnidade, fkSetorId: null },
          include: { curso: true },
        }),
        prisma.cursoacesso.findMany({
          where: { fkEmpresaId: fkEmpresaId ?? undefined, fkUnidadeId: null, fkSetorId: null },
          include: { curso: true },
        }),
      ]);

      for (const sId of setorIds) cursosPorSetor[sId] = new Map();

      for (const acesso of empresaAcessos) {
        for (const sId of setorIds) {
          cursosPorSetor[sId].set(acesso.curso.idCurso, {
            idCursoAcesso: acesso.idCursoAcesso,
            idCurso: acesso.curso.idCurso,
            titulo: acesso.curso.titulo,
            ativo: acesso.curso.ativo as 0 | 1,
            origem: "EMPRESA" as const,
          });
        }
      }

      for (const acesso of unidadeAcessos) {
        for (const sId of setorIds) {
          cursosPorSetor[sId].set(acesso.curso.idCurso, {
            idCursoAcesso: acesso.idCursoAcesso,
            idCurso: acesso.curso.idCurso,
            titulo: acesso.curso.titulo,
            ativo: acesso.curso.ativo as 0 | 1,
            origem: "UNIDADE" as const,
          });
        }
      }

      for (const acesso of setorAcessos) {
        const sId = acesso.fkSetorId!;
        cursosPorSetor[sId].set(acesso.curso.idCurso, {
          idCursoAcesso: acesso.idCursoAcesso,
          idCurso: acesso.curso.idCurso,
          titulo: acesso.curso.titulo,
          ativo: acesso.curso.ativo as 0 | 1,
          origem: "SETOR" as const,
        });
      }
    }

    // MEDIDAS
    let medidasPorSetor: Record<number, Map<number, any>> = {};

    if (opts.includeMedidas) {
      const [setorAcessos, unidadeAcessos, empresaAcessos] = await Promise.all([
        prisma.medidavinculo.findMany({
          where: { fkSetorId: { in: setorIds } },
          include: { medida: true },
        }),
        prisma.medidavinculo.findMany({
          where: { fkUnidadeId: idUnidade, fkSetorId: null },
          include: { medida: true },
        }),
        prisma.medidavinculo.findMany({
          where: { fkEmpresaId: fkEmpresaId ?? undefined, fkUnidadeId: null, fkSetorId: null },
          include: { medida: true },
        }),
      ]);

      for (const sId of setorIds) medidasPorSetor[sId] = new Map();

      for (const acesso of empresaAcessos) {
        for (const sId of setorIds) {
          medidasPorSetor[sId].set(acesso.medida.idMedida, {
            idMedidaVinculo: acesso.idMedidaVinculo,
            idMedida: acesso.medida.idMedida,
            nome: acesso.medida.nome,
            tipo: acesso.medida.tipo,
            ativo: acesso.medida.ativo as 0 | 1,
            origem: "EMPRESA" as const,
          });
        }
      }

      for (const acesso of unidadeAcessos) {
        for (const sId of setorIds) {
          medidasPorSetor[sId].set(acesso.medida.idMedida, {
            idMedidaVinculo: acesso.idMedidaVinculo,
            idMedida: acesso.medida.idMedida,
            nome: acesso.medida.nome,
            tipo: acesso.medida.tipo,
            ativo: acesso.medida.ativo as 0 | 1,
            origem: "UNIDADE" as const,
          });
        }
      }

      for (const acesso of setorAcessos) {
        const sId = acesso.fkSetorId!;
        medidasPorSetor[sId].set(acesso.medida.idMedida, {
          idMedidaVinculo: acesso.idMedidaVinculo,
          idMedida: acesso.medida.idMedida,
          nome: acesso.medida.nome,
          tipo: acesso.medida.tipo,
          ativo: acesso.medida.ativo as 0 | 1,
          origem: "SETOR" as const,
        });
      }
    }

    // Final - montar resultado agregando cursos e medidas
    const resultado = setores.map((s) => ({
      ...s,
      ...(opts.includeCursos && {
        cursos: Array.from(cursosPorSetor[s.idSetor]?.values() ?? [])
          .sort((a, b) => (a.origem === b.origem ? a.titulo.localeCompare(b.titulo) : a.origem === "SETOR" ? -1 : 1)),
      }),
      ...(opts.includeMedidas && {
        medidas: Array.from(medidasPorSetor[s.idSetor]?.values() ?? [])
          .sort((a, b) => (a.origem === b.origem ? a.nome.localeCompare(b.nome) : a.origem === "SETOR" ? -1 : 1)),
      }),
    }));

    return resultado;
  },
};

export const buscarCargosSetor = {
  async execute(idSetor: number) {
    return await prisma.cargo.findMany({
      where: { fkSetorId: idSetor },
    });
  }
};

export const criarSetor = {
  async execute(data: SetorInput) {
    const { idUsuario, cursos = [], medidas = [], ...dadosSetor } = data;

    return await prisma.$transaction(async (tx) => {
      const setor = await tx.setor.create({
        data: {
          nome: dadosSetor.nome,
          descricao: dadosSetor.descricao,
          ambiente: dadosSetor.ambiente,
          ativo: dadosSetor.ativo ?? 1,
          fkUnidadeId: dadosSetor.fkUnidadeId,
        },
      });

      // Vínculo de cursos
      if (cursos.length > 0) {
        const acessosCurso = cursos.map((curso) => ({
          fkCursoId: curso.idCurso,
          fkSetorId: setor.idSetor,
        }));

        await tx.cursoacesso.createMany({
          data: acessosCurso,
          skipDuplicates: true,
        });
      }

      // Vínculo de medidas
      if (medidas.length > 0) {
        const medidasVinc = medidas.map((m) => ({
          fkMedidaId: m.idMedida,
          fkSetorId: setor.idSetor,
        }));

        await tx.medidavinculo.createMany({
          data: medidasVinc,
          skipDuplicates: true,
        });
      }

      await registrarEvento({
        idUsuario,
        tipo: "criar",
        entidade: "setor",
        entidadeId: setor.idSetor,
        descricao: `Setor: ${setor.nome} criado com sucesso!`,
        dadosDepois: setor,
      });

      return setor;
    });
  },
};

export const editarSetor = {
  async execute(id: number, data: SetorInput) {
    const { idUsuario, cursos = [], medidas = [], ...dadosSetor } = data;

    return await prisma.$transaction(async (tx) => {
      const setorAntes = await tx.setor.findUnique({
        where: { idSetor: id },
      });

      const setor = await tx.setor.update({
        where: { idSetor: id },
        data: {
          nome: dadosSetor.nome,
          descricao: dadosSetor.descricao,
          ambiente: dadosSetor.ambiente,
          ativo: dadosSetor.ativo ?? 1,
        },
      });

      // Limpa os vínculos antigos
      await tx.cursoacesso.deleteMany({ where: { fkSetorId: setor.idSetor } });
      await tx.medidavinculo.deleteMany({ where: { fkSetorId: setor.idSetor } });

      // Vínculo de cursos
      if (cursos.length > 0) {
        const acessosCurso = cursos.map((curso) => ({
          fkCursoId: curso.idCurso,
          fkSetorId: setor.idSetor,
        }));

        await tx.cursoacesso.createMany({
          data: acessosCurso,
          skipDuplicates: true,
        });
      }

      // Vínculo de medidas
      if (medidas.length > 0) {
        const medidasVinc = medidas.map((m) => ({
          fkMedidaId: m.idMedida,
          fkSetorId: setor.idSetor,
        }));

        await tx.medidavinculo.createMany({
          data: medidasVinc,
          skipDuplicates: true,
        });
      }

      await registrarEvento({
        idUsuario,
        tipo: "editar",
        entidade: "setor",
        entidadeId: setor.idSetor,
        descricao: `Setor: ${setor.nome} editado com sucesso!`,
        dadosAntes: setorAntes,
        dadosDepois: setor,
      });

      return setor;
    });
  },
};