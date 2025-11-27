-- AlterTable
ALTER TABLE `curso` ADD COLUMN `fkCertificadoModeloId` INTEGER NULL;

-- CreateTable
CREATE TABLE `certificadomodelo` (
    `idCertificadoModelo` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(100) NOT NULL,
    `conteudoHtml` LONGTEXT NOT NULL,
    `tipoEscopo` ENUM('global', 'empresa') NOT NULL DEFAULT 'global',
    `fkEmpresaId` INTEGER NULL,
    `criadoEm` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `editadoEm` DATETIME(0) NOT NULL,
    `ativo` TINYINT NOT NULL DEFAULT 1,

    PRIMARY KEY (`idCertificadoModelo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `curso` ADD CONSTRAINT `curso_fkCertificadoModeloId_fkey` FOREIGN KEY (`fkCertificadoModeloId`) REFERENCES `certificadomodelo`(`idCertificadoModelo`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificadomodelo` ADD CONSTRAINT `certificadomodelo_fkEmpresaId_fkey` FOREIGN KEY (`fkEmpresaId`) REFERENCES `empresa`(`idEmpresa`) ON DELETE SET NULL ON UPDATE CASCADE;
