import type { DashboardHomeDTO } from "../types/DashBoard";
import { apiFetch } from "./apiFetch";

export async function buscarDashboardHome(): Promise<DashboardHomeDTO> {
  const selectedCompanyRaw = localStorage.getItem("@saberseguro");

  let fkEmpresaId: number | null = null;

  if (selectedCompanyRaw) {
    const parsed = JSON.parse(selectedCompanyRaw);
    fkEmpresaId = parsed?.selectedCompany?.idEmpresa ?? null;
  }

  const query = fkEmpresaId ? `?fkEmpresaId=${fkEmpresaId}` : "";

  return await apiFetch(`/dashboard${query}`);
}