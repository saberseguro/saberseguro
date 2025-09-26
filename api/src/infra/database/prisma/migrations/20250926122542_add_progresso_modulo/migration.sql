-- AlterTable
ALTER TABLE `moduloacesso` ADD COLUMN `dataConclusao` DATETIME(0) NULL,
    ADD COLUMN `percentual` FLOAT NOT NULL DEFAULT 0;
