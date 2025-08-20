import type { Curso, Categoria } from '../types/EstruturaCurso';
import { apiFetch } from './apiFetch';

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

export const getCursoPorId = async (id: number): Promise<Curso> => {
  return await apiFetch(`/curso/${id}`);
};

export const getCategorias = async (): Promise<Categoria[]> => {
  const res = await apiFetch("/categoria");
  return res as Categoria[];
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