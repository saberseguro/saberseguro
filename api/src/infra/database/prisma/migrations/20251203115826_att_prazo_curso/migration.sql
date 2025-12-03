-- AlterTable
ALTER TABLE `curso` ADD COLUMN `prazo` INTEGER NULL;

-- AlterTable
ALTER TABLE `cursoacesso` ADD COLUMN `expirado` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `prazoLimite` DATETIME(0) NULL;
