import type { Pergunta } from "../types/EstruturaCurso";
import { apiFetch } from "./apiFetch";

export async function getPergunta(idPergunta: number): Promise<Pergunta> {
  return await apiFetch(`/avaliacao/pergunta/${idPergunta}`);
}

export async function criarPergunta(idAvaliacao: number, pergunta: any): Promise<Pergunta> {
  return await apiFetch(`/avaliacao/${idAvaliacao}/pergunta`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pergunta),
  });
}

export async function editarPergunta(idPergunta: number, pergunta: any): Promise<Pergunta> {
  return await apiFetch(`/avaliacao/${idPergunta}/pergunta`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pergunta),
  });
}

export async function excluirPergunta(idPergunta: number): Promise<Pergunta> {
  return await apiFetch(`/avaliacao/${idPergunta}/pergunta`, {
    method: "DELETE",
  });
}