/*
  Warnings:

  - A unique constraint covering the columns `[fkCursoId,fkUsuarioId]` on the table `cursoacesso` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX `fk_aulaUsuario_fkAulaId` ON `aulausuario`(`fkAulaId`);

-- CreateIndex
CREATE UNIQUE INDEX `cursoacesso_fkCursoId_fkUsuarioId_key` ON `cursoacesso`(`fkCursoId`, `fkUsuarioId`);
