import { apiFetch } from "./apiFetch";

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