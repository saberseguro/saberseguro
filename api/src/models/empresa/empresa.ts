import { empresa_tipoDocumento } from "@prisma/client";
import { prisma } from "../../config/prisma-client";
import { registrarEvento } from "../../shared/utils/registrarEvento";
import { format } from "date-fns";

interface EmpresaInput {
  nomeFantasia: string;
  razaoSocial: string;
  tipoDocumento: empresa_tipoDocumento;
  documento: string;
  cep: string;
  endereco: string;
  numero?: string;
  bairro: string;
  cidade: string;
  uf: string;
  logoUrl?: string;
  criado_em?: Date;
  editado_em?: Date;
  ativo?: number;
  idUsuario: number;

  cursos?: { idCurso: number; ativo?: 0 | 1 }[];
  medidas?: { idMedida: number; ativo?: 0 | 1 }[];
}

// Filtro usado para isolar os vínculos (curso/medida) que pertencem
// diretamente à empresa, e não a uma unidade/setor/cargo/usuário dela.
const escopoDiretoEmpresa = (idEmpresa: number) => ({
  fkEmpresaId: idEmpresa,
  fkUnidadeId: null,
  fkSetorId: null,
  fkCargoId: null,
  fkUsuarioId: null,
});

export const buscarEmpresa = {
  async execute(id: number) {
    const empresa = await prisma.empresa.findUnique({
      where: { idEmpresa: id },
      include: {
        funcionarios: true,
      }
    });

    if (!empresa) return null;

    const [acessosCursos, acessosMedidas] = await Promise.all([
      prisma.cursoacesso.findMany({
        where: escopoDiretoEmpresa(id),
        include: { curso: { select: { idCurso: true, titulo: true, ativo: true } } },
      }),
      prisma.medidavinculo.findMany({
        where: escopoDiretoEmpresa(id),
        include: { medida: { select: { idMedida: true, nome: true, tipo: true, ativo: true } } },
      }),
    ]);

    return {
      ...empresa,
      cursos: acessosCursos.map((a) => ({
        idCursoAcesso: a.idCursoAcesso,
        idCurso: a.curso.idCurso,
        titulo: a.curso.titulo,
        ativo: a.curso.ativo as 0 | 1,
        origem: "EMPRESA" as const,
      })),
      medidas: acessosMedidas.map((a) => ({
        idMedidaVinculo: a.idMedidaVinculo,
        idMedida: a.medida.idMedida,
        nome: a.medida.nome,
        tipo: a.medida.tipo,
        ativo: a.medida.ativo as 0 | 1,
        origem: "EMPRESA" as const,
      })),
    };
  },
};

export const buscarEmpresas = {
  async execute(termo: string) {
    return await prisma.empresa.findMany({
      where: {
        OR: [
          { nomeFantasia: { contains: termo } },
          { razaoSocial: { contains: termo } }
        ]
      },
      include: {
        funcionarios: true,
      },
      take: 10
    });
  }
};

export const listarEmpresas = {
  async execute() {
    const data = await prisma.empresa.findMany({
      orderBy: { nomeFantasia: 'asc' },
    });
    return data;
  },
};

export const criarEmpresa = {
  async execute(data: EmpresaInput) {
    const { idUsuario, cursos = [], medidas = [], ...dadosEmpresa } = data;

    try {
      const empresa = await prisma.$transaction(async (tx) => {
        const novaEmpresa = await tx.empresa.create({
          data: {
            ...dadosEmpresa,
            tipoDocumento: dadosEmpresa.tipoDocumento as empresa_tipoDocumento,
          },
        });

        if (cursos.length > 0) {
          await tx.cursoacesso.createMany({
            data: cursos.map((c) => ({
              fkCursoId: c.idCurso,
              fkEmpresaId: novaEmpresa.idEmpresa,
            })),
            skipDuplicates: true,
          });
        }

        if (medidas.length > 0) {
          await tx.medidavinculo.createMany({
            data: medidas.map((m) => ({
              fkMedidaId: m.idMedida,
              fkEmpresaId: novaEmpresa.idEmpresa,
            })),
            skipDuplicates: true,
          });
        }

        return novaEmpresa;
      });

      await registrarEvento({
        idUsuario: idUsuario,
        tipo: "criar",
        entidade: "empresa",
        entidadeId: empresa.idEmpresa,
        descricao: `Empresa: ${empresa.razaoSocial} criada com sucesso!`,
        dadosDepois: empresa,
      });

      return empresa;
    } catch (e: any) {
      await registrarEvento({
        idUsuario: data.idUsuario,
        tipo: "erro",
        entidade: "empresa",
        descricao: `Erro ao criar empresa: ${e.message}`,
      });
      throw new Error("Erro ao criar empresa: " + e.message);
    }
  },
};

export const editarEmpresa = {
  async execute(id: number, data: EmpresaInput) {
    const { idUsuario, cursos = [], medidas = [], ...dadosEmpresa } = data;

    try {
      const { empresaAntes, empresaAtualizada } = await prisma.$transaction(async (tx) => {
        const empresaAntes = await tx.empresa.findUnique({
          where: { idEmpresa: id },
        });

        const empresaAtualizada = await tx.empresa.update({
          where: { idEmpresa: id },
          data: {
            ...dadosEmpresa,
            tipoDocumento: dadosEmpresa.tipoDocumento as empresa_tipoDocumento,
            editado_em: new Date(),
          },
        });

        // Atualiza os vínculos de cursos diretos da empresa
        await tx.cursoacesso.deleteMany({
          where: escopoDiretoEmpresa(id),
        });

        if (cursos.length > 0) {
          await tx.cursoacesso.createMany({
            data: cursos.map((c) => ({
              fkCursoId: c.idCurso,
              fkEmpresaId: id,
            })),
            skipDuplicates: true,
          });
        }

        // Atualiza os vínculos de medidas diretos da empresa
        await tx.medidavinculo.deleteMany({
          where: escopoDiretoEmpresa(id),
        });

        if (medidas.length > 0) {
          await tx.medidavinculo.createMany({
            data: medidas.map((m) => ({
              fkMedidaId: m.idMedida,
              fkEmpresaId: id,
            })),
            skipDuplicates: true,
          });
        }

        return { empresaAntes, empresaAtualizada };
      });

      await registrarEvento({
        idUsuario: idUsuario,
        tipo: "editar",
        entidade: "empresa",
        entidadeId: empresaAtualizada.idEmpresa,
        descricao: `Empresa: ${empresaAtualizada.razaoSocial} editada com sucesso!`,
        dadosAntes: empresaAntes,
        dadosDepois: empresaAtualizada,
      });

      return empresaAtualizada;
    } catch (e: any) {
      await registrarEvento({
        idUsuario: data.idUsuario,
        tipo: "erro",
        entidade: "empresa",
        entidadeId: id,
        descricao: `Erro ao editar empresa: ${e.message}`,
      });
      throw new Error("Erro ao editar empresa: " + e.message);
    }
  },
};

export const getResumoCertificadoEmpresa = {
  async execute(fkEmpresaId: number) {
    const competencia = format(new Date(), "MM/yyyy");

    const registro = await prisma.certificadoempresa.findFirst({
      where: { fkEmpresaId, competencia },
    });

    const totalGerados = registro?.totalGerados ?? 0;
    const limiteMensal = registro?.limiteMensal ?? null;

    return {
      competencia,
      totalGerados,
      limiteMensal,
      restante: limiteMensal ? Math.max(limiteMensal - totalGerados, 0) : null,
    };
  },
};
