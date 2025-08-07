import { prisma } from '../../config/prisma-client';
import { registrarEvento } from '../../shared/utils/registrarEvento';

export const buscarCategorias = {
  async execute() {
    return await prisma.categoria.findMany({
      orderBy: { idCategoria: 'asc' }
    });
  }
};

export const buscarCategoria = {
  async execute(id: number) {
    return await prisma.categoria.findUnique({
      where: { idCategoria: id }
    });
  }
};

export const criarCategoria = {
  async execute(data: any, usuario: any) {
    const categoria = await prisma.categoria.create({
      data: {
        nome: data.nome,
        descricao: data.descricao
      }
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'criar',
      entidade: 'categoria',
      entidadeId: categoria.idCategoria,
      descricao: `Categoria "${categoria.nome}" criada.`,
      dadosDepois: categoria
    });

    return categoria;
  }
};

export const editarCategoria = {
  async execute(id: number, data: any, usuario: any) {
    const antes = await prisma.categoria.findUnique({ where: { idCategoria: id } });
    if (!antes) throw new Error('Nenhuma categoria encontrada com esse ID');

    const atualizada = await prisma.categoria.update({
      where: { idCategoria: id },
      data: {
        nome: data.nome,
        descricao: data.descricao
      }
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'editar',
      entidade: 'categoria',
      entidadeId: id,
      descricao: `Categoria "${antes.nome}" atualizada.`,
      dadosAntes: antes,
      dadosDepois: atualizada
    });

    return atualizada;
  }
};

export const excluirCategoria = {
  async execute(id: number, usuario: any) {
    const antes = await prisma.categoria.findUnique({ where: { idCategoria: id } });
    if (!antes) throw new Error('Nenhuma categoria encontrada com esse ID');

    await prisma.categoria.delete({ where: { idCategoria: id } });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: 'excluir',
      entidade: 'categoria',
      entidadeId: id,
      descricao: `Categoria "${antes.nome}" excluída.`,
      dadosAntes: antes
    });
  }
};
