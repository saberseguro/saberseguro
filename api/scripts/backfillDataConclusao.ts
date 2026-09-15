/**
 * Script de correção pontual (rodar uma única vez).
 *
 * Defeito: a lógica que marca um curso como concluído nunca gravava a
 * coluna `cursoacesso.dataConclusao`. Isso já foi corrigido em
 * `src/models/curso/aulausuario.ts` (novas conclusões vão gravar a data
 * corretamente a partir de agora).
 *
 * Só que os funcionários que JÁ concluíram cursos antes dessa correção
 * ficaram com `concluido = 1` e `dataConclusao = NULL` no banco. Como os
 * relatórios (ex.: Lista de Presença) filtram por `dataConclusao IS NOT
 * NULL`, esses funcionários continuam invisíveis nos relatórios até rodar
 * este backfill uma vez.
 *
 * O que ele faz: para cada `cursoacesso` concluído sem dataConclusao,
 * usa `atualizado_em` (a última vez que aquele registro foi alterado,
 * que na prática costuma coincidir com o momento da conclusão) como data
 * de conclusão. Não altera nada além disso, e é seguro rodar mais de uma
 * vez (não afeta linhas que já têm dataConclusao).
 *
 * Como rodar (dentro da pasta api/):
 *   npx ts-node scripts/backfillDataConclusao.ts
 */
import { prisma } from "../src/config/prisma-client";

async function main() {
  const pendentes = await prisma.cursoacesso.findMany({
    where: {
      fkUsuarioId: { not: null },
      concluido: 1,
      dataConclusao: null,
    },
    select: { idCursoAcesso: true, atualizado_em: true },
  });

  console.log(`Encontrados ${pendentes.length} registro(s) concluído(s) sem dataConclusao.`);

  if (pendentes.length === 0) {
    console.log("Nada para corrigir.");
    return;
  }

  let corrigidos = 0;
  for (const item of pendentes) {
    await prisma.cursoacesso.update({
      where: { idCursoAcesso: item.idCursoAcesso },
      data: { dataConclusao: item.atualizado_em },
    });
    corrigidos++;
  }

  console.log(`Corrigidos ${corrigidos} registro(s).`);
}

main()
  .catch((err) => {
    console.error("Erro ao rodar backfill:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
