import type { Funcionario } from "../types/EstruturaEmpresa";

export function temPermissao(
  usuario: Pick<Funcionario, "permissoes"> | null | undefined,
  permissoesRequeridas: string[] = [],
): boolean {
  if (!usuario) return false;

  const permissoes = usuario.permissoes ?? [];

  const possuiPermissao =
    permissoesRequeridas.length === 0 || permissoesRequeridas.some(p => permissoes.includes(p));

  return possuiPermissao;
}