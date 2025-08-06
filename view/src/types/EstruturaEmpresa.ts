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
}

export interface Cargo {
  idCargo: number;
  nome: string;
  descricao: string;
  criado_em: Date;
  editado_em: Date;
  ativo: number;
  fkSetorId: number;
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
}