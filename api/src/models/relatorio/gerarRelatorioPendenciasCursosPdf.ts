import puppeteer from "puppeteer";
import { prisma } from "../../config/prisma-client";

interface Params {
  formato: string;
  filtros: {
    fkEmpresaId?: number;
    fkUnidadeId?: number;
    fkSetorId?: number;
    fkCargoId?: number;
    fkFuncionarioId?: number;
    fkCursoId?: number;
    ativo?: number;
    somentePendentes?: boolean;
  };
  usuario?: any;
}

interface FuncionarioRelatorio {
  idUsuario: number;
  nome: string;
  email: string | null;
  cpf: string | null;
  ativo: number;
  fkCargoId: number | null;
  cargo?: {
    idCargo: number;
    nome: string;
    fkSetorId: number;
    setor?: {
      idSetor: number;
      nome: string;
      fkUnidadeId: number;
      unidade?: {
        idUnidade: number;
        nomeFantasia: string;
      };
    };
  } | null;
}

interface CursoAplicavel {
  idCurso: number;
  titulo: string;
  prazo: number | null;
}

interface ItemRelatorioPendencia {
  funcionarioId: number;
  funcionarioNome: string;
  cursoId: number;
  cursoNome: string;
  percentualConclusao: number;
  status: "Não iniciado" | "Em andamento" | "Concluído";
  nivelPendencia: number;
  unidade: string;
  setor: string;
  cargo: string;
  prazoLimite: string;
  dataConclusao: string;
}

function definirStatus(percentual: number, concluido?: boolean): "Não iniciado" | "Em andamento" | "Concluído" {
  if (concluido || percentual >= 100) return "Concluído";
  if (percentual <= 0) return "Não iniciado";
  return "Em andamento";
}

function calcularNivelPendencia(percentual: number, concluido?: boolean): number {
  if (concluido || percentual >= 100) return 3;
  if (percentual <= 0) return 1;
  return 2;
}

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

function escapeHtml(text: any) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getPrioridadeLabel(nivel: number) {
  switch (nivel) {
    case 1:
      return "Alta";
    case 2:
      return "Média";
    default:
      return "Baixa";
  }
}

function gerarHtmlRelatorioPendencias(
  itens: ItemRelatorioPendencia[],
  filtros: Params["filtros"]
) {
  const total = itens.length;
  const naoIniciados = itens.filter((i) => i.status === "Não iniciado").length;
  const emAndamento = itens.filter((i) => i.status === "Em andamento").length;
  const concluidos = itens.filter((i) => i.status === "Concluído").length;

  const percentualMedio = total
    ? Math.round(
      itens.reduce((acc, item) => acc + item.percentualConclusao, 0) / total
    )
    : 0;

  const getStatusClass = (status: ItemRelatorioPendencia["status"]) => {
    if (status === "Concluído") return "status-concluido";
    if (status === "Em andamento") return "status-andamento";
    return "status-nao-iniciado";
  };

  const getPercentualClass = (percentual: number) => {
    if (percentual >= 100) return "percentual-concluido";
    if (percentual > 0) return "percentual-andamento";
    return "percentual-nao-iniciado";
  };

  const linhas = itens
    .map((item, index) => {
      return `
        <tr>
          <td class="col-index">${index + 1}</td>
          <td>
            <div class="funcionario-nome">${escapeHtml(item.funcionarioNome)}</div>
          </td>
          <td>${escapeHtml(item.unidade)}</td>
          <td>${escapeHtml(item.setor)}</td>
          <td>${escapeHtml(item.cargo)}</td>
          <td>
            <div class="curso-nome">${escapeHtml(item.cursoNome)}</div>
          </td>
          <td>
            <span class="status-badge ${getStatusClass(item.status)}">
              ${escapeHtml(item.status)}
            </span>
          </td>
          <td style="text-align:center;">
            <div class="percentual-wrap">
              <div class="progress-bar">
                <div 
                  class="progress-fill ${getPercentualClass(item.percentualConclusao)}" 
                  style="width: ${item.percentualConclusao}%;">
                </div>
              </div>
              <span class="percentual-text">${item.percentualConclusao}%</span>
            </div>
          </td>
          <td style="text-align:center;">
            ${escapeHtml(item.dataConclusao || "-")}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Relatório de Pendências de Cursos</title>
        <style>
          * {
            box-sizing: border-box;
          }

          body {
            font-family: Arial, Helvetica, sans-serif;
            color: #1f2937;
            font-size: 11px;
            margin: 0;
            padding: 24px;
            background: #ffffff;
          }

          .page {
            width: 100%;
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

          .header-left {
            flex: 1;
          }

          .title {
            font-size: 24px;
            font-weight: bold;
            color: #111827;
            margin-bottom: 6px;
          }

          .subtitle {
            color: #6b7280;
            font-size: 11px;
          }

          .header-right {
            text-align: right;
            min-width: 180px;
          }

          .header-tag {
            display: inline-block;
            background: #eff6ff;
            color: #1d4ed8;
            border: 1px solid #bfdbfe;
            padding: 6px 10px;
            border-radius: 999px;
            font-size: 10px;
            font-weight: bold;
            margin-bottom: 8px;
          }

          .filters-box {
            margin: 16px 0 22px 0;
            padding: 12px 14px;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            background: #f9fafb;
          }

          .filters-title {
            font-size: 11px;
            font-weight: bold;
            color: #374151;
            margin-bottom: 8px;
          }

          .filters-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px 14px;
          }

          .filter-item {
            font-size: 10px;
            color: #4b5563;
          }

          .filter-label {
            font-weight: bold;
            color: #111827;
          }

          .cards {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin: 0 0 22px 0;
          }

          .card {
            border-radius: 14px;
            padding: 14px 16px;
            border: 1px solid #e5e7eb;
            background: #ffffff;
          }

          .card-total {
            background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
          }

          .card-nao-iniciado {
            background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
          }

          .card-andamento {
            background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
          }

          .card-concluido {
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          }

          .card-label {
            font-size: 10px;
            color: #6b7280;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
          }

          .card-value {
            font-size: 24px;
            font-weight: bold;
            color: #111827;
            line-height: 1;
            margin-bottom: 6px;
          }

          .card-extra {
            font-size: 10px;
            color: #4b5563;
          }

          .section-title {
            font-size: 13px;
            font-weight: bold;
            color: #111827;
            margin-bottom: 10px;
          }

          .table-wrap {
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            overflow: hidden;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          thead th {
            background: #ced4da;
            color: #343a40;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            padding: 10px 8px;
            border-right: 1px solid rgba(255,255,255,0.1);
          }

          thead th:last-child {
            border-right: none;
          }

          tbody tr:nth-child(even) {
            background: #f9fafb;
          }

          tbody tr:hover {
            background: #f3f4f6;
          }

          td {
            padding: 10px 8px;
            border-top: 1px solid #e5e7eb;
            vertical-align: middle;
            color: #374151;
            word-wrap: break-word;
          }

          .col-index {
            text-align: center;
            font-weight: bold;
            color: #6b7280;
            width: 34px;
          }

          .funcionario-nome {
            font-weight: bold;
            color: #111827;
          }

          .curso-nome {
            font-weight: 600;
            color: #1f2937;
          }

          .status-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 999px;
            font-size: 10px;
            font-weight: bold;
            text-align: center;
            white-space: nowrap;
          }

          .status-nao-iniciado {
            background: #fee2e2;
            color: #b91c1c;
          }

          .status-andamento {
            background: #fef3c7;
            color: #b45309;
          }

          .status-concluido {
            background: #dcfce7;
            color: #15803d;
          }

          .percentual-wrap {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
          }

          .progress-bar {
            width: 90px;
            height: 8px;
            background: #e5e7eb;
            border-radius: 999px;
            overflow: hidden;
          }

          .progress-fill {
            height: 100%;
            border-radius: 999px;
          }

          .percentual-nao-iniciado {
            background: #ef4444;
          }

          .percentual-andamento {
            background: #f59e0b;
          }

          .percentual-concluido {
            background: #22c55e;
          }

          .percentual-text {
            font-size: 10px;
            font-weight: bold;
            color: #374151;
          }

          .empty-state {
            text-align: center;
            padding: 28px 16px;
            color: #6b7280;
            font-size: 12px;
          }

          .footer {
            margin-top: 16px;
            padding-top: 12px;
            border-top: 1px solid #e5e7eb;
            font-size: 10px;
            color: #6b7280;
            display: flex;
            justify-content: space-between;
            gap: 12px;
          }

          .footer strong {
            color: #374151;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <div class="header-left">
              <div class="title">Relatório de Pendências de Cursos</div>
              <div class="subtitle">
                Acompanhamento do progresso dos funcionários nos cursos vinculados
              </div>
            </div>

            <div class="header-right">
              <div class="header-tag">Relatório Gerencial</div>
              <div class="subtitle">Gerado em ${new Date().toLocaleString("pt-BR")}</div>
            </div>
          </div>

          <div class="cards">
            <div class="card card-total">
              <div class="card-label">Total de registros</div>
              <div class="card-value">${total}</div>
              <div class="card-extra">Cursos vinculados encontrados</div>
            </div>

            <div class="card card-nao-iniciado">
              <div class="card-label">Não iniciados</div>
              <div class="card-value">${naoIniciados}</div>
              <div class="card-extra">Maior prioridade</div>
            </div>

            <div class="card card-andamento">
              <div class="card-label">Em andamento</div>
              <div class="card-value">${emAndamento}</div>
              <div class="card-extra">Cursos em progresso</div>
            </div>

            <div class="card card-concluido">
              <div class="card-label">Concluídos</div>
              <div class="card-value">${concluidos}</div>
              <div class="card-extra">Média geral: ${percentualMedio}%</div>
            </div>
          </div>

          <div class="section-title">Lista de pendências e progresso</div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style="width: 34px;">#</th>
                  <th>Funcionário</th>
                  <th>Unidade</th>
                  <th>Setor</th>
                  <th>Cargo</th>
                  <th>Curso</th>
                  <th style="width: 110px;">Status</th>
                  <th style="width: 110px; text-align:center;">Progresso</th>
                  <th style="width: 90px; text-align:center;">Conclusão</th>
                </tr>
              </thead>
              <tbody>
                ${linhas ||
    `
                    <tr>
                      <td colspan="9" class="empty-state">
                        Nenhum registro encontrado para os filtros informados.
                      </td>
                    </tr>
                  `
    }
              </tbody>
            </table>
          </div>
        </div>
      </body>
    </html>
  `;
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

export const gerarRelatorioPendenciasCursosPdf = {
  async execute({ formato, filtros }: Params) {
    if (formato !== "pdf") {
      throw new Error("Formato inválido para relatório de pendências.");
    }

    if (!filtros?.fkEmpresaId) {
      throw new Error("fkEmpresaId é obrigatório.");
    }

    const funcionarios = await prisma.usuario.findMany({
      where: {
        fkEmpresaId: filtros.fkEmpresaId,
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

    if (!funcionarios.length) {
      const html = gerarHtmlRelatorioPendencias([], filtros);
      const buffer = await gerarPdf(html);

      return {
        buffer,
        fileName: `pendencias_cursos_${new Date().toISOString().slice(0, 10)}.pdf`,
        mimeType: "application/pdf",
      };
    }

    const funcionariosIds = funcionarios.map((f) => f.idUsuario);
    const cargosIds = [...new Set(funcionarios.map((f) => f.fkCargoId).filter(Boolean))] as number[];
    const setoresIds = [
      ...new Set(
        funcionarios
          .map((f) => f.cargo?.setor?.idSetor)
          .filter(Boolean)
      ),
    ] as number[];
    const unidadesIds = [
      ...new Set(
        funcionarios
          .map((f) => f.cargo?.setor?.unidade?.idUnidade)
          .filter(Boolean)
      ),
    ] as number[];

    /**
     * Busca todos os vínculos de curso que podem se aplicar aos funcionários filtrados.
     * Aqui está a parte mais importante do relatório.
     */
    const acessosEscopo = await prisma.cursoacesso.findMany({
      where: {
        ...(filtros.fkCursoId ? { fkCursoId: filtros.fkCursoId } : {}),
        OR: [
          { fkUsuarioId: { in: funcionariosIds } },
          ...(cargosIds.length ? [{ fkCargoId: { in: cargosIds } }] : []),
          ...(setoresIds.length ? [{ fkSetorId: { in: setoresIds } }] : []),
          ...(unidadesIds.length ? [{ fkUnidadeId: { in: unidadesIds } }] : []),
          { fkEmpresaId: filtros.fkEmpresaId },
        ],
      },
      include: {
        curso: {
          select: {
            idCurso: true,
            titulo: true,
            ativo: true,
            prazo: true,
          },
        },
      },
    });

    /**
     * Busca progresso específico por usuário+curso.
     * Esse é o dado que realmente representa o andamento individual.
     */
    const progressosUsuario = await prisma.cursoacesso.findMany({
      where: {
        fkUsuarioId: { in: funcionariosIds },
        ...(filtros.fkCursoId ? { fkCursoId: filtros.fkCursoId } : {}),
      },
      select: {
        fkCursoId: true,
        fkUsuarioId: true,
        percentual: true,
        concluido: true,
        prazoLimite: true,
        dataConclusao: true,
      },
    });

    const progressoMap = new Map<
      string,
      {
        percentual: number;
        concluido: boolean;
        prazoLimite: Date | null;
        dataConclusao: Date | null;
      }
    >();

    for (const progresso of progressosUsuario) {
      if (!progresso.fkUsuarioId) continue;

      progressoMap.set(`${progresso.fkUsuarioId}_${progresso.fkCursoId}`, {
        percentual: normalizarPercentual(progresso.percentual),
        concluido: Number(progresso.concluido) === 1,
        prazoLimite: progresso.prazoLimite ?? null,
        dataConclusao: progresso.dataConclusao ?? null,
      });
    }

    /**
     * Descobre os cursos aplicáveis por funcionário.
     */
    const itensMap = new Map<string, ItemRelatorioPendencia>();

    for (const funcionario of funcionarios as FuncionarioRelatorio[]) {
      const unidadeId = funcionario.cargo?.setor?.unidade?.idUnidade ?? null;
      const setorId = funcionario.cargo?.setor?.idSetor ?? null;
      const cargoId = funcionario.fkCargoId ?? null;

      const acessosDoFuncionario = acessosEscopo.filter((acesso) => {
        const cursoAtivo = Number(acesso.curso?.ativo) === 1;
        if (!cursoAtivo) return false;

        const porUsuario = acesso.fkUsuarioId && acesso.fkUsuarioId === funcionario.idUsuario;
        const porCargo = acesso.fkCargoId && cargoId && acesso.fkCargoId === cargoId;
        const porSetor = acesso.fkSetorId && setorId && acesso.fkSetorId === setorId;
        const porUnidade = acesso.fkUnidadeId && unidadeId && acesso.fkUnidadeId === unidadeId;
        const porEmpresa = acesso.fkEmpresaId && acesso.fkEmpresaId === filtros.fkEmpresaId;

        return Boolean(porUsuario || porCargo || porSetor || porUnidade || porEmpresa);
      });

      /**
       * Remove cursos duplicados por funcionário.
       */
      const cursosUnicos = new Map<number, CursoAplicavel>();

      for (const acesso of acessosDoFuncionario) {
        if (!acesso.curso) continue;
        cursosUnicos.set(acesso.curso.idCurso, {
          idCurso: acesso.curso.idCurso,
          titulo: acesso.curso.titulo,
          prazo: acesso.curso.prazo ?? null,
        });
      }

      for (const curso of cursosUnicos.values()) {
        const chaveProgresso = `${funcionario.idUsuario}_${curso.idCurso}`;
        const progresso = progressoMap.get(chaveProgresso);

        const percentualConclusao = progresso?.percentual ?? 0;
        const concluido = progresso?.concluido ?? false;
        const status = definirStatus(percentualConclusao, concluido);
        const nivelPendencia = calcularNivelPendencia(percentualConclusao, concluido);

        const chaveItem = `${funcionario.idUsuario}_${curso.idCurso}`;

        itensMap.set(chaveItem, {
          funcionarioId: funcionario.idUsuario,
          funcionarioNome: funcionario.nome || "",
          cursoId: curso.idCurso,
          cursoNome: curso.titulo || "",
          percentualConclusao,
          status,
          nivelPendencia,
          unidade: funcionario.cargo?.setor?.unidade?.nomeFantasia || "",
          setor: funcionario.cargo?.setor?.nome || "",
          cargo: funcionario.cargo?.nome || "",
          prazoLimite: formatarData(progresso?.prazoLimite ?? null),
          dataConclusao: formatarData(progresso?.dataConclusao ?? null),
        });
      }
    }

    let itens = Array.from(itensMap.values());

    if (filtros.somentePendentes) {
      itens = itens.filter((item) => item.percentualConclusao < 100 && item.status !== "Concluído");
    }

    itens.sort((a, b) => {
      if (a.nivelPendencia !== b.nivelPendencia) {
        return a.nivelPendencia - b.nivelPendencia;
      }

      if (a.percentualConclusao !== b.percentualConclusao) {
        return a.percentualConclusao - b.percentualConclusao;
      }

      if (a.funcionarioNome !== b.funcionarioNome) {
        return a.funcionarioNome.localeCompare(b.funcionarioNome, "pt-BR");
      }

      return a.cursoNome.localeCompare(b.cursoNome, "pt-BR");
    });

    const html = gerarHtmlRelatorioPendencias(itens, filtros);
    const buffer = await gerarPdf(html);

    return {
      buffer,
      fileName: `pendencias_cursos_${new Date().toISOString().slice(0, 10)}.pdf`,
      mimeType: "application/pdf",
    };
  },
};