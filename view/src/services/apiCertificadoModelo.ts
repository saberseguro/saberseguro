import type { CertificadoModelo } from "../types/EstruturaCurso";
import { apiFetch } from "./apiFetch";

// Buscar todos os modelos
export async function getCertificadosModelo(): Promise<CertificadoModelo[]> {
  return await apiFetch(`/certificados`);
}

// Buscar um modelo por ID
export async function getCertificadoModeloPorId(id: number): Promise<CertificadoModelo> {
  return await apiFetch(`/certificados/${id}`);
}

// Criar um novo modelo
export async function criarCertificadoModelo(certificado: Partial<CertificadoModelo>): Promise<CertificadoModelo> {
  return await apiFetch(`/certificados/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(certificado),
  });
}

// Editar um modelo existente
export async function editarCertificadoModelo(id: number, certificado: Partial<CertificadoModelo>): Promise<CertificadoModelo> {
  return await apiFetch(`/certificados/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(certificado),
  });
}

// Excluir um modelo
export async function excluirCertificadoModelo(id: number): Promise<void> {
  return await apiFetch(`/certificados/${id}`, {
    method: "DELETE",
  });
}

export async function vincularCertificadoAoCurso(
  idCurso: number,
  fkCertificadoModeloId: number | null
): Promise<any> {
  return await apiFetch(`/curso/${idCurso}/vincular-certificado`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fkCertificadoModeloId: fkCertificadoModeloId }),
  });
}