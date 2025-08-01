import { prisma } from "../../config/prisma-client";
import { registrarEvento } from "../../shared/utils/registrarEvento";

interface CargoInput {
  nome: string;
  descricao: string;
  ativo?: number;
  fkSetorId: number;
  idUsuario: number;
}

export const buscarCargo = {
  async execute(id: number) {
    return await prisma.cargo.findUnique({
      where: { idCargo: id },
      include: {
        funcionarios: {
          select: {
            idUsuario: true,
            nome: true,
            email: true,
            ativo: true
          }
        },
      }
    });
  },
};

export const buscarCargosSetor = {
  async execute(idSetor: number) {
    return await prisma.cargo.findMany({
      where: { fkSetorId: idSetor },
      include: {
        funcionarios: true,
      }
    });
  },
};

export const criarCargo = {
  async execute(data: CargoInput) {
    try {
      const { idUsuario, ...dadosCargo } = data;

      const cargo = await prisma.cargo.create({
        data: {
          ...dadosCargo,
          criado_em: new Date(),
          editado_em: new Date(),
        },
      });

      await registrarEvento({
        idUsuario,
        tipo: "criar",
        entidade: "cargo",
        entidadeId: cargo.idCargo,
        descricao: `Cargo: ${cargo.nome} criado com sucesso!`,
        dadosDepois: cargo,
      });

      return cargo;
    } catch (e: any) {
      await registrarEvento({
        idUsuario: data.idUsuario,
        tipo: "erro",
        entidade: "cargo",
        descricao: `Erro ao criar cargo: ${e.message}`,
      });
      throw new Error("Erro ao criar cargo: " + e.message);
    }
  },
};

export const editarCargo = {
  async execute(id: number, data: CargoInput) {
    try {
      const { idUsuario, ...dadosCargo } = data;

      const antes = await prisma.cargo.findUnique({ where: { idCargo: id } });

      const cargo = await prisma.cargo.update({
        where: { idCargo: id },
        data: {
          ...dadosCargo,
          editado_em: new Date(),
        },
      });

      await registrarEvento({
        idUsuario,
        tipo: "editar",
        entidade: "cargo",
        entidadeId: cargo.idCargo,
        descricao: `Cargo: ${cargo.nome} editado com sucesso!`,
        dadosAntes: antes,
        dadosDepois: cargo,
      });

      return cargo;
    } catch (e: any) {
      await registrarEvento({
        idUsuario: data.idUsuario,
        tipo: "erro",
        entidade: "cargo",
        entidadeId: id,
        descricao: `Erro ao editar cargo: ${e.message}`,
      });
      throw new Error("Erro ao editar cargo: " + e.message);
    }
  },
};

export const buscarFuncionariosDoCargo = {
  async execute(idCargo: number) {
    const funcionarios = await prisma.usuario.findMany({
      where: { fkCargoId: idCargo },
      include: {
        usuariorole: {
          include: {
            role: {
              include: {
                rolepermissao: {
                  include: {
                    permissao: true,
                  },
                },
              },
            },
          },
        },
        usuarioHorario: true,
      },
    });

    const diasSemana = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

    return funcionarios.map((f) => {
      const roles = f.usuariorole.map((ur) => ({
        idRole: ur.role.idRole,
        nome: ur.role.nome,
      }));

      const permissoes = Array.from(
        new Set(
          f.usuariorole.flatMap((ur) =>
            ur.role.rolepermissao.map((rp) => rp.permissao.nome)
          )
        )
      );

      const usuarioHorario = f.usuarioHorario.map((h) => ({
        diaSemana: h.diaSemana,
        diaSemanaNome: diasSemana[h.diaSemana],
        horarioInicio: h.horarioInicio,
        horarioFim: h.horarioFim,
      }));

      return {
        idUsuario: f.idUsuario,
        nome: f.nome,
        email: f.email,
        ativo: f.ativo,
        fkEmpresaId: f.fkEmpresaId,
        fkResponsavelTecnicoId: f.fkResponsavelTecnicoId,
        fkCargoId: f.fkCargoId,
        firebaseId: f.firebaseId,
        criado_em: f.criado_em,
        editado_em: f.editado_em,
        roles,
        permissoes,
        usuarioHorario,
      };
    });
  },
};