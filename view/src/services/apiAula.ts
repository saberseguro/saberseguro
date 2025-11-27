import type { Aula, AulaStep, AulaVideo, MaterialComplementar } from "../types/EstruturaCurso";
import { apiFetch } from "./apiFetch";

export async function getAulaPorId(idAula: number): Promise<Aula> {
  return await apiFetch(`/curso/aula/${idAula}`);
}

export async function salvarAula(aula: Partial<Aula>): Promise<Aula> {
  return await apiFetch(`/curso/aula`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(aula),
  });
}

export async function editarAula(idAula: number, aula: Partial<Aula>): Promise<Aula> {
  return await apiFetch(`/curso/aula/${idAula}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(aula),
  });
}

export async function getProgressoAula(idAula: number): Promise<{
  assistiuVideo: number;
  baixouMateriais: number;
  respondeuQuiz: number;
  concluida: number;
}> {
  return apiFetch(`/aula/${idAula}/progresso`);
}

export async function getStepUsuarioInfo(idStep: number) {
  return apiFetch(`/step/${idStep}/info`);
}

// Vídeos
export async function getVideosDaAula(idAula: number): Promise<AulaVideo[]> {
  return await apiFetch(`/curso/aula/aulavideo/${idAula}`);
}

/** Cria um novo vídeo vinculado à aula */
export async function criarVideo(idAula: number, data: { url: string }): Promise<AulaVideo> {
  return await apiFetch(`/curso/aula/aulavideo/${idAula}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

/** Edita um vídeo da aula */
export async function editarVideo(idAulaVideo: number, data: Partial<AulaVideo>): Promise<AulaVideo> {
  return await apiFetch(`/curso/aula/aulavideo/${idAulaVideo}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

/** Exclui um vídeo da aula */
export async function excluirVideo(idAulaVideo: number): Promise<{ message: string }> {
  return await apiFetch(`/curso/aula/aulavideo/${idAulaVideo}`, {
    method: "DELETE",
  });
}

// Materiais
/** Lista os materiais de uma aula */
export async function getMateriaisDaAula(idAula: number): Promise<MaterialComplementar[]> {
  return await apiFetch(`/curso/aula/materialcomplementar/${idAula}`);
}

/** Cria um novo material na aula */
export async function criarMaterial(idAula: number, data: Omit<MaterialComplementar, "idMaterialComplementar" | "fkAulaId">): Promise<MaterialComplementar> {
  return await apiFetch(`/curso/aula/materialcomplementar/${idAula}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

/** Edita um material da aula */
export async function editarMaterial(idMaterial: number, data: Partial<MaterialComplementar>): Promise<MaterialComplementar> {
  return await apiFetch(`/curso/aula/materialcomplementar/${idMaterial}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

/** Exclui um material da aula */
export async function excluirMaterial(idMaterial: number): Promise<{ message: string }> {
  return await apiFetch(`/curso/aula/materialcomplementar/${idMaterial}`, {
    method: "DELETE",
  });
}

// Steps
export async function getStepsDaAula(idAula: number): Promise<AulaStep[]> {
  return await apiFetch(`/curso/aula/steps/${idAula}`);
}

export async function criarStep(idAula: number, data: Omit<AulaStep, "idAulaStep" | "ordem" | "fkAulaId">): Promise<AulaStep> {
  return await apiFetch(`/curso/aula/steps/${idAula}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function editarStep(idAulaStep: number, data: Partial<AulaStep>): Promise<AulaStep> {
  return await apiFetch(`/curso/aula/steps/${idAulaStep}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function excluirStep(idAulaStep: number): Promise<{ message: string }> {
  return await apiFetch(`/curso/aula/steps/${idAulaStep}`, {
    method: "DELETE",
  });
}

export async function reordenarSteps(
  idAula: number,
  itens: Array<{ idAulaStep: number; ordem: number }>
): Promise<{ message: string }> {
  return await apiFetch(`/curso/aula/steps/${idAula}/reordenar`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itens }),
  });
}

export async function reordenarAulas(aulas: any[]) {
  return apiFetch(`/curso/aula/reordenar`, { 
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ aulas: aulas }),
   });
}
