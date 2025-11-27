import type { Modulo } from "../types/EstruturaCurso";
import { apiFetch } from "./apiFetch";

// Modulos
export async function getModuloPorId(idModulo: number): Promise<Modulo> {
  return await apiFetch(`/curso/modulo/${idModulo}`);
}

export async function salvarModulo(modulo: Partial<Modulo>): Promise<Modulo> {
  return await apiFetch(`/curso/modulo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(modulo),
  });
}

export async function editarModulo(idModulo: number, modulo: Partial<Modulo>): Promise<Modulo> {
  return await apiFetch(`/curso/modulo/${idModulo}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(modulo),
  });
}

export async function reordenarModulos(modulos: any[]) {
  return apiFetch(`/curso/modulo/reordenar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({modulos: modulos}),
  });
}