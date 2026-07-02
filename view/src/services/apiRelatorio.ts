import { apiFetch, type ApiBlobResponse } from "./apiFetch";
import type {
  PayloadGerarRelatorio,
  OpcaoRelatorio,
} from "../types/Relatorio";

export const opcoesRelatorio: OpcaoRelatorio[] = [
  {
    id: "funcionarios_listagem",
    titulo: "Listagem de Funcionários",
    descricao: "Exporta a listagem de funcionários em Excel com base nos filtros selecionados.",
    formato: "xlsx",
    categoria: "Estrutura",
  },
  {
    id: "pendencias_cursos",
    titulo: "Pendências de Cursos",
    descricao: "Gera um PDF com funcionários que concluíram e que ainda possuem cursos pendentes.",
    formato: "pdf",
    categoria: "Treinamentos",
  },
  {
    id: "lista_presenca_cursos",
    titulo: "Listagem de Presença",
    descricao: "Gera um PDF com listagem de presença.",
    formato: "pdf",
    categoria: "Treinamentos",
  },
];

function baixarBlob(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function getExtensaoPorMimeType(mimeType?: string, fallback?: string) {
  if (fallback) return fallback;

  switch (mimeType) {
    case "application/pdf":
      return "pdf";
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return "xlsx";
    case "text/csv":
      return "csv";
    default:
      return "dat";
  }
}

export const apiRelatorio = {
  listarOpcoes() {
    return opcoesRelatorio;
  },

  async gerar(payload: PayloadGerarRelatorio) {
    const response: ApiBlobResponse = await apiFetch("/relatorios/gerar", {
      method: "POST",
      body: JSON.stringify(payload),
      responseType: "blob",
    });

    const blob = response.data;
    const headers = response.headers || {};

    const mimeType = headers["content-type"] || blob.type || "";
    const disposition = headers["content-disposition"] || "";

    const fileNameMatch = disposition.match(/filename="?([^"]+)"?/i);
    const nomeHeader = fileNameMatch?.[1];

    const extensao = getExtensaoPorMimeType(mimeType, payload.formato);
    const fileName =
      nomeHeader ||
      `${payload.tipo}_${new Date().toISOString().slice(0, 10)}.${extensao}`;

    baixarBlob(blob, fileName);

    return {
      ok: true,
      fileName,
      mimeType,
    };
  },
};