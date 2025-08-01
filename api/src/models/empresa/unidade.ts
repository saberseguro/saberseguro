import { unidade_tipoDocumento } from "@prisma/client";
import { prisma } from "../../config/prisma-client";
import { registrarEvento } from "../../shared/utils/registrarEvento";

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
  idUsuario: number; // novo
}

export const buscarUnidade = {
  async execute(id: number) {
    return await prisma.unidade.findUnique({
      where: { idUnidade: id },
    });
  },
};

export const buscarUnidadesEmpresa = {
  async execute(id: number) {
    return await prisma.unidade.findMany({
      where: { fkEmpresaId: id },
    });
  },
};

export const criarUnidade = {
  async execute(data: UnidadeInput) {
    try {
      const { idUsuario, ...dadosUnidade } = data;

      const unidade = await prisma.unidade.create({
        data: {
          nomeFantasia: dadosUnidade.nomeFantasia,
          razaoSocial: dadosUnidade.razaoSocial,
          tipoDocumento: data.tipoDocumento as unidade_tipoDocumento,
          documento: dadosUnidade.documento,
          cep: dadosUnidade.cep,
          endereco: dadosUnidade.endereco,
          numero: dadosUnidade.numero,
          bairro: dadosUnidade.bairro,
          cidade: dadosUnidade.cidade,
          uf: dadosUnidade.uf,
          criado_em: dadosUnidade.criado_em,
          editado_em: dadosUnidade.editado_em,
          ativo: dadosUnidade.ativo,
          copiarEmpresa: dadosUnidade.copiarEmpresa,
          fkEmpresaId: dadosUnidade.fkEmpresaId
        }
      });

      await registrarEvento({
        idUsuario: idUsuario,
        tipo: "criar",
        entidade: "unidade",
        entidadeId: unidade.idUnidade,
        descricao: `Unidade: ${unidade.nomeFantasia} criada com sucesso!`,
        dadosDepois: unidade
      });

      return unidade;
    } catch (e: any) {
      await registrarEvento({
        idUsuario: data.idUsuario,
        tipo: "erro",
        entidade: "unidade",
        descricao: `Erro ao criar unidade: ${e.message}`,
      });
      throw new Error("Erro ao criar unidade: " + e.message);
    }
  },
};

export const editarUnidade = {
  async execute(id: number, data: UnidadeInput) {
    try {
      const { idUsuario, ...dadosUnidade } = data;
      
      const unidadeAntes = await prisma.unidade.findUnique({
        where: { idUnidade: id },
      });

      const unidade = await prisma.unidade.update({
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
          fkEmpresaId: dadosUnidade.fkEmpresaId
        },
      });

      await registrarEvento({
        idUsuario: idUsuario,
        tipo: "editar",
        entidade: "unidade",
        entidadeId: unidade.idUnidade,
        descricao: `Unidade: ${unidade.nomeFantasia} editada com sucesso!`,
        dadosAntes: unidadeAntes,
        dadosDepois: unidade
      });

      return unidade;
    } catch (e: any) {
      await registrarEvento({
        idUsuario: data.idUsuario,
        tipo: "erro",
        entidade: "unidade",
        entidadeId: id,
        descricao: `Erro ao editar unidade: ${e.message}`,
      });
      throw new Error("Erro ao editar unidade: " + e.message);
    }
  },
};
