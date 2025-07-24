-- CreateTable
CREATE TABLE `usuario` (
    `idUsuario` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(45) NOT NULL,
    `email` VARCHAR(45) NOT NULL,
    `criado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `editado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ativo` TINYINT NOT NULL DEFAULT 1,
    `fkEmpresaId` INTEGER NULL,
    `fkResponsavelTecnicoId` INTEGER NULL,
    `fkCargoId` INTEGER NULL,
    `firebaseId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `email_UNIQUE`(`email`),
    UNIQUE INDEX `usuario_firebaseId_key`(`firebaseId`),
    PRIMARY KEY (`idUsuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alternativa` (
    `idAlternativa` INTEGER NOT NULL AUTO_INCREMENT,
    `texto` TEXT NOT NULL,
    `correta` TINYINT NOT NULL,
    `criado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `editado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ativo` TINYINT NOT NULL DEFAULT 1,
    `fkPerguntaId` INTEGER NOT NULL,

    PRIMARY KEY (`idAlternativa`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aula` (
    `idAula` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(45) NOT NULL,
    `descricao` TEXT NULL,
    `tipo` ENUM('video', 'pdf') NOT NULL,
    `duracao` INTEGER NOT NULL,
    `ordem` INTEGER NOT NULL,
    `criado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `editado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ativo` TINYINT NOT NULL DEFAULT 1,
    `fkModuloId` INTEGER NOT NULL,

    PRIMARY KEY (`idAula`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aulausuario` (
    `idAulaUsuario` INTEGER NOT NULL AUTO_INCREMENT,
    `assistiuVideo` TINYINT NOT NULL DEFAULT 0,
    `baixouMateriais` TINYINT NOT NULL DEFAULT 0,
    `respondeuQuiz` TINYINT NOT NULL,
    `concluida` TINYINT NOT NULL,
    `atualizado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `criado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `fkAulaId` INTEGER NOT NULL,
    `fkUsuarioId` INTEGER NOT NULL,

    PRIMARY KEY (`idAulaUsuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aulavideo` (
    `idAulaVideo` INTEGER NOT NULL AUTO_INCREMENT,
    `url` TEXT NOT NULL,
    `fkAulaId` INTEGER NOT NULL,

    PRIMARY KEY (`idAulaVideo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `avaliacao` (
    `idAvaliacao` INTEGER NOT NULL AUTO_INCREMENT,
    `fkCursoId` INTEGER NULL,
    `fkModuloId` INTEGER NULL,
    `fkAulaId` INTEGER NULL,
    `titulo` VARCHAR(45) NOT NULL,
    `tempo_limite` INTEGER NOT NULL,
    `tipoAplicacao` ENUM('avaliacao', 'quiz') NOT NULL,
    `criado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `editado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ativo` TINYINT NOT NULL DEFAULT 1,

    PRIMARY KEY (`idAvaliacao`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `avaliacaousuario` (
    `idAvaliacaoUsuario` INTEGER NOT NULL AUTO_INCREMENT,
    `dataInicio` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `dataFim` DATETIME(0) NULL,
    `nota` FLOAT NULL,
    `status` ENUM('andamento', 'concluida', 'cancelada') NOT NULL,
    `fkUsuarioId` INTEGER NOT NULL,
    `fkAvaliacaoId` INTEGER NOT NULL,

    PRIMARY KEY (`idAvaliacaoUsuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cargo` (
    `idCargo` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(45) NOT NULL,
    `descricao` TEXT NOT NULL,
    `criado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `editado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ativo` TINYINT NOT NULL DEFAULT 1,
    `fkSetorId` INTEGER NOT NULL,

    PRIMARY KEY (`idCargo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categoria` (
    `idCategoria` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(45) NOT NULL,
    `descricao` TEXT NOT NULL,

    PRIMARY KEY (`idCategoria`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cnae` (
    `idCnae` INTEGER NOT NULL AUTO_INCREMENT,
    `subclasse` VARCHAR(45) NOT NULL,
    `descricao` TEXT NOT NULL,
    `grauRIsco` INTEGER NOT NULL,

    PRIMARY KEY (`idCnae`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cnaevinculo` (
    `idCnaeVinculo` INTEGER NOT NULL,
    `fkCnaeId` INTEGER NULL,
    `fkEmpresaId` INTEGER NULL,
    `fkUnidadeId` INTEGER NULL,

    PRIMARY KEY (`idCnaeVinculo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `curso` (
    `idCurso` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(45) NOT NULL,
    `descricao` TEXT NULL,
    `cargaHoraria` VARCHAR(45) NOT NULL,
    `criado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `editado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ativo` TINYINT NOT NULL DEFAULT 1,
    `fkCategoriaId` INTEGER NOT NULL,
    `fkResponsavelTecnicoId` INTEGER NOT NULL,
    `fkEmpresaId` INTEGER NULL,

    PRIMARY KEY (`idCurso`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cursoacesso` (
    `idCursoAcesso` INTEGER NOT NULL AUTO_INCREMENT,
    `fkCursoId` INTEGER NOT NULL,
    `fkUsuarioId` INTEGER NULL,
    `fkEmpresaId` INTEGER NULL,
    `fkUnidadeId` INTEGER NULL,
    `fkSetorId` INTEGER NULL,
    `fkCargoId` INTEGER NULL,
    `percentual` FLOAT NOT NULL DEFAULT 0,
    `concluido` TINYINT NOT NULL DEFAULT 0,
    `dataConclusao` DATETIME(0) NULL,
    `atualizado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`idCursoAcesso`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `empresa` (
    `idEmpresa` INTEGER NOT NULL AUTO_INCREMENT,
    `nomeFantasia` VARCHAR(45) NOT NULL,
    `razaoSocial` VARCHAR(45) NOT NULL,
    `tipoDocumento` ENUM('cnpj', 'caepf') NOT NULL,
    `documento` VARCHAR(20) NOT NULL,
    `cep` VARCHAR(10) NOT NULL,
    `endereco` VARCHAR(45) NOT NULL,
    `numero` VARCHAR(10) NULL,
    `bairro` VARCHAR(45) NOT NULL,
    `cidade` VARCHAR(45) NOT NULL,
    `uf` VARCHAR(2) NOT NULL,
    `logoUrl` TEXT NULL,
    `criado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `editado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ativo` TINYINT NOT NULL DEFAULT 1,

    PRIMARY KEY (`idEmpresa`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `materialcomplementar` (
    `idMaterialComplementar` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(45) NOT NULL,
    `tipo` ENUM('pdf', 'link') NOT NULL,
    `material` TEXT NOT NULL,
    `criado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `editado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ativo` TINYINT NOT NULL DEFAULT 1,
    `fkAulaId` INTEGER NOT NULL,

    PRIMARY KEY (`idMaterialComplementar`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medida` (
    `idMedida` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(45) NOT NULL,
    `tipo` ENUM('epi', 'epc', 'adm', 'treinamneto', 'inspecao', 'geral') NOT NULL,
    `descricao` TEXT NULL,
    `ativo` TINYINT NOT NULL DEFAULT 1,
    `fkEmpresaId` INTEGER NULL,

    PRIMARY KEY (`idMedida`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medidacurso` (
    `fkMedidaId` INTEGER NOT NULL,
    `fkCursoId` INTEGER NOT NULL,
    `validade` INTEGER NOT NULL,

    PRIMARY KEY (`fkMedidaId`, `fkCursoId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medidavinculo` (
    `idMedidaVinculo` INTEGER NOT NULL AUTO_INCREMENT,
    `fkMedidaId` INTEGER NOT NULL,
    `fkEmpresaId` INTEGER NULL,
    `fkUnidadeId` INTEGER UNSIGNED NULL,
    `fkSetorId` INTEGER NULL,
    `fkCargoId` INTEGER NULL,
    `fkUsuarioId` INTEGER NULL,

    PRIMARY KEY (`idMedidaVinculo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `modulo` (
    `idModulo` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(45) NOT NULL,
    `cargaHoraria` VARCHAR(45) NOT NULL,
    `criado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `editado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ativo` TINYINT NOT NULL DEFAULT 1,
    `ordem` INTEGER NOT NULL,
    `fkCursoId` INTEGER NOT NULL,

    PRIMARY KEY (`idModulo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pergunta` (
    `idPergunta` INTEGER NOT NULL AUTO_INCREMENT,
    `enunciado` TEXT NOT NULL,
    `tipo` ENUM('multipla_escolha', 'dissertativa', 'vf') NOT NULL,
    `criado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `editado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ativo` TINYINT NOT NULL DEFAULT 1,
    `fkAvaliacaoId` INTEGER NOT NULL,

    PRIMARY KEY (`idPergunta`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissao` (
    `idPermissao` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(45) NOT NULL,
    `descricao` TEXT NULL,

    PRIMARY KEY (`idPermissao`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `responsaveltecnico` (
    `idResponsavelTecnico` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(45) NOT NULL,
    `tipoDocumento` ENUM('cpf', 'rg', 'cnh') NOT NULL,
    `documento` VARCHAR(45) NOT NULL,
    `registro` VARCHAR(45) NOT NULL,
    `funcao` VARCHAR(45) NOT NULL,
    `telefone` VARCHAR(45) NOT NULL,
    `criado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `editado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ativo` TINYINT NOT NULL DEFAULT 1,

    PRIMARY KEY (`idResponsavelTecnico`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resposta` (
    `idResposta` INTEGER NOT NULL AUTO_INCREMENT,
    `resposta` TEXT NOT NULL,
    `dataResposta` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `fkAvaliacaoUsuarioId` INTEGER NOT NULL,
    `fkAlternativaId` INTEGER NULL,
    `fkPerguntaId` INTEGER NOT NULL,

    PRIMARY KEY (`idResposta`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role` (
    `idRole` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(45) NOT NULL,

    PRIMARY KEY (`idRole`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rolepermissao` (
    `fkRoleId` INTEGER NOT NULL,
    `fkPermissaoId` INTEGER NOT NULL,

    INDEX `fk_rolepermissao_fkPermissaoId`(`fkPermissaoId`),
    PRIMARY KEY (`fkRoleId`, `fkPermissaoId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `setor` (
    `idSetor` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(45) NOT NULL,
    `descricao` TEXT NOT NULL,
    `ambiente` TEXT NULL,
    `criado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `editado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ativo` TINYINT NOT NULL DEFAULT 1,
    `fkUnidadeId` INTEGER UNSIGNED NOT NULL,

    PRIMARY KEY (`idSetor`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `unidade` (
    `idUnidade` INTEGER UNSIGNED NOT NULL,
    `nomeFantasia` VARCHAR(45) NOT NULL,
    `razaoSocial` VARCHAR(45) NOT NULL,
    `tipoDocumento` ENUM('cnpj', 'caepf') NOT NULL,
    `documento` VARCHAR(20) NOT NULL,
    `cep` VARCHAR(10) NOT NULL,
    `endereco` VARCHAR(45) NOT NULL,
    `numero` VARCHAR(10) NULL,
    `bairro` VARCHAR(45) NOT NULL,
    `cidade` VARCHAR(45) NOT NULL,
    `uf` VARCHAR(2) NOT NULL,
    `criado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `editado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ativo` TINYINT NOT NULL DEFAULT 1,
    `copiarEmpresa` TINYINT NULL DEFAULT 0,
    `fkEmpresaId` INTEGER NOT NULL,

    PRIMARY KEY (`idUnidade`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuariorole` (
    `fkUsuarioId` INTEGER NOT NULL,
    `fkRoleId` INTEGER NOT NULL,

    INDEX `fk_usuariorole_fkRoleId`(`fkRoleId`),
    PRIMARY KEY (`fkUsuarioId`, `fkRoleId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `rolepermissao` ADD CONSTRAINT `fk_rolepermissao_fkPermissaoId` FOREIGN KEY (`fkPermissaoId`) REFERENCES `permissao`(`idPermissao`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rolepermissao` ADD CONSTRAINT `fk_rolepermissao_fkRoleId` FOREIGN KEY (`fkRoleId`) REFERENCES `role`(`idRole`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuariorole` ADD CONSTRAINT `fk_usuariorole_fkRoleId` FOREIGN KEY (`fkRoleId`) REFERENCES `role`(`idRole`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuariorole` ADD CONSTRAINT `fk_usuariorole_fkUsuarioId` FOREIGN KEY (`fkUsuarioId`) REFERENCES `usuario`(`idUsuario`) ON DELETE CASCADE ON UPDATE CASCADE;
