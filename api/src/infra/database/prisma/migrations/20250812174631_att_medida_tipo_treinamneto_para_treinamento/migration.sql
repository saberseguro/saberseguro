/*
  Warnings:

  - The values [treinamneto] on the enum `medida_tipo` will be removed. If these variants are still used in the database, this will fail.
  - The values [vf] on the enum `pergunta_tipo` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `medida` MODIFY `tipo` ENUM('epi', 'epc', 'adm', 'treinamento', 'inspecao', 'geral') NOT NULL;

-- AlterTable
ALTER TABLE `pergunta` MODIFY `tipo` ENUM('multipla', 'dissertativa') NOT NULL;
