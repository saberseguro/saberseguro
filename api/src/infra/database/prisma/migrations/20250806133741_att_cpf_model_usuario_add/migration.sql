/*
  Warnings:

  - A unique constraint covering the columns `[cpf]` on the table `usuario` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `usuario` ADD COLUMN `cpf` VARCHAR(12) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `cpf_UNIQUE` ON `usuario`(`cpf`);
