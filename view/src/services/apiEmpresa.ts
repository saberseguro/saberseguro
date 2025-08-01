import type { Empresa, Unidade, Setor, Cargo, Funcionario } from "../types/EstruturaEmpresa";
import { apiFetch } from "./apiFetch";

export async function searchEmpresas(termo: string): Promise<Empresa[]> {
  return apiFetch(`/empresa?busca=${encodeURIComponent(termo)}`);
}

export async function getEmpresa(id: number): Promise<Empresa> {
  return apiFetch(`/empresa/${id}`);
}

export async function getUnidades(id: number): Promise<Unidade[]> {
  return apiFetch(`/unidade/unidadesEmpresa/${id}`);
}

export async function getSetores(id: number): Promise<Setor[]> {
  return apiFetch(`/setor/setoresUnidade/${id}`);
}

export async function getCargos(id: number): Promise<Cargo[]> {
  return apiFetch(`/cargo/cargosSetor/${id}`);
}

export async function getFuncionarios(id: number): Promise<Funcionario[]> {
  return apiFetch(`/cargo/funcionariosCargo/${id}`);
}