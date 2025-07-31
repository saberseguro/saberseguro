import { prisma } from '../../config/prisma-client';
import { registrarEvento } from '../../shared/utils/registrarEvento';

interface SetorInput {
  nome: string;
  descricao: string;
  ambiente?: string;
  fkUnidadeId: number;
  ativo?: number;
  idUsuario: number;
}

export const buscarsetor = {
  async execute(id: number) {
    return await prisma.setor.findUnique({
      where: { idSetor: id },
    });
  }
};

export const buscarSetoresUnidade = {
  async execute(idUnidade: number) {
    return await prisma.setor.findMany({
      where: { fkUnidadeId: idUnidade },
    });
  }
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
    try {
      const { idUsuario, ...dados } = data;

      const setor = await prisma.setor.create({
        data: {
          ...dados,
        }
      });

      await registrarEvento({
        idUsuario,
        tipo: 'criar',
        entidade: 'setor',
        entidadeId: setor.idSetor,
        descricao: `Setor: ${setor.nome} criado com sucesso!`,
        dadosDepois: setor
      });

      return setor;
    } catch (e: any) {
      await registrarEvento({
        idUsuario: data.idUsuario,
        tipo: 'erro',
        entidade: 'setor',
        descricao: `Erro ao criar setor: ${e.message}`,
      });
      throw new Error("Erro ao criar setor: " + e.message);
    }
  }
};

export const editarSetor = {
  async execute(id: number, data: SetorInput) {
    try {
      const { idUsuario, ...dados } = data;

      const setorAntes = await prisma.setor.findUnique({ where: { idSetor: id } });

      const setor = await prisma.setor.update({
        where: { idSetor: id },
        data: {
          ...dados,
          editado_em: new Date()
        }
      });

      await registrarEvento({
        idUsuario,
        tipo: 'editar',
        entidade: 'setor',
        entidadeId: setor.idSetor,
        descricao: `Setor: ${setor.nome} editado com sucesso!`,
        dadosAntes: setorAntes,
        dadosDepois: setor
      });

      return setor;
    } catch (e: any) {
      await registrarEvento({
        idUsuario: data.idUsuario,
        tipo: 'erro',
        entidade: 'setor',
        entidadeId: id,
        descricao: `Erro ao editar setor: ${e.message}`,
      });
      throw new Error("Erro ao editar setor: " + e.message);
    }
  }
};