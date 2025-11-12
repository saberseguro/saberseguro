import type { Avaliacao } from "../types/EstruturaCurso";
import { apiFetch } from "./apiFetch";

export async function getAvaliacaoPorId(idAvaliacao: number): Promise<Avaliacao> {
  return await apiFetch(`/avaliacao/${idAvaliacao}`);
}

export async function salvarAvaliacao(avaliacao: Partial<Avaliacao>): Promise<Avaliacao> {
  return await apiFetch(`/avaliacao`, {
    method: "POST",
    body: avaliacao as any,
  });
}

export async function editarAvaliacao(idAvaliacao: number, avaliacao: Partial<Avaliacao>): Promise<Avaliacao> {
  return await apiFetch(`/avaliacao/${idAvaliacao}`, {
    method: "PUT",
    body: avaliacao as any,
  });
}