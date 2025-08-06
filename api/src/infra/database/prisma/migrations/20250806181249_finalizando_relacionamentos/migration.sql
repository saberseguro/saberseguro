/*
  Warnings:

  - You are about to drop the column `grauRIsco` on the `cnae` table. All the data in the column will be lost.
  - You are about to drop the column `fkCategoriaId` on the `curso` table. All the data in the column will be lost.
  - Added the required column `grauRisco` to the `cnae` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `alternativa` ALTER COLUMN `editado_em` DROP DEFAULT;

-- AlterTable
ALTER TABLE `aula` ALTER COLUMN `editado_em` DROP DEFAULT;

-- AlterTable
ALTER TABLE `avaliacao` ALTER COLUMN `editado_em` DROP DEFAULT;

-- AlterTable
ALTER TABLE `cnae` DROP COLUMN `grauRIsco`,
    ADD COLUMN `grauRisco` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `curso` DROP COLUMN `fkCategoriaId`,
    ALTER COLUMN `editado_em` DROP DEFAULT;

-- AlterTable
ALTER TABLE `cursoacesso` ALTER COLUMN `atualizado_em` DROP DEFAULT;

-- AlterTable
ALTER TABLE `modulo` ALTER COLUMN `editado_em` DROP DEFAULT;

-- CreateTable
CREATE TABLE `categoriacurso` (
    `idCategoriaCurso` INTEGER NOT NULL AUTO_INCREMENT,
    `fkCursoId` INTEGER NOT NULL,
    `fkCategoriaId` INTEGER NOT NULL,

    UNIQUE INDEX `categoriacurso_fkCursoId_fkCategoriaId_key`(`fkCursoId`, `fkCategoriaId`),
    PRIMARY KEY (`idCategoriaCurso`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `alternativa` ADD CONSTRAINT `fk_alternativa_fkPerguntaId` FOREIGN KEY (`fkPerguntaId`) REFERENCES `pergunta`(`idPergunta`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aula` ADD CONSTRAINT `fk_aula_fkModuloId` FOREIGN KEY (`fkModuloId`) REFERENCES `modulo`(`idModulo`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aulausuario` ADD CONSTRAINT `fk_aulaUsuario_fkAulaId` FOREIGN KEY (`fkAulaId`) REFERENCES `aula`(`idAula`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aulausuario` ADD CONSTRAINT `fk_aulaUsuario_fkUsuarioId` FOREIGN KEY (`fkUsuarioId`) REFERENCES `usuario`(`idUsuario`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aulavideo` ADD CONSTRAINT `fk_aulaVideo_fkAulaId` FOREIGN KEY (`fkAulaId`) REFERENCES `aula`(`idAula`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacao` ADD CONSTRAINT `fk_avaliacao_fkCursoId` FOREIGN KEY (`fkCursoId`) REFERENCES `curso`(`idCurso`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacao` ADD CONSTRAINT `fk_avaliacao_fkModuloId` FOREIGN KEY (`fkModuloId`) REFERENCES `modulo`(`idModulo`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacao` ADD CONSTRAINT `fk_avaliacao_fkAulaId` FOREIGN KEY (`fkAulaId`) REFERENCES `aula`(`idAula`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacaousuario` ADD CONSTRAINT `fk_avaliacaoUsuario_fkUsuarioId` FOREIGN KEY (`fkUsuarioId`) REFERENCES `usuario`(`idUsuario`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacaousuario` ADD CONSTRAINT `fk_avaliacaoUsuario_fkAvaliacaoId` FOREIGN KEY (`fkAvaliacaoId`) REFERENCES `avaliacao`(`idAvaliacao`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categoriacurso` ADD CONSTRAINT `categoriacurso_fkCursoId_fkey` FOREIGN KEY (`fkCursoId`) REFERENCES `curso`(`idCurso`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categoriacurso` ADD CONSTRAINT `categoriacurso_fkCategoriaId_fkey` FOREIGN KEY (`fkCategoriaId`) REFERENCES `categoria`(`idCategoria`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cnaevinculo` ADD CONSTRAINT `cnaevinculo_fkCnaeId_fkey` FOREIGN KEY (`fkCnaeId`) REFERENCES `cnae`(`idCnae`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cnaevinculo` ADD CONSTRAINT `cnaevinculo_fkEmpresaId_fkey` FOREIGN KEY (`fkEmpresaId`) REFERENCES `empresa`(`idEmpresa`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cnaevinculo` ADD CONSTRAINT `cnaevinculo_fkUnidadeId_fkey` FOREIGN KEY (`fkUnidadeId`) REFERENCES `unidade`(`idUnidade`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `curso` ADD CONSTRAINT `fk_curso_fkResponsavelTecnicoId` FOREIGN KEY (`fkResponsavelTecnicoId`) REFERENCES `responsaveltecnico`(`idResponsavelTecnico`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `curso` ADD CONSTRAINT `fk_curso_fkEmpresaId` FOREIGN KEY (`fkEmpresaId`) REFERENCES `empresa`(`idEmpresa`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cursoacesso` ADD CONSTRAINT `cursoacesso_fkCursoId_fkey` FOREIGN KEY (`fkCursoId`) REFERENCES `curso`(`idCurso`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cursoacesso` ADD CONSTRAINT `cursoacesso_fkUsuarioId_fkey` FOREIGN KEY (`fkUsuarioId`) REFERENCES `usuario`(`idUsuario`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cursoacesso` ADD CONSTRAINT `cursoacesso_fkEmpresaId_fkey` FOREIGN KEY (`fkEmpresaId`) REFERENCES `empresa`(`idEmpresa`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cursoacesso` ADD CONSTRAINT `cursoacesso_fkUnidadeId_fkey` FOREIGN KEY (`fkUnidadeId`) REFERENCES `unidade`(`idUnidade`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cursoacesso` ADD CONSTRAINT `cursoacesso_fkSetorId_fkey` FOREIGN KEY (`fkSetorId`) REFERENCES `setor`(`idSetor`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cursoacesso` ADD CONSTRAINT `cursoacesso_fkCargoId_fkey` FOREIGN KEY (`fkCargoId`) REFERENCES `cargo`(`idCargo`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `materialcomplementar` ADD CONSTRAINT `fk_materialComplementar_fkAulaId` FOREIGN KEY (`fkAulaId`) REFERENCES `aula`(`idAula`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medida` ADD CONSTRAINT `medida_fkEmpresaId_fkey` FOREIGN KEY (`fkEmpresaId`) REFERENCES `empresa`(`idEmpresa`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medidacurso` ADD CONSTRAINT `medidacurso_fkMedidaId_fkey` FOREIGN KEY (`fkMedidaId`) REFERENCES `medida`(`idMedida`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medidacurso` ADD CONSTRAINT `medidacurso_fkCursoId_fkey` FOREIGN KEY (`fkCursoId`) REFERENCES `curso`(`idCurso`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medidavinculo` ADD CONSTRAINT `medidavinculo_fkMedidaId_fkey` FOREIGN KEY (`fkMedidaId`) REFERENCES `medida`(`idMedida`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medidavinculo` ADD CONSTRAINT `medidavinculo_fkEmpresaId_fkey` FOREIGN KEY (`fkEmpresaId`) REFERENCES `empresa`(`idEmpresa`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medidavinculo` ADD CONSTRAINT `medidavinculo_fkUnidadeId_fkey` FOREIGN KEY (`fkUnidadeId`) REFERENCES `unidade`(`idUnidade`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medidavinculo` ADD CONSTRAINT `medidavinculo_fkSetorId_fkey` FOREIGN KEY (`fkSetorId`) REFERENCES `setor`(`idSetor`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medidavinculo` ADD CONSTRAINT `medidavinculo_fkCargoId_fkey` FOREIGN KEY (`fkCargoId`) REFERENCES `cargo`(`idCargo`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medidavinculo` ADD CONSTRAINT `medidavinculo_fkUsuarioId_fkey` FOREIGN KEY (`fkUsuarioId`) REFERENCES `usuario`(`idUsuario`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `modulo` ADD CONSTRAINT `fk_modulo_fkCursoId` FOREIGN KEY (`fkCursoId`) REFERENCES `curso`(`idCurso`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pergunta` ADD CONSTRAINT `fk_pergunta_fkAvalicaoId` FOREIGN KEY (`fkAvaliacaoId`) REFERENCES `avaliacao`(`idAvaliacao`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resposta` ADD CONSTRAINT `fk_resposta_fkAvaliacaoUsuarioId` FOREIGN KEY (`fkAvaliacaoUsuarioId`) REFERENCES `avaliacaousuario`(`idAvaliacaoUsuario`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resposta` ADD CONSTRAINT `fk_resposta_fkAlternativaId` FOREIGN KEY (`fkAlternativaId`) REFERENCES `alternativa`(`idAlternativa`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resposta` ADD CONSTRAINT `fk_resposta_fkPerguntaId` FOREIGN KEY (`fkPerguntaId`) REFERENCES `pergunta`(`idPergunta`) ON DELETE CASCADE ON UPDATE CASCADE;
