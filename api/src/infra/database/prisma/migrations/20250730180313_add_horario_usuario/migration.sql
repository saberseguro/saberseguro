/*
  Warnings:

  - You are about to alter the column `diaSemana` on the `usuariohorario` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `Int`.

*/
-- AlterTable
ALTER TABLE `usuariohorario` MODIFY `diaSemana` INTEGER NOT NULL;
