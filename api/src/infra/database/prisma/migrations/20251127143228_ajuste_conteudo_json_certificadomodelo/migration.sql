/*
  Warnings:

  - You are about to alter the column `conteudoHtml` on the `certificadomodelo` table. The data in that column could be lost. The data in that column will be cast from `LongText` to `Json`.

*/
-- AlterTable
ALTER TABLE `certificadomodelo` MODIFY `conteudoHtml` JSON NOT NULL;
