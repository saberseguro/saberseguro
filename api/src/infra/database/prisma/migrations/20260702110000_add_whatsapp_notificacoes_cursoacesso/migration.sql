ALTER TABLE `cursoacesso`
  ADD COLUMN `ultimaNotificacaoWhatsapp` DATETIME(0) NULL,
  ADD COLUMN `qtdNotificacoesWhatsapp` INTEGER NOT NULL DEFAULT 0;
