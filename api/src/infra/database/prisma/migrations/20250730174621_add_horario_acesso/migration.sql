-- CreateTable
CREATE TABLE `usuarioHorario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `diaSemana` ENUM('segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo') NOT NULL,
    `horarioInicio` VARCHAR(191) NOT NULL,
    `horarioFim` VARCHAR(191) NOT NULL,
    `fkUsuarioId` INTEGER NOT NULL,

    UNIQUE INDEX `usuarioHorario_fkUsuarioId_diaSemana_key`(`fkUsuarioId`, `diaSemana`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `usuarioHorario` ADD CONSTRAINT `usuarioHorario_fkUsuarioId_fkey` FOREIGN KEY (`fkUsuarioId`) REFERENCES `usuario`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;
