import puppeteer from "puppeteer";
import { prisma } from "../../config/prisma-client";
import { formatarCpf } from "../../auxiliares/formatter";
import { format } from "date-fns";
import https from "https";

export interface DadosCertificado {
  curso: string;
  aluno: string;
  cargaHoraria: number;
  dataConclusao: string;
  instrutor?: string;
  empresa?: string;
  idEmpresa?: number;
  assinatura?: string;
}

export const listarCertificados = {
  async execute(usuario: any) {
    const isGestor =
      usuario.roles?.includes("gestor")

    let certificados: any[] = [];

    if (isGestor) {
      if (!usuario.fkEmpresaId) {
        throw new Error("Empresa do usuário não identificada.");
      }

      certificados = await prisma.certificado.findMany({
        where: {
          empresa: { idEmpresa: usuario.fkEmpresaId },
        },
        include: {
          curso: {
            select: {
              idCurso: true,
              titulo: true,
              cargaHoraria: true,
            },
          },
          usuario: {
            select: {
              idUsuario: true,
              nome: true,
            },
          },
          empresa: {
            select: {
              idEmpresa: true,
              nomeFantasia: true,
            },
          },
        },
        orderBy: { dataGeracao: "desc" },
      });
    } else {
      // === Funcionário vê apenas os dele ===
      certificados = await prisma.certificado.findMany({
        where: { fkUsuarioId: usuario.idUsuario },
        include: {
          curso: {
            select: {
              idCurso: true,
              titulo: true,
              cargaHoraria: true,
            },
          },
          empresa: {
            select: {
              idEmpresa: true,
              nomeFantasia: true,
            },
          },
        },
        orderBy: { dataGeracao: "desc" },
      });
    }

    return certificados.map((c) => ({
      idCertificado: c.idCertificado,
      codigo: c.codigo,
      curso: c.curso?.titulo,
      cargaHoraria: c.curso?.cargaHoraria,
      empresa: c.empresa?.nomeFantasia,
      funcionario: c.usuario?.nome ?? usuario.nome,
      dataGeracao: c.dataGeracao.toLocaleDateString("pt-BR"),
      valido: c.valido,
      urlArquivo: c.urlArquivo,
      fkUsuarioId: c.fkUsuarioId,
      fkCursoId: c.fkCursoId,
      fkEmpresaId: c.fkEmpresaId,
    }));
  },
};

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
                empresa: { select: { nomeFantasia: true, idEmpresa: true } }
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
                duracao: true,
                descricao: true,
                ordem: true,
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
      idEmpresa: acesso.usuario?.empresa?.idEmpresa,
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
        assinatura: curso.responsaveltecnico.assinatura
      },
      modulos: curso.modulos.map(m => ({
        titulo: m.titulo,
        aulas: m.aulas.map(a => ({
          titulo: a.titulo,
          duracao: a.duracao,
          ordem: a.ordem,
          descricao: a.descricao
        }))
      }))
    };
  }
};

export const gerarCertificado = {
  async execute(dados: any, usuario: any) {
    const fkUsuarioId = dados.idUsuario ?? usuario.idUsuario; // ✅ Usa funcionário se informado
    const fkCursoId = dados.idCurso;
    const fkEmpresaId = dados.idEmpresa ?? usuario.fkEmpresaId;

    // 1️⃣ Verifica se já existe certificado válido para esse funcionário e curso
    const existente = await prisma.certificado.findFirst({
      where: {
        fkUsuarioId,
        fkCursoId,
        valido: true,
      },
    });

    if (existente) {
      return existente;
    }

    // 2️⃣ Gera código único
    const codigo = `CERT-${Date.now()}`;

    // 3️⃣ Cria o certificado
    const certificado = await prisma.certificado.create({
      data: {
        codigo,
        fkUsuarioId,
        fkCursoId,
        fkEmpresaId,
        dataGeracao: new Date(),
      },
    });

    // 4️⃣ Atualiza contagem mensal da empresa
    const competencia = format(new Date(), "MM/yyyy");

    await prisma.certificadoempresa.upsert({
      where: { fkEmpresaId_competencia: { fkEmpresaId, competencia } },
      update: { totalGerados: { increment: 1 } },
      create: { fkEmpresaId, competencia, totalGerados: 1 },
    });

    return certificado;
  },
};

async function toBase64FromUrl(url: string): Promise<string> {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      const chunks: any[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const buffer = Buffer.concat(chunks);
        const base64 = buffer.toString("base64");
        resolve(`data:image/png;base64,${base64}`);
      });
    }).on("error", (err) => {
      console.warn(`⚠️ Falha ao carregar imagem: ${url}`);
      resolve("");
    });
  });
}

export async function gerarCertificadoPdf(dados: any): Promise<Buffer> {
  // 🔹 Converte a logo Saber e a assinatura (se houver)
  const logoUrl =
    "https://firebasestorage.googleapis.com/v0/b/ava-cursos-fdbbb.firebasestorage.app/o/logotipo.png?alt=media&token=92083743-f4cf-4033-b579-c824c805c31f";
  const logoBase64 = await toBase64FromUrl(logoUrl);

  const assinaturaBase64 = dados.instrutor?.assinatura
    ? await toBase64FromUrl(dados.instrutor.assinatura)
    : null;

  // 🔹 Monta o HTML
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
          .container-programa {
            padding: 30px 50px;
            height: auto !important;
          }
          .logo {
            width: 160px;
            margin: 0 auto 20px auto;
            display: block;
          }
          .titulo {
            font-size: 36px;
            font-weight: bold;
            color: #0069A8;
            margin-bottom: 20px;
          }
          .subtitulo {
            font-size: 20px;
            margin-bottom: 10px;
          }
          .nome-aluno {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
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
          .assinatura img {
            display: block;
            margin: 0 auto 5px auto;
            width: 220px;
            height: auto;
          }
          .linha {
            border-top: 1px solid #000;
            width: 70%;
            margin: 0 auto 1px auto;
          }
          .rodape {
            margin-top: 60px;
            font-size: 14px;
            color: #444;
            font-weight: 500;
          }
          .rodape strong {
            color: #0069A8;
          }
        </style>
      </head>
      <body>
        <div class="container">

          <!-- LOGO SABER -->
          ${logoBase64
      ? `<img src="${logoBase64}" class="logo" alt="Saber Seguro Treinamentos"/>`
      : "<div style='height:160px;'></div>"
    }

          <div class="titulo">Certificado de Conclusão</div>
          <div class="subtitulo">Nós da Saber Seguro Treinamentos certificamos que:</div>

          <div class="nome-aluno">${dados.nomeAluno}</div>

          <div class="texto">
            Funcionário(a) da empresa <strong>${dados.empresaAluno}</strong>, portador do CPF <strong>${formatarCpf(
      dados.cpf
    )}</strong>, concluiu com êxito o curso <strong>${dados.curso}</strong>, com carga horária de <strong>${dados.cargaHoraria
    }</strong>, finalizado em <strong>${dados.dataConclusao}</strong>.
          </div>

          ${dados.empresa
      ? `<div class="texto">Curso promovido por: <strong>${dados.empresa}</strong></div>`
      : ""
    }

          <!-- Assinaturas -->
          <div class="assinaturas">
            <div class="assinatura">
              ${assinaturaBase64
      ? `<img src="${assinaturaBase64}" alt="Assinatura do instrutor" />`
      : `<div class="linha"></div>`
    }
              <div class="linha"></div>
              ${dados.instrutor
      ? `<div class="textoAssinatura">Instrutor Responsável: <strong>${dados.instrutor.nome}</strong></div>`
      : ""
    }
              ${dados.instrutor
      ? `<div class="subTextoAssinatura">${dados.instrutor.funcao}: ${dados.instrutor.registro}</div>`
      : ""
    }
            </div>
          </div>

          <div class="rodape">
            Emitido por <strong>Saber Seguro Treinamentos</strong>
          </div>
        </div>

        <!-- Página 2: Conteúdo Programático -->
        <div class="container container-programa" style="page-break-before: always;">
          <div class="titulo">Conteúdo Programático</div>
          <div style="text-align: left; max-width: 80%; margin: 40px auto;">
            ${dados.modulos
      .map(
        (m: any, i: number) => {
          // 🔹 Ordena as aulas pela ordem
          const aulasOrdenadas = [...m.aulas].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

          return `
                    <div style="margin-top: 25px;">
                      <div style="font-size: 20px; font-weight: bold; color: #0069A8; margin-bottom: 10px;">
                        Módulo ${i + 1} - ${m.titulo}
                      </div>
                      <ul style="margin-left: 25px; font-size: 16px; line-height: 1.6;">
                        ${aulasOrdenadas
              .map((a: any) => {
                // 🔹 Converte duração (minutos → horas e minutos)
                let duracaoTexto = "";
                if (a.duracao != null) {
                  const minutos = Number(a.duracao);
                  if (minutos < 60) {
                    duracaoTexto = `${minutos} min`;
                  } else {
                    const horas = Math.floor(minutos / 60);
                    const restoMin = minutos % 60;
                    duracaoTexto = restoMin > 0 ? `${horas}h ${restoMin}min` : `${horas}h`;
                  }
                }

                return `
                              <li style="margin-bottom: 8px;">
                                <strong>${a.titulo}</strong>
                                ${duracaoTexto ? `<span style="color:#555; font-size:14px;">(${duracaoTexto})</span>` : ""}
                                ${a.descricao
                    ? `<div style="font-size:14px; color:#666;">${a.descricao}</div>`
                    : ""
                  }
                              </li>
                            `;
              })
              .join("")}
                      </ul>
                    </div>
                  `;
        }
      )
      .join("")}
          </div>
        </div>
      </body>
    </html>
  `;

  // 🔹 Geração do PDF com segurança
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle2" });
  const pdf = await page.pdf({
    format: "A4",
    landscape: true,
    printBackground: true,
    margin: { top: "40px", bottom: "40px", left: "40px", right: "40px" },
  });
  await browser.close();

  return Buffer.from(pdf);
}