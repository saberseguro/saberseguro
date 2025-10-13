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

export async function getResumoCertificadoEmpresa(): Promise<CertificadosResumo> {
  return await apiFetch("/empresa/certificado/resumo");
}
