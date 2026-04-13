import ExcelJS from "exceljs";
import { prisma } from "../../config/prisma-client";

interface Params {
  formato: string;
  filtros: {
    fkEmpresaId?: number;
    fkUnidadeId?: number;
    fkSetorId?: number;
    fkCargoId?: number;
    fkFuncionarioId?: number;
    ativo?: number;
  };
  usuario?: any;
}

export const gerarRelatorioFuncionariosExcel = {
  async execute({ formato, filtros }: Params) {
    if (formato !== "xlsx") {
      throw new Error("Formato inválido para listagem de funcionários.");
    }

    if (!filtros?.fkEmpresaId) {
      throw new Error("fkEmpresaId é obrigatório.");
    }

    const funcionarios = await prisma.usuario.findMany({
      where: {
        fkEmpresaId: filtros.fkEmpresaId,
        ativo: 1,
        ...(filtros.fkFuncionarioId ? { idUsuario: filtros.fkFuncionarioId } : {}),
        ...(filtros.fkCargoId ? { fkCargoId: filtros.fkCargoId } : {}),
        ...(filtros.ativo !== undefined ? { ativo: filtros.ativo } : {}),
        ...(filtros.fkSetorId || filtros.fkUnidadeId
          ? {
              cargo: {
                ...(filtros.fkSetorId ? { fkSetorId: filtros.fkSetorId } : {}),
                ...(filtros.fkUnidadeId
                  ? {
                      setor: {
                        fkUnidadeId: filtros.fkUnidadeId,
                      },
                    }
                  : {}),
              },
            }
          : {}),
      },
      include: {
        cargo: {
          include: {
            setor: {
              include: {
                unidade: true,
              },
            },
          },
        },
      },
      orderBy: {
        nome: "asc",
      },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Funcionários");

    worksheet.columns = [
      { header: "ID", key: "idUsuario", width: 10 },
      { header: "Nome", key: "nome", width: 30 },
      { header: "CPF", key: "cpf", width: 18 },
      { header: "Telefone", key: "telefone", width: 20 },
      { header: "Email", key: "email", width: 30 },
      { header: "Status", key: "status", width: 12 },
      { header: "Unidade", key: "unidade", width: 25 },
      { header: "Setor", key: "setor", width: 25 },
      { header: "Cargo", key: "cargo", width: 25 },
      { header: "Criado em", key: "criadoEm", width: 20 },
    ];

    funcionarios.forEach((f) => {
      worksheet.addRow({
        idUsuario: f.idUsuario,
        nome: f.nome,
        cpf: f.cpf || "",
        telefone: f.telefone || "",
        email: f.email || "",
        status: Number(f.ativo) === 1 ? "Ativo" : "Inativo",
        unidade: f.cargo?.setor?.unidade?.nomeFantasia || "",
        setor: f.cargo?.setor?.nome || "",
        cargo: f.cargo?.nome || "",
        criadoEm: f.criado_em
          ? new Date(f.criado_em).toLocaleDateString("pt-BR")
          : "",
      });
    });

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();

    return {
      buffer,
      fileName: `funcionarios_${new Date().toISOString().slice(0, 10)}.xlsx`,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  },
};