import { responsaveltecnico_tipoDocumento } from '@prisma/client';
import { prisma } from '../../config/prisma-client';
import { registrarEvento } from '../../shared/utils/registrarEvento';
import { criarUsuario, editarUsuario } from '../usuario';

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
    return await prisma.$transaction(async (tx) => {
      // === 1. Cria o responsável técnico ===
      const responsavel = await tx.responsaveltecnico.create({
        data: {
          nome: data.nome,
          tipoDocumento: data.tipoDocumento as responsaveltecnico_tipoDocumento,
          documento: data.documento,
          registro: data.registro,
          funcao: data.funcao,
          telefone: data.telefone,
          assinatura: data.assinatura,
          criado_em: new Date(),
          editado_em: new Date(),
          ativo: data.ativo ?? 1,
        },
      });

      // === 2. Busca role padrão ===
      const role = await tx.role.findFirst({
        where: { nome: "responsavelTecnico" },
      });

      // === 3. Cria usuário vinculado ===
      const novoUsuario = await criarUsuario({
        nome: responsavel.nome,
        cpf: responsavel.documento,
        email: data.email,
        senha: data.senha || "trocar123",
        ativo: responsavel.ativo,
        fkResponsavelTecnicoId: responsavel.idResponsavelTecnico,
        roles: role ? [role.idRole] : [],
        idUsuario: usuario.idUsuario,
      });

      // === 4. Log ===
      await registrarEvento({
        idUsuario: usuario.idUsuario,
        tipo: "criar",
        entidade: "responsaveltecnico",
        entidadeId: responsavel.idResponsavelTecnico,
        descricao: `Responsável Técnico "${responsavel.nome}" criado com usuário vinculado (${novoUsuario.email}).`,
        dadosDepois: { responsavel, usuario: novoUsuario },
      });

      return { responsavel, usuario: novoUsuario };
    });
  },
};

export const editarResponsavelTecnico = {
  async execute(id: number, data: any, usuario: any) {
    return await prisma.$transaction(async (tx) => {
      const antes = await tx.responsaveltecnico.findUnique({
        where: { idResponsavelTecnico: id },
      });

      if (!antes) throw new Error("Nenhum responsável técnico encontrado!");

      // === 1. Atualiza o responsável ===
      const responsavelAtualizado = await tx.responsaveltecnico.update({
        where: { idResponsavelTecnico: id },
        data: {
          nome: data.nome,
          tipoDocumento: data.tipoDocumento as responsaveltecnico_tipoDocumento,
          documento: data.documento,
          registro: data.registro,
          funcao: data.funcao,
          telefone: data.telefone,
          assinatura: data.assinatura,
          editado_em: new Date(),
          ativo: data.ativo ?? 1,
        },
      });

      // === 3. Log ===
      await registrarEvento({
        idUsuario: usuario.idUsuario,
        tipo: "editar",
        entidade: "responsaveltecnico",
        entidadeId: id,
        descricao: `Responsável Técnico "${antes.nome}" atualizado.`,
        dadosAntes: antes,
        dadosDepois: responsavelAtualizado,
      });

      return responsavelAtualizado;
    });
  },
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