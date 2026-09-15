import type { Curso } from "./EstruturaCurso";
import type { Medida } from "./EstruturaMedida";

export interface Empresa {
  idEmpresa: number;
  nomeFantasia: string;
  razaoSocial: string;
  tipoDocumento: string;
  documento: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  logoUrl: string;
  criado_em: Date;
  editado_em: Date;
  ativo: number;

  cursos?: Curso[];
  medidas?: Medida[];
}

export interface Unidade {
  idUnidade: number;
  nomeFantasia: string;
  razaoSocial: string;
  tipoDocumento: string;
  documento: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  telefone: string;
  criado_em: Date;
  editado_em: Date;
  ativo: number;
  fkEmpresaId: number;

  cursos: Curso[];
  medidas: Medida[];
}

export interface Setor {
  idSetor: number;
  nome: string;
  descricao: string;
  ambiente: string;
  criado_em: Date;
  editado_em: Date;
  ativo: number;
  fkUnidadeId: number;

  cursos: Curso[];
  medidas: Medida[];
}

export interface Cargo {
  idCargo: number;
  nome: string;
  descricao: string;
  criado_em: Date;
  editado_em: Date;
  ativo: number;
  fkSetorId: number;

  cursos: Curso[];
  medidas: Medida[];

  // Presente quando o cargo vem da busca "todos os cargos da empresa"
  // (usada no seletor de cargo da Lista de Funcionários).
  setor?: {
    idSetor: number;
    nome: string;
    unidade?: { idUnidade: number; nomeFantasia: string } | null;
  } | null;
}

interface Role {
  idRole: number;
  role: string;
}

export interface HorarioAcesso {
  diaSemana: number;
  diaSemanaNome: string,
  horarioInicio: string;
  horarioFim: string;
}

export interface Funcionario {
  idUsuario: number;
  nome: string;
  cpf: string;
  telefone?: string;
  email: string;
  senha: string;
  ativo: number;
  fkCargoId?: number;
  fkEmpresaId?: number;
  fkResponsavelTecnicoId?: number;
  criado_em: Date;
  editado_em: Date;
  
  roles: Role[];
  permissoes: string[];
  usuarioHorario?: HorarioAcesso[];
  cursos: Curso[];
  medidas: Medida[];

  // Presentes quando o funcionário vem da busca "flat" por empresa (Lista
  // de Funcionários / relatório de funcionários), pra mostrar em qual
  // unidade/setor/cargo ele está sem precisar navegar pela hierarquia.
  cargo?: { idCargo: number; nome: string } | null;
  setor?: { idSetor: number; nome: string } | null;
  unidade?: { idUnidade: number; nomeFantasia: string } | null;
}