-- AddForeignKey
ALTER TABLE `usuario` ADD CONSTRAINT `fk_usuario_fkEmpresaId` FOREIGN KEY (`fkEmpresaId`) REFERENCES `empresa`(`idEmpresa`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuario` ADD CONSTRAINT `fk_usuario_fkCargoId` FOREIGN KEY (`fkCargoId`) REFERENCES `cargo`(`idCargo`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cargo` ADD CONSTRAINT `fk_cargo_fkSetorId` FOREIGN KEY (`fkSetorId`) REFERENCES `setor`(`idSetor`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `setor` ADD CONSTRAINT `fk_setor_fkUnidadeId` FOREIGN KEY (`fkUnidadeId`) REFERENCES `unidade`(`idUnidade`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `unidade` ADD CONSTRAINT `fk_unidade_fkEmpresaId` FOREIGN KEY (`fkEmpresaId`) REFERENCES `empresa`(`idEmpresa`) ON DELETE CASCADE ON UPDATE CASCADE;
