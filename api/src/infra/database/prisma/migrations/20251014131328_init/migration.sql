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
    `cpf` VARCHAR(12) NULL,

    UNIQUE INDEX `email_UNIQUE`(`email`),
    UNIQUE INDEX `usuario_firebaseId_key`(`firebaseId`),
    UNIQUE INDEX `cpf_UNIQUE`(`cpf`),
    INDEX `fk_usuario_fkCargoId`(`fkCargoId`),
    INDEX `fk_usuario_fkEmpresaId`(`fkEmpresaId`),
    PRIMARY KEY (`idUsuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alternativa` (
    `idAlternativa` INTEGER NOT NULL AUTO_INCREMENT,
    `texto` TEXT NOT NULL,
    `correta` TINYINT NOT NULL,
    `criado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `editado_em` DATETIME(0) NOT NULL,
    `ativo` TINYINT NOT NULL DEFAULT 1,
    `fkPerguntaId` INTEGER NOT NULL,

    INDEX `fk_alternativa_fkPerguntaId`(`fkPerguntaId`),
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
    `editado_em` DATETIME(0) NOT NULL,
    `ativo` TINYINT NOT NULL DEFAULT 1,
    `fkModuloId` INTEGER NOT NULL,

    INDEX `fk_aula_fkModuloId`(`fkModuloId`),
    PRIMARY KEY (`idAula`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aulastep` (
    `idAulaStep` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` ENUM('video', 'material', 'avaliacao') NOT NULL,
    `ordem` INTEGER NOT NULL,
    `obrigatorio` TINYINT NOT NULL DEFAULT 1,
    `criado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `editado_em` DATETIME(0) NOT NULL,
    `fkAulaId` INTEGER NOT NULL,
    `fkMaterialId` INTEGER NULL,
    `fkAulaVideoId` INTEGER NULL,
    `fkAvaliacaoId` INTEGER NULL,

    INDEX `aulastep_fkAulaId_ordem_idx`(`fkAulaId`, `ordem`),
    INDEX `aulastep_fkAulaVideoId_fkey`(`fkAulaVideoId`),
    INDEX `aulastep_fkAvaliacaoId_fkey`(`fkAvaliacaoId`),
    INDEX `aulastep_fkMaterialId_fkey`(`fkMaterialId`),
    PRIMARY KEY (`idAulaStep`)
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

    INDEX `fk_aulaUsuario_fkAulaId`(`fkAulaId`),
    INDEX `fk_aulaUsuario_fkUsuarioId`(`fkUsuarioId`),
    UNIQUE INDEX `aulausuario_fkAulaId_fkUsuarioId_key`(`fkAulaId`, `fkUsuarioId`),
    PRIMARY KEY (`idAulaUsuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aulavideo` (
    `idAulaVideo` INTEGER NOT NULL AUTO_INCREMENT,
    `url` TEXT NOT NULL,
    `fkAulaId` INTEGER NOT NULL,

    INDEX `fk_aulaVideo_fkAulaId`(`fkAulaId`),
    PRIMARY KEY (`idAulaVideo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aulavideoprogresso` (
    `idAulaVideoProgresso` INTEGER NOT NULL AUTO_INCREMENT,
    `fkUsuarioId` INTEGER NOT NULL,
    `fkAulaVideoId` INTEGER NOT NULL,
    `tempoAssistidoSegundos` INTEGER NOT NULL DEFAULT 0,
    `assistido` BOOLEAN NOT NULL DEFAULT false,
    `atualizado_em` DATETIME(0) NOT NULL,

    INDEX `aulavideoprogresso_fkAulaVideoId_idx`(`fkAulaVideoId`),
    UNIQUE INDEX `aulavideoprogresso_fkUsuarioId_fkAulaVideoId_key`(`fkUsuarioId`, `fkAulaVideoId`),
    PRIMARY KEY (`idAulaVideoProgresso`)
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
    `editado_em` DATETIME(0) NOT NULL,
    `ativo` TINYINT NOT NULL DEFAULT 1,

    INDEX `fk_avaliacao_fkAulaId`(`fkAulaId`),
    INDEX `fk_avaliacao_fkCursoId`(`fkCursoId`),
    INDEX `fk_avaliacao_fkModuloId`(`fkModuloId`),
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

    INDEX `fk_avaliacaoUsuario_fkAvaliacaoId`(`fkAvaliacaoId`),
    INDEX `fk_avaliacaoUsuario_fkUsuarioId`(`fkUsuarioId`),
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

    INDEX `fk_cargo_fkSetorId`(`fkSetorId`),
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
CREATE TABLE `categoriacurso` (
    `idCategoriaCurso` INTEGER NOT NULL AUTO_INCREMENT,
    `fkCursoId` INTEGER NOT NULL,
    `fkCategoriaId` INTEGER NOT NULL,

    INDEX `categoriacurso_fkCategoriaId_fkey`(`fkCategoriaId`),
    UNIQUE INDEX `categoriacurso_fkCursoId_fkCategoriaId_key`(`fkCursoId`, `fkCategoriaId`),
    PRIMARY KEY (`idCategoriaCurso`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cnae` (
    `idCnae` INTEGER NOT NULL AUTO_INCREMENT,
    `subclasse` VARCHAR(45) NOT NULL,
    `descricao` TEXT NOT NULL,
    `grauRisco` INTEGER NOT NULL,

    PRIMARY KEY (`idCnae`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cnaevinculo` (
    `idCnaeVinculo` INTEGER NOT NULL,
    `fkCnaeId` INTEGER NULL,
    `fkEmpresaId` INTEGER NULL,
    `fkUnidadeId` INTEGER NULL,

    INDEX `cnaevinculo_fkCnaeId_fkey`(`fkCnaeId`),
    INDEX `cnaevinculo_fkEmpresaId_fkey`(`fkEmpresaId`),
    INDEX `cnaevinculo_fkUnidadeId_fkey`(`fkUnidadeId`),
    PRIMARY KEY (`idCnaeVinculo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `curso` (
    `idCurso` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(45) NOT NULL,
    `descricao` TEXT NULL,
    `cargaHoraria` INTEGER NOT NULL,
    `criado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `editado_em` DATETIME(0) NOT NULL,
    `ativo` TINYINT NOT NULL DEFAULT 1,
    `fkResponsavelTecnicoId` INTEGER NOT NULL,
    `fkEmpresaId` INTEGER NULL,

    INDEX `fk_curso_fkEmpresaId`(`fkEmpresaId`),
    INDEX `fk_curso_fkResponsavelTecnicoId`(`fkResponsavelTecnicoId`),
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
    `dataInicio` DATETIME(0) NULL,
    `dataConclusao` DATETIME(0) NULL,
    `atualizado_em` DATETIME(0) NOT NULL,

    INDEX `cursoacesso_fkCargoId_fkey`(`fkCargoId`),
    INDEX `cursoacesso_fkEmpresaId_fkey`(`fkEmpresaId`),
    INDEX `cursoacesso_fkSetorId_fkey`(`fkSetorId`),
    INDEX `cursoacesso_fkUnidadeId_fkey`(`fkUnidadeId`),
    INDEX `cursoacesso_fkUsuarioId_fkey`(`fkUsuarioId`),
    UNIQUE INDEX `cursoacesso_fkCursoId_fkEmpresaId_fkUnidadeId_fkSetorId_fkCa_key`(`fkCursoId`, `fkEmpresaId`, `fkUnidadeId`, `fkSetorId`, `fkCargoId`, `fkUsuarioId`),
    UNIQUE INDEX `cursoacesso_fkCursoId_fkUsuarioId_key`(`fkCursoId`, `fkUsuarioId`),
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
    `complemento` VARCHAR(50) NULL,

    PRIMARY KEY (`idEmpresa`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `materialcomplementar` (
    `idMaterialComplementar` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(45) NOT NULL,
    `tipo` ENUM('pdf', 'doc', 'ppt', 'link', 'video', 'outro') NOT NULL,
    `material` TEXT NOT NULL,
    `criado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `editado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ativo` TINYINT NOT NULL DEFAULT 1,
    `fkAulaId` INTEGER NOT NULL,

    INDEX `fk_materialComplementar_fkAulaId`(`fkAulaId`),
    PRIMARY KEY (`idMaterialComplementar`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `materialacesso` (
    `idMaterialAcesso` INTEGER NOT NULL AUTO_INCREMENT,
    `fkUsuarioId` INTEGER NOT NULL,
    `fkMaterialId` INTEGER NOT NULL,
    `visualizado` BOOLEAN NOT NULL DEFAULT false,
    `criado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `materialacesso_fkMaterialId_idx`(`fkMaterialId`),
    UNIQUE INDEX `materialacesso_fkUsuarioId_fkMaterialId_key`(`fkUsuarioId`, `fkMaterialId`),
    PRIMARY KEY (`idMaterialAcesso`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medida` (
    `idMedida` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(45) NOT NULL,
    `tipo` ENUM('epi', 'epc', 'adm', 'treinamento', 'inspecao', 'geral') NOT NULL,
    `descricao` TEXT NULL,
    `ativo` TINYINT NOT NULL DEFAULT 1,
    `fkEmpresaId` INTEGER NULL,

    INDEX `medida_fkEmpresaId_fkey`(`fkEmpresaId`),
    PRIMARY KEY (`idMedida`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medidacurso` (
    `fkMedidaId` INTEGER NOT NULL,
    `fkCursoId` INTEGER NOT NULL,
    `validade` INTEGER NOT NULL,

    INDEX `medidacurso_fkCursoId_fkey`(`fkCursoId`),
    PRIMARY KEY (`fkMedidaId`, `fkCursoId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medidavinculo` (
    `idMedidaVinculo` INTEGER NOT NULL AUTO_INCREMENT,
    `fkMedidaId` INTEGER NOT NULL,
    `fkEmpresaId` INTEGER NULL,
    `fkUnidadeId` INTEGER NULL,
    `fkSetorId` INTEGER NULL,
    `fkCargoId` INTEGER NULL,
    `fkUsuarioId` INTEGER NULL,

    INDEX `medidavinculo_fkCargoId_fkey`(`fkCargoId`),
    INDEX `medidavinculo_fkEmpresaId_fkey`(`fkEmpresaId`),
    INDEX `medidavinculo_fkMedidaId_fkey`(`fkMedidaId`),
    INDEX `medidavinculo_fkSetorId_fkey`(`fkSetorId`),
    INDEX `medidavinculo_fkUnidadeId_fkey`(`fkUnidadeId`),
    INDEX `medidavinculo_fkUsuarioId_fkey`(`fkUsuarioId`),
    PRIMARY KEY (`idMedidaVinculo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `modulo` (
    `idModulo` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(45) NOT NULL,
    `cargaHoraria` INTEGER NOT NULL,
    `criado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `editado_em` DATETIME(0) NOT NULL,
    `ativo` TINYINT NOT NULL DEFAULT 1,
    `ordem` INTEGER NOT NULL,
    `fkCursoId` INTEGER NOT NULL,

    INDEX `fk_modulo_fkCursoId`(`fkCursoId`),
    PRIMARY KEY (`idModulo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `moduloacesso` (
    `idModuloAcesso` INTEGER NOT NULL AUTO_INCREMENT,
    `fkModuloId` INTEGER NOT NULL,
    `fkUsuarioId` INTEGER NOT NULL,
    `percentual` FLOAT NOT NULL DEFAULT 0,
    `concluido` BOOLEAN NOT NULL DEFAULT false,
    `dataConclusao` DATETIME(0) NULL,
    `criado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `editado_em` DATETIME(0) NOT NULL,

    INDEX `moduloacesso_fkUsuarioId_fkey`(`fkUsuarioId`),
    UNIQUE INDEX `moduloacesso_fkModuloId_fkUsuarioId_key`(`fkModuloId`, `fkUsuarioId`),
    PRIMARY KEY (`idModuloAcesso`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pergunta` (
    `idPergunta` INTEGER NOT NULL AUTO_INCREMENT,
    `enunciado` TEXT NOT NULL,
    `tipo` ENUM('multipla', 'dissertativa') NOT NULL,
    `criado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `editado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ativo` TINYINT NOT NULL DEFAULT 1,
    `fkAvaliacaoId` INTEGER NOT NULL,

    INDEX `fk_pergunta_fkAvalicaoId`(`fkAvaliacaoId`),
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
    `assinatura` TEXT NULL,
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

    INDEX `fk_resposta_fkAlternativaId`(`fkAlternativaId`),
    INDEX `fk_resposta_fkAvaliacaoUsuarioId`(`fkAvaliacaoUsuarioId`),
    INDEX `fk_resposta_fkPerguntaId`(`fkPerguntaId`),
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
    `fkUnidadeId` INTEGER NOT NULL,

    INDEX `fk_setor_fkUnidadeId`(`fkUnidadeId`),
    PRIMARY KEY (`idSetor`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `unidade` (
    `idUnidade` INTEGER NOT NULL AUTO_INCREMENT,
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
    `complemento` VARCHAR(50) NULL,

    INDEX `fk_unidade_fkEmpresaId`(`fkEmpresaId`),
    PRIMARY KEY (`idUnidade`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuariorole` (
    `fkUsuarioId` INTEGER NOT NULL,
    `fkRoleId` INTEGER NOT NULL,

    INDEX `fk_usuariorole_fkRoleId`(`fkRoleId`),
    PRIMARY KEY (`fkUsuarioId`, `fkRoleId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `logevento` (
    `idLogEvento` INTEGER NOT NULL AUTO_INCREMENT,
    `fkUsuarioId` INTEGER NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `entidade` VARCHAR(191) NULL,
    `entidade_id` INTEGER NULL,
    `dados_antes` JSON NULL,
    `dados_depois` JSON NULL,
    `criado_em` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_logEvento_fkUsuarioId`(`fkUsuarioId`),
    PRIMARY KEY (`idLogEvento`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuariohorario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `diaSemana` INTEGER NOT NULL,
    `horarioInicio` VARCHAR(191) NOT NULL,
    `horarioFim` VARCHAR(191) NOT NULL,
    `fkUsuarioId` INTEGER NOT NULL,
    `permitido` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `usuarioHorario_fkUsuarioId_diaSemana_key`(`fkUsuarioId`, `diaSemana`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
ALTER TABLE `usuario` ADD CONSTRAINT `fk_usuario_fkCargoId` FOREIGN KEY (`fkCargoId`) REFERENCES `cargo`(`idCargo`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuario` ADD CONSTRAINT `fk_usuario_fkEmpresaId` FOREIGN KEY (`fkEmpresaId`) REFERENCES `empresa`(`idEmpresa`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alternativa` ADD CONSTRAINT `fk_alternativa_fkPerguntaId` FOREIGN KEY (`fkPerguntaId`) REFERENCES `pergunta`(`idPergunta`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aula` ADD CONSTRAINT `fk_aula_fkModuloId` FOREIGN KEY (`fkModuloId`) REFERENCES `modulo`(`idModulo`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aulastep` ADD CONSTRAINT `aulastep_fkAulaId_fkey` FOREIGN KEY (`fkAulaId`) REFERENCES `aula`(`idAula`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aulastep` ADD CONSTRAINT `aulastep_fkAulaVideoId_fkey` FOREIGN KEY (`fkAulaVideoId`) REFERENCES `aulavideo`(`idAulaVideo`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aulastep` ADD CONSTRAINT `aulastep_fkAvaliacaoId_fkey` FOREIGN KEY (`fkAvaliacaoId`) REFERENCES `avaliacao`(`idAvaliacao`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aulastep` ADD CONSTRAINT `aulastep_fkMaterialId_fkey` FOREIGN KEY (`fkMaterialId`) REFERENCES `materialcomplementar`(`idMaterialComplementar`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aulausuario` ADD CONSTRAINT `fk_aulaUsuario_fkAulaId` FOREIGN KEY (`fkAulaId`) REFERENCES `aula`(`idAula`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aulausuario` ADD CONSTRAINT `fk_aulaUsuario_fkUsuarioId` FOREIGN KEY (`fkUsuarioId`) REFERENCES `usuario`(`idUsuario`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aulavideo` ADD CONSTRAINT `fk_aulaVideo_fkAulaId` FOREIGN KEY (`fkAulaId`) REFERENCES `aula`(`idAula`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aulavideoprogresso` ADD CONSTRAINT `aulavideoprogresso_fkUsuarioId_fkey` FOREIGN KEY (`fkUsuarioId`) REFERENCES `usuario`(`idUsuario`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aulavideoprogresso` ADD CONSTRAINT `aulavideoprogresso_fkAulaVideoId_fkey` FOREIGN KEY (`fkAulaVideoId`) REFERENCES `aulavideo`(`idAulaVideo`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacao` ADD CONSTRAINT `fk_avaliacao_fkAulaId` FOREIGN KEY (`fkAulaId`) REFERENCES `aula`(`idAula`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacao` ADD CONSTRAINT `fk_avaliacao_fkCursoId` FOREIGN KEY (`fkCursoId`) REFERENCES `curso`(`idCurso`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacao` ADD CONSTRAINT `fk_avaliacao_fkModuloId` FOREIGN KEY (`fkModuloId`) REFERENCES `modulo`(`idModulo`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacaousuario` ADD CONSTRAINT `fk_avaliacaoUsuario_fkAvaliacaoId` FOREIGN KEY (`fkAvaliacaoId`) REFERENCES `avaliacao`(`idAvaliacao`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacaousuario` ADD CONSTRAINT `fk_avaliacaoUsuario_fkUsuarioId` FOREIGN KEY (`fkUsuarioId`) REFERENCES `usuario`(`idUsuario`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cargo` ADD CONSTRAINT `fk_cargo_fkSetorId` FOREIGN KEY (`fkSetorId`) REFERENCES `setor`(`idSetor`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categoriacurso` ADD CONSTRAINT `categoriacurso_fkCategoriaId_fkey` FOREIGN KEY (`fkCategoriaId`) REFERENCES `categoria`(`idCategoria`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categoriacurso` ADD CONSTRAINT `categoriacurso_fkCursoId_fkey` FOREIGN KEY (`fkCursoId`) REFERENCES `curso`(`idCurso`) ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE `cursoacesso` ADD CONSTRAINT `cursoacesso_fkCargoId_fkey` FOREIGN KEY (`fkCargoId`) REFERENCES `cargo`(`idCargo`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cursoacesso` ADD CONSTRAINT `cursoacesso_fkCursoId_fkey` FOREIGN KEY (`fkCursoId`) REFERENCES `curso`(`idCurso`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cursoacesso` ADD CONSTRAINT `cursoacesso_fkEmpresaId_fkey` FOREIGN KEY (`fkEmpresaId`) REFERENCES `empresa`(`idEmpresa`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cursoacesso` ADD CONSTRAINT `cursoacesso_fkSetorId_fkey` FOREIGN KEY (`fkSetorId`) REFERENCES `setor`(`idSetor`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cursoacesso` ADD CONSTRAINT `cursoacesso_fkUnidadeId_fkey` FOREIGN KEY (`fkUnidadeId`) REFERENCES `unidade`(`idUnidade`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cursoacesso` ADD CONSTRAINT `cursoacesso_fkUsuarioId_fkey` FOREIGN KEY (`fkUsuarioId`) REFERENCES `usuario`(`idUsuario`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `materialcomplementar` ADD CONSTRAINT `fk_materialComplementar_fkAulaId` FOREIGN KEY (`fkAulaId`) REFERENCES `aula`(`idAula`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `materialacesso` ADD CONSTRAINT `materialacesso_fkUsuarioId_fkey` FOREIGN KEY (`fkUsuarioId`) REFERENCES `usuario`(`idUsuario`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `materialacesso` ADD CONSTRAINT `materialacesso_fkMaterialId_fkey` FOREIGN KEY (`fkMaterialId`) REFERENCES `materialcomplementar`(`idMaterialComplementar`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medida` ADD CONSTRAINT `medida_fkEmpresaId_fkey` FOREIGN KEY (`fkEmpresaId`) REFERENCES `empresa`(`idEmpresa`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medidacurso` ADD CONSTRAINT `medidacurso_fkCursoId_fkey` FOREIGN KEY (`fkCursoId`) REFERENCES `curso`(`idCurso`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medidacurso` ADD CONSTRAINT `medidacurso_fkMedidaId_fkey` FOREIGN KEY (`fkMedidaId`) REFERENCES `medida`(`idMedida`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medidavinculo` ADD CONSTRAINT `medidavinculo_fkCargoId_fkey` FOREIGN KEY (`fkCargoId`) REFERENCES `cargo`(`idCargo`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medidavinculo` ADD CONSTRAINT `medidavinculo_fkEmpresaId_fkey` FOREIGN KEY (`fkEmpresaId`) REFERENCES `empresa`(`idEmpresa`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medidavinculo` ADD CONSTRAINT `medidavinculo_fkMedidaId_fkey` FOREIGN KEY (`fkMedidaId`) REFERENCES `medida`(`idMedida`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medidavinculo` ADD CONSTRAINT `medidavinculo_fkSetorId_fkey` FOREIGN KEY (`fkSetorId`) REFERENCES `setor`(`idSetor`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medidavinculo` ADD CONSTRAINT `medidavinculo_fkUnidadeId_fkey` FOREIGN KEY (`fkUnidadeId`) REFERENCES `unidade`(`idUnidade`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medidavinculo` ADD CONSTRAINT `medidavinculo_fkUsuarioId_fkey` FOREIGN KEY (`fkUsuarioId`) REFERENCES `usuario`(`idUsuario`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `modulo` ADD CONSTRAINT `fk_modulo_fkCursoId` FOREIGN KEY (`fkCursoId`) REFERENCES `curso`(`idCurso`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `moduloacesso` ADD CONSTRAINT `moduloacesso_fkModuloId_fkey` FOREIGN KEY (`fkModuloId`) REFERENCES `modulo`(`idModulo`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `moduloacesso` ADD CONSTRAINT `moduloacesso_fkUsuarioId_fkey` FOREIGN KEY (`fkUsuarioId`) REFERENCES `usuario`(`idUsuario`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pergunta` ADD CONSTRAINT `fk_pergunta_fkAvalicaoId` FOREIGN KEY (`fkAvaliacaoId`) REFERENCES `avaliacao`(`idAvaliacao`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resposta` ADD CONSTRAINT `fk_resposta_fkAlternativaId` FOREIGN KEY (`fkAlternativaId`) REFERENCES `alternativa`(`idAlternativa`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resposta` ADD CONSTRAINT `fk_resposta_fkAvaliacaoUsuarioId` FOREIGN KEY (`fkAvaliacaoUsuarioId`) REFERENCES `avaliacaousuario`(`idAvaliacaoUsuario`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resposta` ADD CONSTRAINT `fk_resposta_fkPerguntaId` FOREIGN KEY (`fkPerguntaId`) REFERENCES `pergunta`(`idPergunta`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rolepermissao` ADD CONSTRAINT `fk_rolepermissao_fkPermissaoId` FOREIGN KEY (`fkPermissaoId`) REFERENCES `permissao`(`idPermissao`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rolepermissao` ADD CONSTRAINT `fk_rolepermissao_fkRoleId` FOREIGN KEY (`fkRoleId`) REFERENCES `role`(`idRole`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `setor` ADD CONSTRAINT `fk_setor_fkUnidadeId` FOREIGN KEY (`fkUnidadeId`) REFERENCES `unidade`(`idUnidade`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `unidade` ADD CONSTRAINT `fk_unidade_fkEmpresaId` FOREIGN KEY (`fkEmpresaId`) REFERENCES `empresa`(`idEmpresa`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuariorole` ADD CONSTRAINT `fk_usuariorole_fkRoleId` FOREIGN KEY (`fkRoleId`) REFERENCES `role`(`idRole`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuariorole` ADD CONSTRAINT `fk_usuariorole_fkUsuarioId` FOREIGN KEY (`fkUsuarioId`) REFERENCES `usuario`(`idUsuario`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `logevento` ADD CONSTRAINT `fk_logEvento_fkUsuarioId` FOREIGN KEY (`fkUsuarioId`) REFERENCES `usuario`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuariohorario` ADD CONSTRAINT `usuarioHorario_fkUsuarioId_fkey` FOREIGN KEY (`fkUsuarioId`) REFERENCES `usuario`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificado` ADD CONSTRAINT `certificado_fkUsuarioId_fkey` FOREIGN KEY (`fkUsuarioId`) REFERENCES `usuario`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificado` ADD CONSTRAINT `certificado_fkCursoId_fkey` FOREIGN KEY (`fkCursoId`) REFERENCES `curso`(`idCurso`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificado` ADD CONSTRAINT `certificado_fkEmpresaId_fkey` FOREIGN KEY (`fkEmpresaId`) REFERENCES `empresa`(`idEmpresa`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `certificadoempresa` ADD CONSTRAINT `certificadoempresa_fkEmpresaId_fkey` FOREIGN KEY (`fkEmpresaId`) REFERENCES `empresa`(`idEmpresa`) ON DELETE RESTRICT ON UPDATE CASCADE;
