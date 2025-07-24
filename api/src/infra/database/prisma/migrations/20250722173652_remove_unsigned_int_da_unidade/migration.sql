/*
  Warnings:

  - You are about to alter the column `fkUnidadeId` on the `medidavinculo` table. The data in that column could be lost. The data in that column will be cast from `UnsignedInt` to `Int`.
  - You are about to alter the column `fkUnidadeId` on the `setor` table. The data in that column could be lost. The data in that column will be cast from `UnsignedInt` to `Int`.
  - The primary key for the `unidade` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `idUnidade` on the `unidade` table. The data in that column could be lost. The data in that column will be cast from `UnsignedInt` to `Int`.

*/
-- AlterTable
ALTER TABLE `medidavinculo` MODIFY `fkUnidadeId` INTEGER NULL;

-- AlterTable
ALTER TABLE `setor` MODIFY `fkUnidadeId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `unidade` DROP PRIMARY KEY,
    MODIFY `idUnidade` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`idUnidade`);
