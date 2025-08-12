export type MedidaTipo = "epi" | "epc" | "adm" | "treinamento" | "inspecao" | "geral";

export interface Medida {
  idMedida: number;
  nome: string;
  descricao?: string | null;
  tipo: MedidaTipo;
  ativo: 0 | 1;
  criado_em?: string;
  editado_em?: string;
}

export interface MedidaFiltro {
  busca?: string;
  tipo?: MedidaTipo | "";
  ativo?: "" | 0 | 1;
  page?: number;
}

export interface Paginado<T> {
  data: T[];
  total: number;
  page: number;
  take: number;
}


// --- Vínculos de medida (estrutura) ---
export type MedidaVinculoPayload = {
  fkMedidaId: number;
  fkEmpresaId?: number | null;
  fkUnidadeId?: number | null;
  fkSetorId?: number | null;
  fkCargoId?: number | null;
  fkUsuarioId?: number | null;
};

export type MedidaVinculo = {
  idMedidaVinculo: number;
  fkMedidaId: number;
  fkEmpresaId: number | null;
  fkUnidadeId: number | null;
  fkSetorId: number | null;
  fkCargoId: number | null;
  fkUsuarioId: number | null;
  empresa?: { idEmpresa: number; nomeFantasia: string } | null;
  unidade?: { idUnidade: number; nomeFantasia: string } | null;
  setor?: { idSetor: number; nome: string } | null;
  cargo?: { idCargo: number; nome: string } | null;
  usuario?: { idUsuario: number; nome: string; email: string } | null;
};

// --- Vínculo medida x curso ---
export type MedidaCurso = {
  fkMedidaId: number;
  fkCursoId: number;
  validade: number;
  curso?: { idCurso: number; titulo: string };
};