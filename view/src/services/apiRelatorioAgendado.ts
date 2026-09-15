import { apiFetch } from "./apiFetch";
import type { PayloadRelatorioAgendado, RelatorioAgendado } from "../types/RelatorioAgendado";

export function listarRelatoriosAgendados(fkEmpresaId?: number): Promise<RelatorioAgendado[]> {
  const query = fkEmpresaId ? `?fkEmpresaId=${fkEmpresaId}` : "";
  return apiFetch(`/relatorio-agendado${query}`);
}

export function criarRelatorioAgendado(payload: PayloadRelatorioAgendado): Promise<RelatorioAgendado> {
  return apiFetch("/relatorio-agendado", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function atualizarRelatorioAgendado(
  idRelatorioAgendado: number,
  payload: Partial<PayloadRelatorioAgendado>
): Promise<RelatorioAgendado> {
  return apiFetch(`/relatorio-agendado/${idRelatorioAgendado}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function alternarAtivoRelatorioAgendado(
  idRelatorioAgendado: number,
  ativo: boolean
): Promise<RelatorioAgendado> {
  return apiFetch(`/relatorio-agendado/${idRelatorioAgendado}/ativo`, {
    method: "PATCH",
    body: JSON.stringify({ ativo }),
  });
}

export function removerRelatorioAgendado(idRelatorioAgendado: number): Promise<{ message: string }> {
  return apiFetch(`/relatorio-agendado/${idRelatorioAgendado}`, {
    method: "DELETE",
  });
}
