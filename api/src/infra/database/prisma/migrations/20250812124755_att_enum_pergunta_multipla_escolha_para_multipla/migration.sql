/*
  Warnings:

  - The values [multipla_escolha] on the enum `pergunta_tipo` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `pergunta` MODIFY `tipo` ENUM('multipla', 'dissertativa', 'vf') NOT NULL;
