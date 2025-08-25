import type { Usuario } from "./Usuario";

export interface Curso {
  idCurso: number;
  titulo: string;
  descricao?: string;
  cargaHoraria: number;
  Ordem?: number;
  ativo?: number;
  criado_em: string;
  editado_em: string;
  fkResponsavelTecnicoId: number;
  fkEmpresaId?: number;

  responsaveltecnico?: Usuario;
  categorias?: CategoriaCurso[];
  modulos: Modulo[];
  avaliacoes?: Avaliacao[];
}

export type CursoCompleto = Omit<Curso, 'categorias'> & {
  categorias: { categoria: Categoria }[];
  modulos: Modulo[];
  avaliacoes: Avaliacao[];
  responsaveltecnico?: ResponsavelTecnico;
};

export interface Modulo {
  idModulo?: number;
  titulo: string;
  cargaHoraria?: number;
  ordem?: number;
  ativo?: number;

  aulas: Aula[];
  avaliacoes?: Avaliacao[];
}

export interface Aula {
  idAula?: number;
  titulo: string;
  descricao?: string;
  tipo?: string;
  duracao?: number;
  ordem?: number;
  ativo?: number;
  criado_em?: string;
  editado_em?: string;

  videos?: AulaVideo[];
  materiais?: MaterialComplementar[];
  steps?: AulaStep[];
  avaliacoes?: Avaliacao[];
}

export interface Categoria {
  idCategoria: number;
  nome: string;
  descricao?: string;
}

export interface CategoriaCurso {
  idCategoriaCurso: number;
  fkCursoId: number;
  fkCategoriaId: number;
  categoria: Categoria;
}

export interface ResponsavelTecnico {
  idResponsavelTecnico: number;
  nome: string;
  tipoDocumento: string;
  documento: string;
  registro: string;
  funcao: string;
  telefone: string;
  criado_em: string;
  editado_em: string;
  ativo: number;
}

export interface AulaVideo {
  idAulaVideo?: number;
  url: string;
}

export interface MaterialComplementar {
  idMaterialComplementar?: number;
  titulo: string;
  tipo: string;
  material: string;
  ativo: number;
  fkAulaId?: number;
}

export interface Avaliacao {
  idAvaliacao?: number;
  titulo: string;
  descricao?: string;
  tempo_limite?: number;
  tipoAplicacao?: string;
  ordem: number;
  ativo: number;

  fkCursoId?: number;
  fkModuloId?: number;
  fkAulaId?: number;

  criado_em?: string;
  editado_em?: string;

  perguntas: any[];
  avaliacoesUsuarios: any[];
}

export type Alternativa = {
  idAlternativa?: number;
  texto: string;
  correta: number;
  ativo?: number;
};

export type Pergunta = {
  idPergunta?: number;
  enunciado: string;
  tipo: 'multipla' | 'dissertativa' | string;
  ativo?: number;
  alternativas?: Alternativa[];
};

export type AulaStep = {
  idAulaStep?: number;
  tipo: "video" | "material" | "avaliacao";
  ordem: number;
  obrigatorio: 0 | 1;
  fkAulaVideoId?: number | null;
  fkMaterialId?: number | null;
  fkAvaliacaoId?: number | null;
};