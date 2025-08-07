export interface Curso {
  idCurso: number;
  titulo: string;
  descricao?: string;
  cargaHoraria: string;
  ativo: number;
  fkResponsavelTecnicoId: number;
  fkEmpresaId?: number;
  modulos: Modulo[];
}

export interface Modulo {
  idModulo?: number;
  titulo: string;
  descricao?: string;
  aulas: Aula[];
}

export interface Aula {
  idAula?: number;
  titulo: string;
  descricao?: string;
}

export interface Categoria {
  idCategoria: number;
  nome: string;
}