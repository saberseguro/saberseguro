import { responsaveltecnico_tipoDocumento } from '@prisma/client';
import { prisma } from '../../config/prisma-client';
import { registrarEvento } from '../../shared/utils/registrarEvento';

export const buscarResponsaveisTecnicos = {
  async execute() {
    return await prisma.responsaveltecnico.findMany({
      include: {
        cursos: true,
      }
    });
  }
}

export const buscarResponsavelTecnico = {
  async execute(id: number) {
    return await prisma.responsaveltecnico.findUnique({
      where: { idResponsavelTecnico: id },
      include: {
        cursos: true,
      }
    });
  }
};

export const criarResponsavelTecnico = {
  async execute(data: any, usuario: any) {
    const responsavel = await prisma.responsaveltecnico.create({
      data: {
        nome: data.nome,
        tipoDocumento: data.tipoDocumento as responsaveltecnico_tipoDocumento,
        documento: data.documento,
        registro: data.registro,
        funcao: data.funcao,
        telefone: data.telefone,
        criado_em: new Date(),
        editado_em: new Date(),
        ativo: data.ativo
      }
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'criar',
      entidade: 'responsaveltecnico',
      entidadeId: responsavel.idResponsavelTecnico,
      descricao: `Responsável Técnico "${responsavel.nome}" criado.`,
      dadosDepois: responsavel
    });

    return responsavel;
  }
};

export const editarResponsavelTecnico = {
  async execute(id: number, data: any, usuario: any) {
    const antes = await prisma.responsaveltecnico.findUnique({ where: { idResponsavelTecnico: id } });

    if (!antes) {
      throw new Error(`Nenhum responsável técnico encontrado!`);
    }

    const responsavelAtualizado = await prisma.responsaveltecnico.update({
      where: { idResponsavelTecnico: id },
      data: {
        nome: data.nome,
        tipoDocumento: data.tipoDocumento as responsaveltecnico_tipoDocumento,
        documento: data.documento,
        registro: data.registro,
        funcao: data.funcao,
        telefone: data.telefone,
        criado_em: new Date(),
        editado_em: new Date(),
        ativo: data.ativo
      }
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'editar',
      entidade: 'responsaveltecnico',
      entidadeId: id,
      descricao: `Responsável Técnico "${antes?.nome}" atualizado.`,
      dadosAntes: antes,
      dadosDepois: responsavelAtualizado
    });

    return responsavelAtualizado;
  }
};

export const excluirResponsavelTecnico = {
  async execute(id: number, usuario: any) {
    const responsavel = await prisma.responsaveltecnico.findUnique({ where: { idResponsavelTecnico: id } });

    if (!responsavel) {
      throw new Error(`Nenhum responsável técnico encontrado!`);
    }

    await prisma.responsaveltecnico.delete({ where: { idResponsavelTecnico: id } });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'excluir',
      entidade: 'responsaveltecnico',
      entidadeId: id,
      descricao: `Responsável Técnico "${responsavel?.nome}" excluído.`,
      dadosAntes: responsavel
    });
  }
};