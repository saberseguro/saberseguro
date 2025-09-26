-- AlterTable
ALTER TABLE `cursoacesso` ADD COLUMN `dataInicio` DATETIME(0) NULL;

-- CreateTable
CREATE TABLE `aulavideoprogresso` (
    `idAulaVideoProgresso` INTEGER NOT NULL AUTO_INCREMENT,
    `fkUsuarioId` INTEGER NOT NULL,
    `fkAulaVideoId` INTEGER NOT NULL,
    `tempoAssistidoSegundos` INTEGER NOT NULL DEFAULT 0,
    `assistido` BOOLEAN NOT NULL DEFAULT false,
    `atualizado_em` DATETIME(0) NOT NULL,

    INDEX `aulavideoprogresso_fkAulaVideoId_idx`(`fkAulaVideoId`),
    UNIQUE INDEX `aulavideoprogresso_fkUsuarioId_fkAulaVideoId_key`(`fkUsuarioId`, `fkAulaVideoId`),
    PRIMARY KEY (`idAulaVideoProgresso`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `materialacesso` (
    `idMaterialAcesso` INTEGER NOT NULL AUTO_INCREMENT,
    `fkUsuarioId` INTEGER NOT NULL,
    `fkMaterialId` INTEGER NOT NULL,
    `visualizado` BOOLEAN NOT NULL DEFAULT false,
    `criado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `materialacesso_fkMaterialId_idx`(`fkMaterialId`),
    UNIQUE INDEX `materialacesso_fkUsuarioId_fkMaterialId_key`(`fkUsuarioId`, `fkMaterialId`),
    PRIMARY KEY (`idMaterialAcesso`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `aulavideoprogresso` ADD CONSTRAINT `aulavideoprogresso_fkUsuarioId_fkey` FOREIGN KEY (`fkUsuarioId`) REFERENCES `usuario`(`idUsuario`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aulavideoprogresso` ADD CONSTRAINT `aulavideoprogresso_fkAulaVideoId_fkey` FOREIGN KEY (`fkAulaVideoId`) REFERENCES `aulavideo`(`idAulaVideo`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `materialacesso` ADD CONSTRAINT `materialacesso_fkUsuarioId_fkey` FOREIGN KEY (`fkUsuarioId`) REFERENCES `usuario`(`idUsuario`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `materialacesso` ADD CONSTRAINT `materialacesso_fkMaterialId_fkey` FOREIGN KEY (`fkMaterialId`) REFERENCES `materialcomplementar`(`idMaterialComplementar`) ON DELETE CASCADE ON UPDATE CASCADE;
