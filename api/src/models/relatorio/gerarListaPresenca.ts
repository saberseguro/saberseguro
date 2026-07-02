import puppeteer from "puppeteer";
import { prisma } from "../../config/prisma-client";
import { formatarCpf } from "../../auxiliares/formatter";

interface Params {
  formato: string;
  filtros: {
    fkEmpresaId?: number;
    fkUnidadeId?: number;
    fkSetorId?: number;
    fkCargoId?: number;
    fkFuncionarioId?: number;
    fkCursoId?: number;
    dataInicio?: string;
    dataFim?: string;
    somentePendentes?: boolean;
    ativo?: number;
  };
  usuario?: any;
}

interface ItemListaPresenca {
  funcionarioNome: string;
  cpf: string;
  unidade: string;
  setor: string;
  cargo: string;
  cursoNome: string;
  dataInicio: string;
  dataConclusao: string;
  horarioConclusao: string;
  percentualConclusao: number;
  status: string;
};

function normalizarPercentual(valor: unknown): number {
  const numero = Number(valor ?? 0);

  if (!Number.isFinite(numero)) return 0;
  if (numero < 0) return 0;
  if (numero > 100) return 100;

  return Math.round(numero);
}

function formatarData(data?: Date | string | null) {
  if (!data) return "";
  return new Date(data).toLocaleDateString("pt-BR");
}

function formatarHora(data?: Date | string | null) {
  if (!data) return "";
  return new Date(data).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(text: any) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function gerarPdf(html: string) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: {
        top: "5mm",
        right: "8mm",
        bottom: "10mm",
        left: "8mm",
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

function gerarHtmlListaPresenca(itens: ItemListaPresenca[]) {
  const dataGeracao = new Date();

  return `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Lista de Presença</title>
    <style>
      * {
        box-sizing: border-box;
        font-family: Arial, sans-serif;
      }

      body {
        margin: 0;
        color: #111827;
        font-size: 11px;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 20px;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 2px solid #e5e7eb;
      }

      .title {
        font-size: 24px;
        font-weight: bold;
        color: #111827;
        margin-bottom: 6px;
      }

      .subtitle {
        font-size: 11px;
        color: #6b7280;
      }

      .header-right {
        text-align: right;
        min-width: 180px;
      }

      .tag {
        display: inline-block;
        background: #eff6ff;
        color: #2563eb;
        border: 1px solid #bfdbfe;
        border-radius: 999px;
        padding: 5px 12px;
        font-size: 10px;
        font-weight: bold;
        margin-bottom: 10px;
      }

      .generated {
        font-size: 10px;
        color: #6b7280;
      }

      .section-title {
        font-size: 13px;
        font-weight: bold;
        margin-bottom: 10px;
        color: #111827;
      }

      .table-wrap {
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        overflow: hidden;
      }

      .table {
        width: 100%;
        border-collapse: collapse;
      }

      .table thead th {
        background: #d1d5db;
        color: #374151;
        padding: 9px 8px;
        font-size: 9px;
        font-weight: bold;
        text-align: center;
        text-transform: uppercase;
      }

      .table thead th:last-child {
        border-right: none;
      }

      .table tbody td {
        padding: 8px;
        border-bottom: 1px solid #e5e7eb;
        font-size: 10px;
        vertical-align: middle;
        text-align: center;
      }

      .table tbody td:last-child {
        border-right: none;
      }

      .table tbody tr:nth-child(even) {
        background: #f9fafb;
      }

      .table tbody tr:last-child td {
        border-bottom: none;
      }

      .text-center {
        text-align: center;
      }

      .funcionario {
        font-weight: bold;
        color: #111827;
        line-height: 1.15;
      }

      .curso {
        font-weight: bold;
        color: #111827;
        line-height: 1.15;
      }

      .badge-success {
        display: inline-block;
        background: #dcfce7;
        color: #15803d;
        border-radius: 999px;
        padding: 4px 10px;
        font-weight: bold;
        font-size: 9px;
        white-space: nowrap;
      }

      .progress-cell {
        min-width: 85px;
      }

      .progress-bg {
        width: 100%;
        height: 7px;
        background: #e5e7eb;
        border-radius: 999px;
        overflow: hidden;
        margin-bottom: 4px;
      }

      .progress-bar {
        height: 100%;
        background: #22c55e;
        border-radius: 999px;
      }

      .progress-text {
        font-size: 9px;
        font-weight: bold;
        text-align: center;
        color: #374151;
      }

      .empty {
        border: 1px solid #d1d5db;
        padding: 20px;
        text-align: center;
        color: #6b7280;
        border-radius: 8px;
      }

      .footer {
        margin-top: 12px;
        font-size: 9px;
        color: #6b7280;
        border-top: 1px solid #e5e7eb;
        padding-top: 6px;
      }
    </style>
  </head>

  <body>
    <div class="header">
      <div>
        <div class="title">Lista de Presença - Cursos Online</div>
        <div class="subtitle">
          Relação de alunos que concluíram cursos online com registro de data e horário
        </div>
      </div>

      <div class="header-right">
        <div class="tag">Relatório Gerencial</div>
        <div class="generated">
          Gerado em ${formatarData(dataGeracao)}, ${formatarHora(dataGeracao)}
        </div>
      </div>
    </div>

    ${itens.length
      ? `
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th style="width: 4%;">#</th>
                  <th style="width: 17%;">Funcionário</th>
                  <th style="width: 10%;">CPF</th>
                  <th style="width: 12%;">Unidade</th>
                  <th style="width: 10%;">Setor</th>
                  <th style="width: 10%;">Cargo</th>
                  <th style="width: 15%;">Curso</th>
                  <th style="width: 9%;">Status</th>
                  <th style="width: 5%;">Conclusão</th>
                </tr>
              </thead>

              <tbody>
                ${itens
        .map(
          (item, index) => `
                      <tr>
                        <td class="text-center">${index + 1}</td>

                        <td>
                          <div class="funcionario">${escapeHtml(item.funcionarioNome)}</div>
                        </td>

                        <td class="text-center">${escapeHtml(formatarCpf(item.cpf))}</td>

                        <td>${escapeHtml(item.unidade)}</td>

                        <td>${escapeHtml(item.setor)}</td>

                        <td>${escapeHtml(item.cargo)}</td>

                        <td>
                          <div class="curso">${escapeHtml(item.cursoNome)}</div>
                        </td>

                        <td class="text-center">
                          <span class="badge-success">Concluído</span>
                        </td>

                        <td class="text-center">
                          ${escapeHtml(item.dataConclusao)}
                          <br />
                          <small>${escapeHtml(item.horarioConclusao)}</small>
                        </td>
                      </tr>
                    `
        )
        .join("")}
              </tbody>
            </table>
          </div>
        `
      : `<div class="empty">Nenhuma presença encontrada para os filtros selecionados.</div>`
    }

    <div class="footer">
      Esta lista representa os alunos que concluíram cursos online com registro de data e horário.
    </div>
  </body>
  </html>
`;
}

export const gerarRelatorioListaPresencaCursosPdf = {
  async execute({ formato, filtros }: Params) {
    if (formato !== "pdf") {
      throw new Error("Formato inválido para lista de presença.");
    }

    if (!filtros?.fkEmpresaId) {
      throw new Error("fkEmpresaId é obrigatório.");
    }

    const dataInicio = filtros.dataInicio ? new Date(`${filtros.dataInicio}T00:00:00`) : null;
    const dataFim = filtros.dataFim ? new Date(`${filtros.dataFim}T23:59:59`) : null;

    const progressos = await prisma.cursoacesso.findMany({
      where: {
        fkUsuarioId: {
          not: null,
        },
        concluido: 1,
        dataConclusao: {
          not: null,
          ...(dataInicio ? { gte: dataInicio } : {}),
          ...(dataFim ? { lte: dataFim } : {}),
        },
        ...(filtros.fkCursoId ? { fkCursoId: filtros.fkCursoId } : {}),
        usuario: {
          fkEmpresaId: filtros.fkEmpresaId,
          ...(filtros.fkFuncionarioId ? { idUsuario: filtros.fkFuncionarioId } : {}),
          ...(filtros.fkCargoId ? { fkCargoId: filtros.fkCargoId } : {}),
          ...(filtros.ativo !== undefined ? { ativo: filtros.ativo } : { ativo: 1 }),
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
        curso: {
          ativo: 1,
        },
      },
      include: {
        usuario: {
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
        },
        curso: {
          select: {
            idCurso: true,
            titulo: true,
            ativo: true,
          },
        },
      },
      orderBy: [
        {
          dataConclusao: "desc",
        },
      ],
    });

    const itens: ItemListaPresenca[] = progressos.map((progresso: any) => {
      const funcionario = progresso.usuario;
      const cargo = funcionario?.cargo;
      const setor = cargo?.setor;
      const unidade = setor?.unidade;

      return {
        funcionarioNome: funcionario?.nome || "",
        cpf: funcionario?.cpf || funcionario?.documento || "",
        unidade: unidade?.nomeFantasia || unidade?.razaoSocial || "",
        setor: setor?.nome || "",
        cargo: cargo?.nome || "",
        cursoNome: progresso.curso?.titulo || "",
        dataInicio: formatarData(progresso.dataInicio),
        dataConclusao: formatarData(progresso.dataConclusao),
        horarioConclusao: formatarHora(progresso.dataConclusao),
        percentualConclusao: normalizarPercentual(progresso.percentual),
        status: "Concluído",
      };
    });

    itens.sort((a, b) => {
      const curso = a.cursoNome.localeCompare(b.cursoNome, "pt-BR");
      if (curso !== 0) return curso;

      const unidade = a.unidade.localeCompare(b.unidade, "pt-BR");
      if (unidade !== 0) return unidade;

      const setor = a.setor.localeCompare(b.setor, "pt-BR");
      if (setor !== 0) return setor;

      const cargo = a.cargo.localeCompare(b.cargo, "pt-BR");
      if (cargo !== 0) return cargo;

      const dataHoraA = progressos.find(
        (p: any) =>
          p.usuario?.nome === a.funcionarioNome &&
          p.curso?.titulo === a.cursoNome
      )?.dataConclusao;

      const dataHoraB = progressos.find(
        (p: any) =>
          p.usuario?.nome === b.funcionarioNome &&
          p.curso?.titulo === b.cursoNome
      )?.dataConclusao;

      const timeA = dataHoraA ? new Date(dataHoraA).getTime() : 0;
      const timeB = dataHoraB ? new Date(dataHoraB).getTime() : 0;

      return timeA - timeB;
    });

    const html = gerarHtmlListaPresenca(itens);
    const buffer = await gerarPdf(html);

    return {
      buffer,
      fileName: `lista_presenca_cursos_${new Date().toISOString().slice(0, 10)}.pdf`,
      mimeType: "application/pdf",
    };
  },
};