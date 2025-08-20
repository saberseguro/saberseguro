import { unidade_tipoDocumento } from "@prisma/client";
import { prisma } from "../../config/prisma-client";
import { registrarEvento } from "../../shared/utils/registrarEvento";
import { BuscarOpts } from "../../types/BuscarOpts";

interface UnidadeInput {
  nomeFantasia: string;
  razaoSocial: string;
  tipoDocumento: unidade_tipoDocumento;
  documento: string;
  cep: string;
  endereco: string;
  numero?: string;
  bairro: string;
  cidade: string;
  uf: string;
  criado_em?: Date;
  editado_em?: Date;
  ativo?: number;
  copiarEmpresa?: number;
  fkEmpresaId: number;
  idUsuario: number;

  cursos?: {
    idCurso: number;
    ativo: 0 | 1;
    origem?: "EMPRESA" | "UNIDADE";
  }[];

  medidas?: {
    idMedida: number;
    ativo: 0 | 1;
    origem?: "EMPRESA" | "UNIDADE";
  }[];
}

export const buscarUnidade = {
  async execute(id: number) {
    return await prisma.unidade.findUnique({
      where: { idUnidade: id },
    });
  },
};

export const buscarUnidadesEmpresa = {
  async execute(idEmpresa: number, opts: BuscarOpts = {}) {
    // 1) Busca unidades da empresa
    const unidades = await prisma.unidade.findMany({
      where: { fkEmpresaId: idEmpresa },
      select: {
        idUnidade: true,
        nomeFantasia: true,
        razaoSocial: true,
        tipoDocumento: true,
        documento: true,
        cep: true,
        endereco: true,
        numero: true,
        bairro: true,
        cidade: true,
        uf: true,
        ativo: true,
        fkEmpresaId: true,
      },
    });

    const unidadeIds = unidades.map(u => u.idUnidade);

    // early return se não quiser cursos/medidas
    if ((!opts.includeCursos && !opts.includeMedidas) || unidadeIds.length === 0) {
      return unidades;
    }

    // CURSOS -----------------------------------------------------------------
    let cursosPorUnidade: Record<number, Map<number, any>> = {};
    if (opts.includeCursos) {
      const acessosUnidade = await prisma.cursoacesso.findMany({
        where: { fkUnidadeId: { in: unidadeIds } },
        include: {
          curso: { select: { idCurso: true, titulo: true, ativo: true } },
        },
      });

      const acessosEmpresa = await prisma.cursoacesso.findMany({
        where: { fkEmpresaId: idEmpresa },
        include: {
          curso: { select: { idCurso: true, titulo: true, ativo: true } },
        },
      });

      cursosPorUnidade = {};
      for (const u of unidadeIds) {
        cursosPorUnidade[u] = new Map();
        for (const a of acessosEmpresa) {
          cursosPorUnidade[u].set(a.curso.idCurso, {
            idCursoAcesso: a.idCursoAcesso,
            idCurso: a.curso.idCurso,
            titulo: a.curso.titulo,
            ativo: a.curso.ativo as 0 | 1,
            origem: "EMPRESA" as const,
          });
        }
      }

      for (const a of acessosUnidade) {
        const uId = a.fkUnidadeId!;
        cursosPorUnidade[uId].set(a.curso.idCurso, {
          idCursoAcesso: a.idCursoAcesso,
          idCurso: a.curso.idCurso,
          titulo: a.curso.titulo,
          ativo: a.curso.ativo as 0 | 1,
          origem: "UNIDADE" as const,
        });
      }
    }

    // MEDIDAS ----------------------------------------------------------------
    let medidasPorUnidade: Record<number, Map<number, any>> = {};
    if (opts.includeMedidas) {
      const acessosMedidasUnidade = await prisma.medidavinculo.findMany({
        where: { fkUnidadeId: { in: unidadeIds } },
        include: {
          medida: { select: { idMedida: true, nome: true, tipo: true, ativo: true } },
        },
      });

      const acessosMedidasEmpresa = await prisma.medidavinculo.findMany({
        where: { fkEmpresaId: idEmpresa },
        include: {
          medida: { select: { idMedida: true, nome: true, tipo: true, ativo: true } },
        },
      });

      medidasPorUnidade = {};
      for (const u of unidadeIds) {
        medidasPorUnidade[u] = new Map();
        for (const a of acessosMedidasEmpresa) {
          medidasPorUnidade[u].set(a.medida.idMedida, {
            idMedidaVinculo: a.idMedidaVinculo,
            idMedida: a.medida.idMedida,
            nome: a.medida.nome,
            tipo: a.medida.tipo,
            ativo: a.medida.ativo as 0 | 1,
            origem: "EMPRESA" as const,
          });
        }
      }

      for (const a of acessosMedidasUnidade) {
        const uId = a.fkUnidadeId!;
        medidasPorUnidade[uId].set(a.medida.idMedida, {
          idMedidaVinculo: a.idMedidaVinculo,
          idMedida: a.medida.idMedida,
          nome: a.medida.nome,
          tipo: a.medida.tipo,
          ativo: a.medida.ativo as 0 | 1,
          origem: "UNIDADE" as const,
        });
      }
    }

    // 5) Retorna unidades com campos agregados
    const resultado = unidades.map(u => ({
      ...u,
      ...(opts.includeCursos && {
        cursos: Array.from(cursosPorUnidade[u.idUnidade].values())
          .sort((a, b) => (a.origem === b.origem ? a.titulo.localeCompare(b.titulo) : a.origem === "UNIDADE" ? -1 : 1)),
      }),
      ...(opts.includeMedidas && {
        medidas: Array.from(medidasPorUnidade[u.idUnidade]?.values() ?? [])
          .sort((a, b) => (a.origem === b.origem ? a.nome.localeCompare(b.nome) : a.origem === "UNIDADE" ? -1 : 1)),
      }),
    }));

    return resultado;
  },
};

export const criarUnidade = {
  async execute(data: UnidadeInput) {
    const {
      idUsuario,
      cursos = [],
      medidas = [],
      ...dadosUnidade
    } = data;

    return await prisma.$transaction(async (tx) => {
      const unidade = await tx.unidade.create({
        data: {
          nomeFantasia: dadosUnidade.nomeFantasia,
          razaoSocial: dadosUnidade.razaoSocial,
          tipoDocumento: dadosUnidade.tipoDocumento as unidade_tipoDocumento,
          documento: dadosUnidade.documento,
          cep: dadosUnidade.cep,
          endereco: dadosUnidade.endereco,
          numero: dadosUnidade.numero,
          bairro: dadosUnidade.bairro,
          cidade: dadosUnidade.cidade,
          uf: dadosUnidade.uf,
          criado_em: new Date(),
          editado_em: new Date(),
          ativo: dadosUnidade.ativo,
          copiarEmpresa: dadosUnidade.copiarEmpresa,
          fkEmpresaId: dadosUnidade.fkEmpresaId,
        },
      });

      // Vínculo de cursos
      if (cursos.length > 0) {
        const acessosUnidade = cursos.map((curso) => ({
          fkCursoId: curso.idCurso,
          fkUnidadeId: unidade.idUnidade,
        }));

        await tx.cursoacesso.createMany({
          data: acessosUnidade,
          skipDuplicates: true,
        });
      }

      // Vínculo de medidas
      if (medidas.length > 0) {
        const medidasVinc = medidas.map((m) => ({
          fkMedidaId: m.idMedida,
          fkUnidadeId: unidade.idUnidade,
        }));

        await tx.medidavinculo.createMany({
          data: medidasVinc,
          skipDuplicates: true,
        });
      }

      await registrarEvento({
        idUsuario,
        tipo: "criar",
        entidade: "unidade",
        entidadeId: unidade.idUnidade,
        descricao: `Unidade: ${unidade.nomeFantasia} criada com sucesso!`,
        dadosDepois: unidade,
      });

      return unidade;
    });
  },
};

export const editarUnidade = {
  async execute(id: number, data: UnidadeInput) {
    const { idUsuario, cursos = [], medidas = [], ...dadosUnidade } = data;

    return await prisma.$transaction(async (tx) => {
      const unidadeAntes = await tx.unidade.findUnique({
        where: { idUnidade: id },
      });

      const unidade = await tx.unidade.update({
        where: { idUnidade: id },
        data: {
          nomeFantasia: dadosUnidade.nomeFantasia,
          razaoSocial: dadosUnidade.razaoSocial,
          tipoDocumento: dadosUnidade.tipoDocumento as unidade_tipoDocumento,
          documento: dadosUnidade.documento,
          cep: dadosUnidade.cep,
          endereco: dadosUnidade.endereco,
          numero: dadosUnidade.numero,
          bairro: dadosUnidade.bairro,
          cidade: dadosUnidade.cidade,
          uf: dadosUnidade.uf,
          editado_em: new Date(),
          ativo: dadosUnidade.ativo,
          copiarEmpresa: dadosUnidade.copiarEmpresa,
          fkEmpresaId: dadosUnidade.fkEmpresaId,
        },
      });

      // Atualiza os vínculos de cursos
      await tx.cursoacesso.deleteMany({
        where: { fkUnidadeId: unidade.idUnidade },
      });

      if (cursos.length > 0) {
        const acessosUnidade = cursos.map((curso) => ({
          fkCursoId: curso.idCurso,
          fkUnidadeId: unidade.idUnidade,
        }));

        await tx.cursoacesso.createMany({
          data: acessosUnidade,
          skipDuplicates: true,
        });
      }

      // Atualiza os vínculos de medidas
      await tx.medidavinculo.deleteMany({
        where: { fkUnidadeId: unidade.idUnidade },
      });

      if (medidas.length > 0) {
        const medidasVinc = medidas.map((m) => ({
          fkMedidaId: m.idMedida,
          fkUnidadeId: unidade.idUnidade,
        }));

        await tx.medidavinculo.createMany({
          data: medidasVinc,
          skipDuplicates: true,
        });
      }

      await registrarEvento({
        idUsuario,
        tipo: "editar",
        entidade: "unidade",
        entidadeId: unidade.idUnidade,
        descricao: `Unidade: ${unidade.nomeFantasia} editada com sucesso!`,
        dadosAntes: unidadeAntes,
        dadosDepois: unidade,
      });

      return unidade;
    });
  },
};