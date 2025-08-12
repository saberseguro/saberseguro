import type { Medida, MedidaTipo } from "./EstruturaMedida";

let tempId = -1;
const nextTempId = () => tempId--;

export const makeMedida = (overrides?: Partial<Medida>): Medida => ({
  idMedida: nextTempId(),
  nome: "",
  descricao: "",
  tipo: "EPI" as MedidaTipo,
  ativo: 1,
  criado_em: new Date().toISOString(),
  editado_em: new Date().toISOString(),
  ...overrides,
});