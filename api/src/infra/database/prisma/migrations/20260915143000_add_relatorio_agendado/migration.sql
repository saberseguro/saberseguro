-- CreateTable
CREATE TABLE `relatorioagendado` (
    `idRelatorioAgendado` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(120) NOT NULL,
    `fkEmpresaId` INTEGER NOT NULL,
    `fkUsuarioId` INTEGER NOT NULL,
    `tipoRelatorio` VARCHAR(60) NOT NULL,
    `formato` VARCHAR(10) NOT NULL,
    `filtros` JSON NOT NULL,
    `emailsDestino` VARCHAR(500) NOT NULL,
    `frequencia` ENUM('semanal', 'quinzenal', 'mensal') NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `proximoEnvioEm` DATETIME(0) NOT NULL,
    `ultimoEnvioEm` DATETIME(0) NULL,
    `criadoEm` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `editadoEm` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `relatorioagendado_fkEmpresaId_fkey`(`fkEmpresaId`),
    INDEX `relatorioagendado_fkUsuarioId_fkey`(`fkUsuarioId`),
    INDEX `relatorioagendado_ativo_proximoEnvioEm_idx`(`ativo`, `proximoEnvioEm`),
    PRIMARY KEY (`idRelatorioAgendado`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `relatorioagendado` ADD CONSTRAINT `relatorioagendado_fkEmpresaId_fkey` FOREIGN KEY (`fkEmpresaId`) REFERENCES `empresa`(`idEmpresa`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `relatorioagendado` ADD CONSTRAINT `relatorioagendado_fkUsuarioId_fkey` FOREIGN KEY (`fkUsuarioId`) REFERENCES `usuario`(`idUsuario`) ON DELETE NO ACTION ON UPDATE CASCADE;
