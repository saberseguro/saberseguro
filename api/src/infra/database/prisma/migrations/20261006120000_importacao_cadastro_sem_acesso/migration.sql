-- Cadastros importados podem aguardar configuração de acesso, sem e-mails fictícios.
ALTER TABLE `usuario` MODIFY `email` VARCHAR(45) NULL,
    MODIFY `firebaseId` VARCHAR(191) NULL;
-- A razão social do Modelo 1 excede o limite anterior de 45 caracteres.
ALTER TABLE `empresa` MODIFY `nomeFantasia` VARCHAR(255) NOT NULL,
    MODIFY `razaoSocial` VARCHAR(255) NOT NULL;
ALTER TABLE `unidade` MODIFY `nomeFantasia` VARCHAR(255) NOT NULL,
    MODIFY `razaoSocial` VARCHAR(255) NOT NULL;
