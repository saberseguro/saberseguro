import type { Curso, Categoria } from '../types/EstruturaCurso';
import { apiFetch } from './apiFetch';

interface Filtros {
  categoria?: string | null;
  ativo?: string | null;
}

interface GetCursosParams {
  page?: number;
  busca?: string;
  filtros?: Filtros;
}

interface GetCursosResponse {
  data: Curso[];
  totalPaginas: number;
}

export async function getCursos({ page = 1, busca = "", filtros = {} }: GetCursosParams) {
  const params = new URLSearchParams({
    page: String(page),
    busca,
    categoria: filtros.categoria || "",
    ativo: filtros.ativo || "",
  });

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