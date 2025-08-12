import { apiFetch } from "./apiFetch";
import type { Medida, MedidaCurso, MedidaFiltro, MedidaVinculo, MedidaVinculoPayload, Paginado } from "../types/EstruturaMedida";

const base = "/medida";

export async function getMedidas(filtro: MedidaFiltro = {}): Promise<Paginado<Medida>> {
  const params = new URLSearchParams();
  if (filtro.busca) params.set("busca", filtro.busca);
  if (filtro.tipo) params.set("tipo", String(filtro.tipo));
  if (filtro.ativo !== undefined && filtro.ativo !== "") params.set("ativo", String(filtro.ativo));
  params.set("page", String(filtro.page ?? 1));

  return apiFetch<Paginado<Medida>>(`${base}?${params.toString()}`);
}

export async function getMedida(id: number): Promise<Medida> {
  return apiFetch<Medida>(`${base}/${id}`);
}

export async function createMedida(payload: Omit<Medida, "idMedida">): Promise<Medida> {
  return apiFetch<Medida>(base, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateMedida(id: number, payload: Partial<Medida>): Promise<Medida> {
  return apiFetch<Medida>(`${base}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteMedida(id: number): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`${base}/${id}`, { method: "DELETE" });
}

export async function toggleStatusMedida(id: number, ativo: 0 | 1): Promise<Medida> {
  return apiFetch<Medida>(`${base}/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ ativo }),
  });
}

export async function getMedidaVinculos(idMedida: number): Promise<MedidaVinculo[]> {
  return apiFetch<MedidaVinculo[]>(`${base}/${idMedida}/vinculos`);
}

export async function createMedidaVinculo(payload: MedidaVinculoPayload): Promise<MedidaVinculo> {
  return apiFetch<MedidaVinculo>(`${base}/${payload.fkMedidaId}/vinculo`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteMedidaVinculo(idVinculo: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`${base}/vinculo/${idVinculo}`, { method: "DELETE" });
}

// --- Vínculo medida x curso ---
export async function getMedidaCursos(idMedida: number): Promise<MedidaCurso[]> {
  return apiFetch<MedidaCurso[]>(`${base}/${idMedida}/cursos`);
}

export async function addMedidaCurso(idMedida: number, fkCursoId: number, validade?: number): Promise<MedidaCurso> {
  return apiFetch<MedidaCurso>(`${base}/${idMedida}/cursos`, {
    method: "POST",
    body: JSON.stringify({ fkCursoId, ...(validade != null ? { validade } : {}) }),
  });
}

export async function removeMedidaCurso(idMedida: number, fkCursoId: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`${base}/${idMedida}/cursos/${fkCursoId}`, {
    method: "DELETE",
  });
}