/*
  Warnings:

  - A unique constraint covering the columns `[fkCursoId,fkEmpresaId,fkUnidadeId,fkSetorId,fkCargoId,fkUsuarioId]` on the table `cursoacesso` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `cursoacesso_fkCursoId_fkEmpresaId_fkUnidadeId_fkSetorId_fkCa_key` ON `cursoacesso`(`fkCursoId`, `fkEmpresaId`, `fkUnidadeId`, `fkSetorId`, `fkCargoId`, `fkUsuarioId`);
