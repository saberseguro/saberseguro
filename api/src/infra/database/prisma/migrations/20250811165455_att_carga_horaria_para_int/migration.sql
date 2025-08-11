/*
  Warnings:

  - You are about to alter the column `cargaHoraria` on the `curso` table. The data in that column could be lost. The data in that column will be cast from `VarChar(45)` to `Int`.
  - You are about to alter the column `cargaHoraria` on the `modulo` table. The data in that column could be lost. The data in that column will be cast from `VarChar(45)` to `Int`.

*/
-- AlterTable
ALTER TABLE `curso` MODIFY `cargaHoraria` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `modulo` MODIFY `cargaHoraria` INTEGER NOT NULL;
