import puppeteer from "puppeteer";
import { prisma } from "../../config/prisma-client";
import { formatarCpf } from "../../auxiliares/formatter";

export interface DadosCertificado {
  curso: string;
  aluno: string;
  cargaHoraria: number;
  dataConclusao: string;
  instrutor?: string;
  empresa?: string;
}

export const getCertificadoPreview = {
  async execute(idCurso: number, idUsuario: number) {
    const curso = await prisma.curso.findUnique({
      where: { idCurso },
      include: {
        acessos: {
          where: { fkUsuarioId: idUsuario },
          select: {
            concluido: true,
            dataConclusao: true,
            usuario: {
              select: {
                nome: true,
                cpf: true,
                empresa: { select: { nomeFantasia: true } }
              }
            }
          }
        },
        responsaveltecnico: true,
        empresa: true,
        modulos: {
          include: {
            aulas: {
              select: {
                idAula: true,
                titulo: true,
                duracao: true
              }
            }
          }
        }
      }
    });


    const acesso = curso?.acessos?.[0];

    if (!curso || !acesso || acesso.concluido !== 1) return null;


    return {
      nomeAluno: acesso.usuario?.nome,
      cpf: acesso.usuario?.cpf,
      empresaAluno: acesso.usuario?.empresa?.nomeFantasia ?? undefined,
      curso: curso.titulo,
      cargaHoraria: `${curso.cargaHoraria}h`,
      dataConclusao: new Date(acesso.dataConclusao ?? new Date()).toLocaleDateString("pt-BR"),
      empresaPromotora: curso.empresa?.nomeFantasia,
      tipoDocumento: curso.empresa?.tipoDocumento,
      documento: curso.empresa?.documento,
      instrutor: {
        nome: curso.responsaveltecnico.nome,
        funcao: curso.responsaveltecnico.funcao,
        registro: curso.responsaveltecnico.registro,
      },
      modulos: curso.modulos.map(m => ({
        titulo: m.titulo,
        aulas: m.aulas.map(a => ({
          titulo: a.titulo,
          duracao: a.duracao
        }))
      }))
    };
  }
};

export async function gerarCertificadoPdf(dados: any): Promise<Buffer> {
  const html = `
    <html lang="pt-br">
      <head>
        <meta charset="UTF-8" />
        <style>
          @page { size: A4 landscape; margin: 40px; }
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            background: #fff;
            color: #333;
          }
          .container {
            border: 10px solid #0069A8;
            padding: 50px;
            margin: auto;
            width: 100%;
            height: 100%;
            box-sizing: border-box;
            position: relative;
          }
          .titulo {
            font-size: 36px;
            font-weight: bold;
            color: #0069A8;
            margin-bottom: 20px;
          }
          .subtitulo {
            font-size: 20px;
            margin-bottom: 40px;
          }
          .nome-aluno {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .texto {
            font-size: 18px;
            line-height: 1.8;
            margin-bottom: 20px;
          }
          .textoAssinatura {
            font-size: 16px;
            line-height: 1.8;
          }
          .subTextoAssinatura {
            font-size: 14px;
            line-height: 1.8;
            margin-bottom: 20px;
          }
          .assinaturas {
            display: flex;
            justify-content: space-around;
            margin-top: 80px;
          }
          .assinatura {
            width: 60%;
            text-align: center;
            font-size: 16px;
          }
          .assinatura .linha {
            border-top: 1px solid #000;
            margin: 60px 0 10px;
          }
          .rodape {
            margin-top: 40px;
            font-size: 14px;
            color: #777;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="titulo">Certificado de Conclusão</div>
          <div class="subtitulo">Certificamos que:</div>
          <div class="nome-aluno">${dados.nomeAluno}</div>
          <div class="texto">
            Funcionário(a) da empresa <strong>${dados.empresaAluno}</strong>, portador do CPF <strong>${formatarCpf(dados.cpf)}</strong>, concluiu com êxito o curso <strong>${dados.curso}</strong>, com carga horária de <strong>${dados.cargaHoraria}</strong>, finalizado em <strong>${dados.dataConclusao}</strong>.
          </div>
          ${dados.empresa ? `<div class="texto">Curso promovido por: <strong>${dados.empresa}</strong></div>` : ""}

          <!-- Assinaturas -->
          <div class="assinaturas">
            <div class="assinatura">
              <div class="linha"></div>
              ${dados.instrutor ? `<div class="textoAssinatura">Instrutor Responsável: <strong>${dados.instrutor?.nome}</strong></div>` : ""}
              ${dados.instrutor ? `<div class="subTextoAssinatura">${dados.instrutor?.funcao}: ${dados.instrutor?.registro}</div>` : ""}
            </div>
          </div>
        </div>
        <div class="container" style="page-break-before: always;">
        <div class="titulo">Conteúdo Programático</div>
        <div style="text-align: left; max-width: 80%; margin: 40px auto;">

          ${dados.modulos.map((m: any, i: number) => `
            <div style="margin-top: 25px;">
              <div style="font-size: 20px; font-weight: bold; color: #0069A8; margin-bottom: 10px;">
                Módulo ${i + 1} - ${m.titulo}
              </div>
              <ul style="margin-left: 25px; font-size: 16px; line-height: 1.6;">
                ${m.aulas.map((a: any) => `
                  <li>${a.titulo} <span style="color:#555;">(${a.duracao}h)</span></li>
                `).join("")}
              </ul>
            </div>
          `).join("")}

        </div>
      </div>
      </body>
    </html>
  `;

  const locationBrowser = process.env.LOCATION_BROWSER
    ? JSON.parse(process.env.LOCATION_BROWSER)
    : {};

  const browser = await puppeteer.launch(locationBrowser);
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdf = await page.pdf({
    format: "A4",
    landscape: true,
    printBackground: true,
    margin: { top: "40px", bottom: "40px", left: "40px", right: "40px" }
  });
  await browser.close();
  return Buffer.from(pdf);
}