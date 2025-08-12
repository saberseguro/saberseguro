import type { Alternativa, Aula, AulaVideo, Avaliacao, Curso, MaterialComplementar, Modulo, Pergunta } from "./EstruturaCurso";
// Avaliação
let tempId = -1;
const nextTempId = () => tempId--;

export const makeVideo = (): AulaVideo => ({
  idAulaVideo: nextTempId(),
  url: "",
});

export const makeMaterial = (): MaterialComplementar => ({
  idMaterialComplementar: nextTempId(),
  titulo: "Novo material",
  tipo: "LINK",
  material: "",
  ativo: 1,
});

export const makeAula = (ordem = 1): Aula => ({
  idAula: nextTempId(),
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
  idModulo: nextTempId(),
  titulo: "Novo módulo",
  cargaHoraria: 0,
  ativo: 1,
  ordem,
  aulas: [],
  avaliacoes: [],
});

export const makeCurso = ({ fkEmpresaId = 0 }: { fkEmpresaId?: number } = {}): Curso => ({
  idCurso: nextTempId(),
  titulo: "Novo Curso",
  descricao: "Descreva o curso aqui...",
  cargaHoraria: 0,
  ativo: 1,
  criado_em: new Date().toISOString(),
  editado_em: new Date().toISOString(),
  fkResponsavelTecnicoId: 0,
  fkEmpresaId,
  modulos: [],
  avaliacoes: [],
});


export const makeAvaliacao = (ordem: number): Avaliacao => ({
  idAvaliacao: nextTempId(),
  titulo: "Nova avaliação",
  descricao: "",
  tempo_limite: 0,
  tipoAplicacao: "avaliacao",
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

export function makePergunta(): Pergunta {
  return {
    idPergunta: nextTempId(),
    enunciado: '',
    tipo: 'multipla',
    ativo: 1,
    alternativas: [],
  };
}

export function makeAlternativa(): Alternativa {
  return { idAlternativa: nextTempId(), texto: '', correta: 0, ativo: 1 };
}