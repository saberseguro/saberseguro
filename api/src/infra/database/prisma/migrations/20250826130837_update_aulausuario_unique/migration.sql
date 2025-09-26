/*
  Warnings:

  - A unique constraint covering the columns `[fkAulaId,fkUsuarioId]` on the table `aulausuario` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `aulausuario_fkAulaId_fkUsuarioId_key` ON `aulausuario`(`fkAulaId`, `fkUsuarioId`);
