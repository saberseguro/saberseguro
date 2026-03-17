import type { CertificadosResumo } from "../types/EstruturaCurso";
import type { Empresa, Unidade, Setor, Cargo, Funcionario } from "../types/EstruturaEmpresa";
import { apiFetch } from "./apiFetch";

export async function searchEmpresas(termo: string): Promise<Empresa[]> {
  return apiFetch(`/empresa?busca=${encodeURIComponent(termo)}`);
}

export async function getEmpresas(): Promise<Empresa[]> {
  return apiFetch('/empresa') as Promise<Empresa[]>;
}

export async function getEmpresa(id: number): Promise<Empresa> {
  return apiFetch(`/empresa/${id}`);
}

export async function getUnidades(id: number): Promise<Unidade[]> {
  return apiFetch(`/unidade/unidadesEmpresa/${id}?includeCursos=1&includeMedidas=1`);
}

export async function getSetores(idUnidade: number, fkEmpresaId: number): Promise<Setor[]> {
  return apiFetch(`/setor/setoresUnidade/${idUnidade}?includeCursos=1&includeMedidas=1&fkEmpresaId=${fkEmpresaId}`);
}

export async function getCargos(idSetor: number, fkEmpresaId: number): Promise<Cargo[]> {
  return apiFetch(`/cargo/cargosSetor/${idSetor}?includeCursos=1&includeMedidas=1&fkEmpresaId=${fkEmpresaId}`);
}

export async function getFuncionarios(idCargo: number, fkEmpresaId: number): Promise<Funcionario[]> {
  return apiFetch(`/cargo/funcionariosCargo/${idCargo}?includeCursos=1&includeMedidas=1&fkEmpresaId=${fkEmpresaId}`);
}

export interface FiltroFuncionariosRelatorio {
  fkEmpresaId: number;
  fkUnidadeId?: number;
  fkSetorId?: number;
  fkCargoId?: number;
  fkFuncionarioId?: number;
  ativo?: number;
}

export async function buscarFuncionariosRelatorio(filtros: FiltroFuncionariosRelatorio) {
  const params = new URLSearchParams();

  params.append("fkEmpresaId", String(filtros.fkEmpresaId));

  if (filtros.fkUnidadeId) params.append("fkUnidadeId", String(filtros.fkUnidadeId));
  if (filtros.fkSetorId) params.append("fkSetorId", String(filtros.fkSetorId));
  if (filtros.fkCargoId) params.append("fkCargoId", String(filtros.fkCargoId));
  if (filtros.fkFuncionarioId) params.append("fkFuncionarioId", String(filtros.fkFuncionarioId));
  if (filtros.ativo !== undefined) params.append("ativo", String(filtros.ativo));

  return apiFetch<Funcionario[]>(`/cargo/funcionarios-relatorio?${params.toString()}`);
}

export async function getResumoCertificadoEmpresa(): Promise<CertificadosResumo> {
  return await apiFetch("/empresa/certificado/resumo");
}
