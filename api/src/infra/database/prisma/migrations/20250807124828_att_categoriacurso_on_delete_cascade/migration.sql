-- DropForeignKey
ALTER TABLE `categoriacurso` DROP FOREIGN KEY `categoriacurso_fkCategoriaId_fkey`;

-- DropForeignKey
ALTER TABLE `categoriacurso` DROP FOREIGN KEY `categoriacurso_fkCursoId_fkey`;

-- DropIndex
DROP INDEX `categoriacurso_fkCategoriaId_fkey` ON `categoriacurso`;

-- AddForeignKey
ALTER TABLE `categoriacurso` ADD CONSTRAINT `categoriacurso_fkCursoId_fkey` FOREIGN KEY (`fkCursoId`) REFERENCES `curso`(`idCurso`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categoriacurso` ADD CONSTRAINT `categoriacurso_fkCategoriaId_fkey` FOREIGN KEY (`fkCategoriaId`) REFERENCES `categoria`(`idCategoria`) ON DELETE CASCADE ON UPDATE CASCADE;
