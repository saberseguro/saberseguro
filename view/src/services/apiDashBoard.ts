import type { DashboardHomeDTO } from "../types/DashBoard";
import { apiFetch } from "./apiFetch";

export async function getDashBoardHome(idUsuario: number): Promise<DashboardHomeDTO> {
  return await apiFetch(`/dashboard/home/${idUsuario}`);
}