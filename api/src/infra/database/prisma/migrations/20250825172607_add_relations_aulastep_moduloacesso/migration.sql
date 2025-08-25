-- CreateTable
CREATE TABLE `aulastep` (
    `idAulaStep` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` ENUM('video', 'material', 'avaliacao') NOT NULL,
    `ordem` INTEGER NOT NULL,
    `obrigatorio` TINYINT NOT NULL DEFAULT 1,
    `criado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `editado_em` DATETIME(0) NOT NULL,
    `fkAulaId` INTEGER NOT NULL,
    `fkMaterialId` INTEGER NULL,
    `fkAulaVideoId` INTEGER NULL,
    `fkAvaliacaoId` INTEGER NULL,

    INDEX `aulastep_fkAulaId_ordem_idx`(`fkAulaId`, `ordem`),
    PRIMARY KEY (`idAulaStep`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `moduloacesso` (
    `idModuloAcesso` INTEGER NOT NULL AUTO_INCREMENT,
    `fkModuloId` INTEGER NOT NULL,
    `fkUsuarioId` INTEGER NOT NULL,
    `concluido` BOOLEAN NOT NULL DEFAULT false,
    `criado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `editado_em` DATETIME(0) NOT NULL,

    UNIQUE INDEX `moduloacesso_fkModuloId_fkUsuarioId_key`(`fkModuloId`, `fkUsuarioId`),
    PRIMARY KEY (`idModuloAcesso`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `aulastep` ADD CONSTRAINT `aulastep_fkAulaId_fkey` FOREIGN KEY (`fkAulaId`) REFERENCES `aula`(`idAula`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aulastep` ADD CONSTRAINT `aulastep_fkAulaVideoId_fkey` FOREIGN KEY (`fkAulaVideoId`) REFERENCES `aulavideo`(`idAulaVideo`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aulastep` ADD CONSTRAINT `aulastep_fkMaterialId_fkey` FOREIGN KEY (`fkMaterialId`) REFERENCES `materialcomplementar`(`idMaterialComplementar`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aulastep` ADD CONSTRAINT `aulastep_fkAvaliacaoId_fkey` FOREIGN KEY (`fkAvaliacaoId`) REFERENCES `avaliacao`(`idAvaliacao`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `moduloacesso` ADD CONSTRAINT `moduloacesso_fkModuloId_fkey` FOREIGN KEY (`fkModuloId`) REFERENCES `modulo`(`idModulo`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `moduloacesso` ADD CONSTRAINT `moduloacesso_fkUsuarioId_fkey` FOREIGN KEY (`fkUsuarioId`) REFERENCES `usuario`(`idUsuario`) ON DELETE CASCADE ON UPDATE CASCADE;
