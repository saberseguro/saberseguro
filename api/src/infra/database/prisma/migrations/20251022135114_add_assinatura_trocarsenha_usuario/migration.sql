-- DropForeignKey
ALTER TABLE `certificado` DROP FOREIGN KEY `certificado_fkCursoId_fkey`;

-- DropForeignKey
ALTER TABLE `certificado` DROP FOREIGN KEY `certificado_fkEmpresaId_fkey`;

-- DropForeignKey
ALTER TABLE `certificado` DROP FOREIGN KEY `certificado_fkUsuarioId_fkey`;

-- DropForeignKey
ALTER TABLE `certificadoempresa` DROP FOREIGN KEY `certificadoempresa_fkEmpresaId_fkey`;

-- DropForeignKey
ALTER TABLE `curso` DROP FOREIGN KEY `fk_curso_fkResponsavelTecnicoId`;

-- DropForeignKey
ALTER TABLE `logevento` DROP FOREIGN KEY `fk_logEvento_fkUsuarioId`;

-- DropForeignKey
ALTER TABLE `usuariohorario` DROP FOREIGN KEY `usuarioHorario_fkUsuarioId_fkey`;

-- AlterTable
ALTER TABLE `logevento` MODIFY `dados_antes` LONGTEXT NULL,
    MODIFY `dados_depois` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `usuario` ADD COLUMN `assinatura` VARCHAR(191) NULL,
    ADD COLUMN `trocarsenha` BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE `curso` ADD CONSTRAINT `fk_curso_fkResponsavelTecnicoId` FOREIGN KEY (`fkResponsavelTecnicoId`) REFERENCES `responsaveltecnico`(`idResponsavelTecnico`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `logevento` ADD CONSTRAINT `fk_logEvento_fkUsuarioId` FOREIGN KEY (`fkUsuarioId`) REFERENCES `usuario`(`idUsuario`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuariohorario` ADD CONSTRAINT `usuarioHorario_fkUsuarioId_fkey` FOREIGN KEY (`fkUsuarioId`) REFERENCES `usuario`(`idUsuario`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificado` ADD CONSTRAINT `certificado_fkCursoId_fkey` FOREIGN KEY (`fkCursoId`) REFERENCES `curso`(`idCurso`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificado` ADD CONSTRAINT `certificado_fkEmpresaId_fkey` FOREIGN KEY (`fkEmpresaId`) REFERENCES `empresa`(`idEmpresa`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificado` ADD CONSTRAINT `certificado_fkUsuarioId_fkey` FOREIGN KEY (`fkUsuarioId`) REFERENCES `usuario`(`idUsuario`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificadoempresa` ADD CONSTRAINT `certificadoempresa_fkEmpresaId_fkey` FOREIGN KEY (`fkEmpresaId`) REFERENCES `empresa`(`idEmpresa`) ON DELETE NO ACTION ON UPDATE CASCADE;
