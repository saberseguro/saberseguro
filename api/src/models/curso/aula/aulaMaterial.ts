import { registrarEvento } from "../../../shared/utils/registrarEvento";
import { prisma } from '../../../config/prisma-client';
import { materialcomplementar_tipo } from "@prisma/client";

export const listarAulaMaterial = {
  async execute(idAula: number) {
    return await prisma.materialcomplementar.findMany({
      where: { fkAulaId: idAula },
      orderBy: { idMaterialComplementar: 'asc' },
    });
  },
};

export const criarAulaMaterial = {
  async execute(idAula: number, data: any, usuario: any) {
    const { titulo, tipo, material, ativo } = data;

    const criado = await prisma.materialcomplementar.create({
      data: {
        titulo,
        tipo: tipo as materialcomplementar_tipo,
        material,
        ativo: ativo ?? 1,
        fkAulaId: idAula,
      },
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: "criar",
      entidade: "materialComplementar",
      entidadeId: criado.idMaterialComplementar,
      descricao: `Material "${titulo}" adicionado à aula ${idAula}`,
      dadosDepois: criado,
    });

    return criado;
  },
};

export const editarAulaMaterial = {
  async execute(id: number, data: any, usuario: any) {
    const antes = await prisma.materialcomplementar.findUnique({ where: { idMaterialComplementar: id } });
    if (!antes) throw new Error('Nenhum material encontrado com esse ID');

    const atualizado = await prisma.materialcomplementar.update({ where: { idMaterialComplementar: id }, data });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'editar',
      entidade: 'materialComplementar',
      entidadeId: id,
      descricao: `Material "${atualizado.titulo}" atualizado.`,
      dadosAntes: antes,
      dadosDepois: atualizado,
    });

    return atualizado;
  },
};

export const excluirAulaMaterial = {
  async execute(id: number, usuario: any) {
    const antes = await prisma.materialcomplementar.findUnique({ where: { idMaterialComplementar: id } });
    if (!antes) throw new Error('Nenhum material encontrado com esse ID');

    await prisma.materialcomplementar.delete({ where: { idMaterialComplementar: id } });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'excluir',
      entidade: 'materialComplementar',
      entidadeId: id,
      descricao: `Material "${antes?.titulo}" removido.`,
      dadosAntes: antes,
    });
  },
};
