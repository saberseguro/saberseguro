import type { Aula, AulaVideo, Avaliacao, Curso, MaterialComplementar, Modulo } from "./EstruturaCurso";

export const makeAvaliacao = (ordem: number): Avaliacao => ({
  idAvaliacao: undefined,
  titulo: "Nova avaliação",
  descricao: "",
  tempoLimite: 0,
  tipoAplicacao: "",
  ordem: ordem,
  ativo: 1,
  fkAulaId: undefined,
  fkModuloId: undefined,
  fkCursoId: undefined,
  perguntas: [],
  avaliacoesUsuarios: [],

  criado_em: new Date().toISOString(),
  editado_em: new Date().toISOString(),
});

export const makeVideo = (): AulaVideo => ({
  idAulaVideo: undefined,
  url: "",
});

export const makeMaterial = (): MaterialComplementar => ({
  idMaterialComplementar: undefined,
  titulo: "Novo material",
  tipo: "LINK",
  material: "",
  ativo: 1,
});

export const makeAula = (ordem = 1): Aula => ({
  idAula: undefined,
  titulo: "Nova aula",
  descricao: "",
  tipo: "",
  duracao: 0,
  ordem,
  ativo: 1,
  videos: [],
  materiais: [],
  avaliacoes: [],
});

export const makeModulo = (ordem = 1): Modulo => ({
  idModulo: undefined,
  titulo: "Novo módulo",
  cargaHoraria: "00h",
  ativo: 1,
  ordem,
  aulas: [],
  avaliacoes: [],
});

export const makeCurso = (): Curso => ({
  idCurso: 0,
  titulo: "",
  descricao: "",
  cargaHoraria: "00h",
  ativo: 1,
  criado_em: new Date().toISOString(),
  editado_em: new Date().toISOString(),
  fkResponsavelTecnicoId: 0,
  modulos: [],
  avaliacoes: [],
});
