import type { Empresa, Unidade, Setor, Cargo, Funcionario } from "../types";

const API_URL = import.meta.env.VITE_API_URL;

export async function getEmpresa(id: number): Promise<Empresa> {
  const res = await fetch(`${API_URL}/empresa/${id}`, { headers: authHeader() });
  return res.json();
}

export async function getUnidades(id: number): Promise<Unidade[]> {
  const res = await fetch(`${API_URL}/unidade/unidadesEmpresa/${id}`, { headers: authHeader() });
  return res.json();
}

export async function getSetores(id: number): Promise<Setor[]> {
  const res = await fetch(`${API_URL}/setor/setoresUnidade/${id}`, { headers: authHeader() });
  return res.json();
}

export async function getCargos(id: number): Promise<Cargo[]> {
  const res = await fetch(`${API_URL}/cargo/cargosSetor/${id}`, { headers: authHeader() });
  return res.json();
}

export async function getFuncionarios(id: number): Promise<Funcionario[]> {
  const res = await fetch(`${API_URL}/cargo/funcionariosCargo/${id}`, { headers: authHeader() });
  return res.json();
}

function authHeader() {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}