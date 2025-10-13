import { apiFetch } from './apiFetch';
import type { Curso, Categoria, CursoCompleto, CertificadoDados, ResponsavelTecnico, Certificado, CertificadoPreview } from '../types/EstruturaCurso';
import type { MedidaCurso } from "../types/EstruturaMedida";

interface Filtros {
  categoria?: string | null;
  ativo?: string | null;
  fkEmpresaId?: number | string | null;
  includeGlobais?: boolean | null;
}

interface GetCursosParams {
  page?: number;
  busca?: string;
  filtros?: Filtros;
  lean?: boolean;
}

interface GetCursosResponse {
  data: Curso[];
  totalPaginas: number;
}

export async function getCursos({ page = 1, busca = "", filtros = {}, lean = false }: GetCursosParams) {
  const params = new URLSearchParams({
    page: String(page),
    busca,
    categoria: filtros.categoria || "",
    ativo: filtros.ativo || "",
  });

  if (filtros.fkEmpresaId) params.set("fkEmpresaId", String(filtros.fkEmpresaId));
  if (filtros.includeGlobais) params.set("includeGlobais", "1");
  if (lean) params.set("lean", "1");

  const res = await apiFetch(`/curso?${params.toString()}`);
  return res as GetCursosResponse;
}

export const getCursoCompleto = async (id: number): Promise<CursoCompleto> => {
  return await apiFetch(`/curso/${id}`);
};

export const getCategorias = async (): Promise<Categoria[]> => {
  const res = await apiFetch("/categoria");
  return res as Categoria[];
};

export const createCategoria = async (data: Partial<Categoria>): Promise<Categoria> => {
  const res = await apiFetch("/categoria", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res as Categoria;
};

export const updateCategoria = async (id: number, data: Partial<Categoria>): Promise<Categoria> => {
  const res = await apiFetch(`/categoria/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res as Categoria;
};

export const getResponsaveisTecnicos = async (): Promise<ResponsavelTecnico[]> => {
  const res = await apiFetch("/responsaveltecnico");
  return res as ResponsavelTecnico[];
}

export const createResponsavelTecnico = async (data: Partial<ResponsavelTecnico>): Promise<ResponsavelTecnico> => {
  const res = await apiFetch("/responsaveltecnico", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res as ResponsavelTecnico;
};

export const updateResponsavelTecnico = async (id: number, data: Partial<ResponsavelTecnico>): Promise<ResponsavelTecnico> => {
  const res = await apiFetch(`/responsaveltecnico/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res as ResponsavelTecnico;
};

export async function syncCurso(curso: Curso): Promise<Curso> {
  const isNovo = !curso.idCurso || curso.idCurso <= 0;
  const url = isNovo ? "/curso/sync" : `/curso/${curso.idCurso}/sync`;
  const method = isNovo ? "POST" : "PUT";

  const categoriasIds = Array.isArray((curso as any).categorias)
    ? (curso as any).categorias.map((c: any) => c.idCategoria ?? c.fkCategoriaId ?? c.id)
    : [];

  const payload = { ...curso, categorias: categoriasIds };

  return apiFetch<Curso>(url, {
    method,
    body: JSON.stringify(payload),
  });
}

export async function getMeusCursos(): Promise<Curso[]> {
  return apiFetch("/curso/meus");
}

export async function getCursoMedidas(idCurso: number): Promise<MedidaCurso[]> {
  return apiFetch<MedidaCurso[]>(`/curso/${idCurso}/medidas`);
}

export async function addCursoMedida(idCurso: number, fkMedidaId: number, validade?: number): Promise<MedidaCurso> {
  return apiFetch<MedidaCurso>(`/curso/${idCurso}/medidas`, {
    method: "POST",
    body: JSON.stringify({ fkMedidaId, ...(validade != null ? { validade } : {}) }),
  });
}

export async function removeCursoMedida(idCurso: number, fkMedidaId: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/curso/${idCurso}/medidas/${fkMedidaId}`, {
    method: "DELETE",
  });
}

export async function iniciarCurso(idCurso: number): Promise<{ sucesso: boolean }> {
  return apiFetch("/curso/aulausuario/curso/iniciar", {
    method: "POST",
    body: JSON.stringify({ idCurso }),
  });
}

interface RegistrarStepParams {
  fkAulaId: number;
  idReferencia: number;
  tipo: "video" | "avaliacao";
  progressoVideo?: number;
}

export async function registrarStepAula(params: RegistrarStepParams): Promise<{ sucesso: boolean }> {
  return apiFetch("/curso/aulausuario/step", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function registrarStepCurso(params: {
  idCurso: number,
  idReferencia: number;
  tipo: "avaliacao";
  progressoVideo?: number;
}): Promise<{ sucesso: boolean }> {
  return apiFetch("/curso/aulausuario/usuariostep", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function verificarConclusaoModulo(idModulo: number): Promise<{ sucesso: boolean }> {
  return apiFetch("/curso/aulausuario/modulo/verificar-conclusao", {
    method: "POST",
    body: JSON.stringify({ idModulo }),
  });
}

export async function iniciarAvaliacao(idAvaliacao: number): Promise<{ sucesso: boolean }> {
  return apiFetch(`/avaliacao/${idAvaliacao}/iniciar`, {
    method: "POST",
  });
}

export async function enviarAvaliacao(idAvaliacao: number, respostas: any[], duracaoSegundos: number) {
  return apiFetch(`/avaliacao/${idAvaliacao}/responder`, {
    method: "POST",
    body: JSON.stringify({ respostas, duracaoSegundos }),
  });
}

export async function finalizarAvaliacaoBackend(idAvaliacao: number) {
  return apiFetch(`/avaliacao/${idAvaliacao}/finalizar`, { method: "POST" });
}

export type ResultadoAvaliacao = {
  tentativas: {
    idAvaliacaoUsuario: number;
    nota: number;
    dataFim: string;
    resultado: {
      idPergunta: number;
      enunciado: string;
      alternativas: {
        idAlternativa: number;
        texto: string;
        correta: boolean;
        selecionada: boolean;
      }[];
    }[];
  }[];
};

export async function fetchResultadoAvaliacao(idAvaliacao: number): Promise<ResultadoAvaliacao> {
  return apiFetch(`/avaliacao/${idAvaliacao}/resultado`);
}

export async function finalizarCurso(idCurso: number): Promise<{ sucesso: boolean }> {
  return apiFetch("/curso/:id/finalizar", {
    method: "POST",
    body: JSON.stringify({ idCurso }),
  });
}

export async function getCertificadoPreview(idCurso: number): Promise<CertificadoDados> {
  return await apiFetch(`/curso/certificado/preview/${idCurso}`);
}

export async function iniciarCursoAcesso(idCurso: number) {
  return await apiFetch(`/curso/${idCurso}/cursoacesso`, {
    method: "POST",
  });
}

export async function getCertificados(): Promise<Certificado[]> {
  return await apiFetch("/curso/certificado/listar");
}

// Gerar visualização (PDF base64)
export async function previewCertificado(idCurso: number): Promise<CertificadoPreview> {
  return await apiFetch(`/curso/curso/certificado/preview/${idCurso}`);
}

// Gerar certificado definitivo (PDF binário)
export async function gerarCertificado(dados: any) {
  const res = await apiFetch("/curso/certificado/gerar", {
    method: "POST",
    body: JSON.stringify({ dados }),
  });
  return res;
}