-- CreateTable
CREATE TABLE `certificado` (
    `idCertificado` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(191) NULL,
    `fkUsuarioId` INTEGER NOT NULL,
    `fkCursoId` INTEGER NOT NULL,
    `fkEmpresaId` INTEGER NOT NULL,
    `dataGeracao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `urlArquivo` VARCHAR(191) NULL,
    `valido` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `certificado_codigo_key`(`codigo`),
    PRIMARY KEY (`idCertificado`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `certificadoempresa` (
    `idCertificadoEmpresa` INTEGER NOT NULL AUTO_INCREMENT,
    `fkEmpresaId` INTEGER NOT NULL,
    `totalGerados` INTEGER NOT NULL DEFAULT 0,
    `limiteMensal` INTEGER NULL,
    `competencia` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `certificadoempresa_fkEmpresaId_competencia_key`(`fkEmpresaId`, `competencia`),
    PRIMARY KEY (`idCertificadoEmpresa`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `certificado` ADD CONSTRAINT `certificado_fkUsuarioId_fkey` FOREIGN KEY (`fkUsuarioId`) REFERENCES `usuario`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificado` ADD CONSTRAINT `certificado_fkCursoId_fkey` FOREIGN KEY (`fkCursoId`) REFERENCES `curso`(`idCurso`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificado` ADD CONSTRAINT `certificado_fkEmpresaId_fkey` FOREIGN KEY (`fkEmpresaId`) REFERENCES `empresa`(`idEmpresa`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificadoempresa` ADD CONSTRAINT `certificadoempresa_fkEmpresaId_fkey` FOREIGN KEY (`fkEmpresaId`) REFERENCES `empresa`(`idEmpresa`) ON DELETE RESTRICT ON UPDATE CASCADE;
