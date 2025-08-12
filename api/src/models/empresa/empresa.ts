import { empresa_tipoDocumento } from "@prisma/client";
import { prisma } from "../../config/prisma-client";
import { registrarEvento } from "../../shared/utils/registrarEvento";

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
}

export const buscarEmpresa = {
  async execute(id: number) {
    return await prisma.empresa.findUnique({
      where: { idEmpresa: id },
      include: {
        funcionarios: true,
      }
    });
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
  async execute(query: any) {
    const page = Number(query.page) || 1;
    const take = Math.min(Math.max(Number(query.take) || 20, 1), 100);
    const skip = (page - 1) * take;

    const [data, total] = await Promise.all([
      prisma.empresa.findMany({
        where: {},
        orderBy: { nomeFantasia: 'asc' },
        skip,
        take,
      }),
      prisma.empresa.count({ where: {} }),
    ]);

    return { data, total, page, take };
  },
};

export const criarEmpresa = {
  async execute(data: EmpresaInput) {
    try {

      const { idUsuario, ...dadosEmpresa } = data;

      const empresa = await prisma.empresa.create({
        data: {
          ...dadosEmpresa,
          tipoDocumento: dadosEmpresa.tipoDocumento as empresa_tipoDocumento,
        },
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
    try {
      const { idUsuario, ...dadosEmpresa } = data;

      const empresaAntes = await prisma.empresa.findUnique({
        where: { idEmpresa: id },
      });

      const empresa = await prisma.empresa.update({
        where: { idEmpresa: id },
        data: {
          ...dadosEmpresa,
          tipoDocumento: dadosEmpresa.tipoDocumento as empresa_tipoDocumento,
          editado_em: new Date(),
        },
      });

      await registrarEvento({
        idUsuario: idUsuario,
        tipo: "editar",
        entidade: "empresa",
        entidadeId: empresa.idEmpresa,
        descricao: `Empresa: ${empresa.razaoSocial} editada com sucesso!`,
        dadosAntes: empresaAntes,
        dadosDepois: empresa,
      });

      return empresa;
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