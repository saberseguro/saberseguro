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

// Todos os cargos da empresa (de qualquer unidade/setor), usado no seletor
// de cargo do modal de funcionário quando aberto a partir da Lista de
// Funcionários (visão plana, sem cargo pré-selecionado por drill-down).
export async function getCargosPorEmpresa(fkEmpresaId: number, apenasAtivos = true): Promise<Cargo[]> {
  return apiFetch(`/cargo/cargosEmpresa/${fkEmpresaId}?apenasAtivos=${apenasAtivos ? "1" : "0"}`);
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

// Detalhes completos de UM funcionário (roles, horários, cursos/medidas),
// usado pelo modal de edição pra não depender do resumo leve que a tela de
// origem (ex.: Lista de Funcionários) já tinha em mãos.
export async function getFuncionarioDetalhado(idUsuario: number): Promise<Funcionario> {
  return apiFetch(`/usuario/${idUsuario}`);
}

// Gera o link de redefinição de senha do funcionário (Firebase), pra copiar
// e mandar manualmente em vez de depender só do e-mail automático.
export async function gerarLinkRedefinicaoSenha(idUsuario: number): Promise<{ link: string }> {
  return apiFetch(`/usuario/${idUsuario}/link-redefinicao-senha`, { method: "POST" });
}

export async function getResumoCertificadoEmpresa(): Promise<CertificadosResumo> {
  return await apiFetch("/empresa/certificado/resumo");
}
