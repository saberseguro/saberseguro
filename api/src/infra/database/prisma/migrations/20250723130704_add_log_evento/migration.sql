-- CreateTable
CREATE TABLE `logEvento` (
    `idLogEvento` INTEGER NOT NULL AUTO_INCREMENT,
    `fkUsuarioId` INTEGER NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NULL,
    `entidade` VARCHAR(191) NULL,
    `entidade_id` INTEGER NULL,
    `dados_antes` JSON NULL,
    `dados_depois` JSON NULL,
    `criado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`idLogEvento`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `logEvento` ADD CONSTRAINT `fk_logEvento_fkUsuarioId` FOREIGN KEY (`fkUsuarioId`) REFERENCES `usuario`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
