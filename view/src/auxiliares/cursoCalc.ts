import type { Curso, Modulo, Aula } from "../types/EstruturaCurso";

const n = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export function sumAulasDuracao(modulo?: Pick<Modulo, "aulas">): number {
  const aulas = modulo?.aulas ?? [];
  return aulas.reduce((tot, a: Aula) => tot + n(a.duracao), 0);
}

export function withCalculatedCargaHoraria<T extends Curso & { modulos: Modulo[] }>(
  curso: T
): T {
  // 1) calcula carga por módulo a partir das aulas
  const modulos = (curso.modulos ?? []).map((m) => ({
    ...m,
    cargaHoraria: sumAulasDuracao(m),
  }));

  // 2) curso = soma das cargas dos módulos
  const cargaHoraria = modulos.reduce((tot, m) => tot + n(m.cargaHoraria), 0);

  return { ...curso, modulos, cargaHoraria };
}