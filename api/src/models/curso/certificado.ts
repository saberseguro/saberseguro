import puppeteer from "puppeteer";
import { prisma } from "../../config/prisma-client";
import { formatarCpf } from "../../auxiliares/formatter";
import { format } from "date-fns";
import https from "https";
import { registrarEvento } from "../../shared/utils/registrarEvento";

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

export function formatarMinutosEmHoras(min?: number): string {
  const minutes = Number.isFinite(min) && (min as number) >= 0 ? (min as number) : 0;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}min`;
  if (h) return `${h}h`;
  return `${m}min`;
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

export const previewCertificado = {
  async execute(idCertificado: number, usuario: any) {
    // 🔹 Busca o certificado
    const certificado = await prisma.certificado.findUnique({
      where: { idCertificado },
      include: {
        curso: {
          include: {
            empresa: true,
            responsaveltecnico: true,
            categorias: { include: { categoria: true } },
            modulos: {
              orderBy: { ordem: "asc" },
              include: {
                aulas: {
                  orderBy: { ordem: "asc" },
                  include: {
                    steps: {
                      include: {
                        avaliacao: {
                          include: {
                            perguntas: { include: { alternativas: true } },
                            avaliacoesUsuarios: {
                              where: { fkUsuarioId: usuario.idUsuario },
                            },
                          },
                        },
                      },
                    },
                    materiais: true,
                    videos: true,
                    aulausuarios: {
                      where: { fkUsuarioId: usuario.idUsuario },
                    },
                  },
                },
                avaliacoes: {
                  include: {
                    perguntas: { include: { alternativas: true } },
                    avaliacoesUsuarios: {
                      where: { fkUsuarioId: usuario.idUsuario },
                    },
                  },
                },
              },
            },
            avaliacoes: {
              include: {
                perguntas: { include: { alternativas: true } },
                avaliacoesUsuarios: {
                  where: { fkUsuarioId: usuario.idUsuario },
                },
              },
            },
            acessos: {
              where: { fkUsuarioId: usuario.idUsuario },
              select: {
                concluido: true,
                dataConclusao: true,
              },
            },
          },
        },
        usuario: {
          select: {
            idUsuario: true,
            nome: true,
            cpf: true,
            assinatura: true,
            empresa: {
              select: {
                idEmpresa: true,
                nomeFantasia: true,
              },
            },
          },
        },
      },
    });

    if (!certificado) {
      throw new Error("Certificado não encontrado.");
    }

    const isDono = certificado.fkUsuarioId === usuario.idUsuario;
    const roles: string[] = usuario.roles || [];
    const isGestor = roles.includes("admin") || roles.includes("gestor");

    if (!isDono && !isGestor) {
      throw new Error("Você não tem permissão para visualizar este certificado.");
    }

    const curso = certificado.curso;
    const acesso = curso.acessos?.[0];

    if (!curso || !acesso || acesso.concluido !== 1) {
      throw new Error("Curso não concluído ou dados incompletos.");
    }

    // 🔹 Monta os dados organizados
    const dadosOrganizados = {
      curso: {
        idCurso: curso.idCurso,
        titulo: curso.titulo,
        cargaHoraria: curso.cargaHoraria,
        avaliacoes: !!curso.avaliacoes?.length,
        grade: curso.modulos.map((m) => ({
          idModulo: m.idModulo,
          titulo: m.titulo,
          avaliacao: !!m.avaliacoes?.length,
          aulas: m.aulas.map((a) => ({
            idAula: a.idAula,
            titulo: a.titulo,
            descricao: a.descricao,
            ordem: a.ordem,
            avaliacao: !!a.steps?.some((s) => s.avaliacao),
          })),
        })),
      },
      empresa: {
        idEmpresa: curso.empresa?.idEmpresa,
        nomeFantasia: curso.empresa?.nomeFantasia,
        tipoDocumento: curso.empresa?.tipoDocumento,
        documento: curso.empresa?.documento,
      },
      usuario: {
        idUsuario: certificado.usuario?.idUsuario,
        nome: certificado.usuario?.nome,
        cpf: certificado.usuario?.cpf,
        assinatura: certificado.usuario?.assinatura,
        empresa: certificado.usuario?.empresa?.nomeFantasia,
      },
      instrutor: {
        nome: curso.responsaveltecnico?.nome,
        funcao: curso.responsaveltecnico?.funcao,
        registro: curso.responsaveltecnico?.registro,
        assinatura: curso.responsaveltecnico?.assinatura,
      },
      certificado: {
        idCertificado: certificado.idCertificado,
        codigo: certificado.codigo,
        dataGeracao: new Date(certificado.dataGeracao ?? new Date()).toLocaleDateString("pt-BR"),
      },
    };

    // 🔹 Gera o PDF base64
    const pdfBuffer = await gerarCertificadoPdf(dadosOrganizados);
    const pdfBase64 = pdfBuffer.toString("base64");

    return { pdfBase64: pdfBase64 };
  },
};

export const gerarCertificado = {
  async execute(dados: any, usuario: any) {
    const fkUsuarioId = dados.idUsuario ?? usuario.idUsuario;
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
      console.log("Certificado existente", existente);
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

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: "gerar_certificado",
      entidade: "certificado",
      entidadeId: certificado.idCertificado,
      descricao: `Certificado ${certificado.codigo} criado.`,
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

  const assinaturaInstrutorBase64 = dados.instrutor?.assinatura
    ? await toBase64FromUrl(dados.instrutor.assinatura)
    : null;

  const assinaturaUsuarioBase64 = dados.usuario?.assinatura
    ? await toBase64FromUrl(dados.usuario.assinatura)
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
          .assinaturas {
            display: flex;
            justify-content: center;
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

          /* --- Página 2 --- */
          .programa-titulo {
            font-size: 26px;
            font-weight: bold;
            color: #0069a8;
            text-align: center;
            margin-bottom: 30px;
          }

          .programa-corpo {
            max-width: 90%;
            margin: 0 auto;
            text-align: left;
            color: #222;
            font-family: Arial, sans-serif;
          }

          .secao-titulo {
            font-size: 18px;
            font-weight: bold;
            color: #0069a8;
            margin-bottom: 10px;
          }

          .modulo-bloco {
            margin-bottom: 15px;
          }

          .modulo-titulo {
            font-size: 16px;
            font-weight: bold;
            color: #0069a8;
            margin-bottom: 8px;
          }

          .aula-bloco {
            margin-left: 25px;
            margin-bottom: 8px;
          }

          .aula-titulo {
            font-size: 15px;
            font-weight: 600;
            color: #333;
          }

          .aula-descricao {
            font-size: 14px;
            color: #555;
            margin-left: 15px;
            margin-top: 2px;
            line-height: 1.4;
          }

          .avaliacoes-bloco {
            margin-left: 15px;
            margin-top: 5px;
          }

          .avaliacoes-titulo {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 2px;
          }

          .avaliacao-item {
            font-size: 14px;
            color: #555;
            margin-left: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${logoBase64 ? `<img src="${logoBase64}" class="logo" />` : ""}
          <div class="titulo">Certificado de Conclusão</div>
          <div class="subtitulo">Nós da Saber Seguro Treinamentos certificamos que:</div>
          <div class="nome-aluno">${dados.usuario?.nome}</div>

          <div class="texto">
            Funcionário(a) da empresa <strong>${dados.usuario?.empresa}</strong>,
            portador do CPF <strong>${formatarCpf(dados.usuario?.cpf)}</strong>,
            concluiu com êxito o curso <strong>${dados.curso?.titulo}</strong>,
            com carga horária de <strong>${formatarMinutosEmHoras(dados.curso?.cargaHoraria)}</strong>,
            finalizado em <strong>${dados.certificado?.dataGeracao}</strong>.
          </div>

          ${dados.empresa?.nomeFantasia
      ? `<div class="texto">Curso promovido por: <strong>${dados.empresa.nomeFantasia}</strong></div>`
      : ""
    }

          <div class="assinaturas">
            <!-- Assinatura do Instrutor -->
            <div class="assinatura">
              ${assinaturaInstrutorBase64
      ? `<img src="${assinaturaInstrutorBase64}" alt="Assinatura do instrutor" />`
      : `<div class="linha"></div>`
    }
              <div class="linha"></div>
              ${dados.instrutor
      ? `
                    <div>Instrutor Responsável: <strong>${dados.instrutor.nome}</strong></div>
                    <div>${dados.instrutor.funcao}: ${dados.instrutor.registro}</div>
                  `
      : ""
    }
            </div>

            <!-- Assinatura do Funcionario -->
            <div class="assinatura">
              ${assinaturaUsuarioBase64
      ? `<img src="${assinaturaUsuarioBase64}" alt="Assinatura do Funcionário" />`
      : `<div class="linha"></div>`
    }
              <div class="linha"></div>
              ${dados.empresa
      ? `
                    <div>Funcionário: <strong>${dados.usuario.nome}</strong></div>
                  `
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
          <div class="programa-titulo">CONTEÚDO PROGRAMÁTICO</div>

          <div class="programa-corpo" style="display: flex; gap: 60px;">
            <div style="flex: 1;">
              <div class="secao-titulo">Item 5.1</div>
              <ul style="font-size: 12px; line-height: 1.6; padding-left: 18px;">
                <li>a) riscos de exposição ao benzeno e vias de absorção;</li>
                <li>b) conceitos básicos sobre monitoramento ambiental, biológico e de saúde;</li>
                <li>c) sinais e sintomas de intoxicação ocupacional por benzeno;</li>
                <li>d) medidas de prevenção;</li>
                <li>e) procedimentos de emergência;</li>
                <li>f) caracterização básica das instalações, atividades de risco e pontos de possíveis emissões de benzeno;</li>
                <li>g) dispositivos legais sobre o benzeno.</li>
              </ul>
            </div>

            <div style="flex: 1;">
              <div class="secao-titulo">Item 5.1.1</div>
              <ul style="font-size: 12px; line-height: 1.6; padding-left: 18px;">
                <li>a) conferência do produto no caminhão-tanque no ato do descarregamento;</li>
                <li>b) coleta de amostras no caminhão-tanque com amostrador específico;</li>
                <li>c) medição volumétrica de tanque subterrâneo com régua;</li>
                <li>d) estacionamento do caminhão, aterramento e conexão via mangotes aos tanques subterrâneos;</li>
                <li>e) descarregamento de combustíveis para os tanques subterrâneos;</li>
                <li>f) desconexão dos mangotes e retirada do conteúdo residual;</li>
                <li>g) abastecimento de combustível para veículos;</li>
                <li>h) abastecimento de combustíveis em recipientes certificados;</li>
                <li>i) análises físico-químicas para o controle de qualidade dos produtos comercializados;</li>
                <li>j) limpeza de válvulas, bombas e seus compartimentos de contenção de vazamentos;</li>
                <li>k) esgotamento e limpeza de caixas separadoras;</li>
                <li>l) limpeza de caixas de passagem e canaletas;</li>
                <li>m) aferição de bombas de abastecimento;</li>
                <li>n) manutenção operacional de bombas;</li>
                <li>o) manutenção e reforma do sistema de abastecimento subterrâneo de combustível (SASC);</li>
                <li>p) outras operações e atividades passíveis de exposição ao benzeno.</li>
              </ul>
            </div>
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


// <!-- Página 2: Conteúdo Programático -->
//         <div class="container container-programa" style="page-break-before: always;">
//           <div class="programa-titulo">Conteúdo Programático</div>

//           <div class="programa-corpo">

//             ${dados.curso?.grade
//       ?.map((m: any, i: number) => {
//         const aulasOrdenadas = [...m.aulas].sort(
//           (a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)
//         );

//         return `
//                   <div class="modulo-bloco">
//                     <div class="modulo-titulo">Módulo ${m.titulo}</div>

//                     ${aulasOrdenadas
//             .map(
//               (a: any, j: number) => `
//                         <div class="aula-bloco">
//                           <div class="aula-titulo">${a.titulo}</div>
//                           ${a.descricao
//                   ? `<div class="aula-descricao">${a.descricao}</div>`
//                   : ""
//                 }
//                           ${a.avaliacao
//                   ? `
//                                 <div class="avaliacoes-bloco">
//                                   <div class="avaliacoes-titulo">Avaliações:</div>
//                                   <div class="avaliacao-item">Avaliação da aula</div>
//                                 </div>
//                               `
//                   : ""
//                 }
//                         </div>
//                       `
//             )
//             .join("")}

//                     ${m.avaliacao
//             ? `
//                           <div class="avaliacoes-bloco">
//                             <div class="avaliacoes-titulo">Avaliações:</div>
//                             <div class="avaliacao-item">Avaliação do módulo</div>
//                           </div>
//                         `
//             : ""
//           }
//                   </div>
//                 `;
//       })
//       .join("")}

//             ${dados.curso?.avaliacoes
//       ? `
//                   <div class="modulo-titulo">Avaliações do Curso:</div>
//                   <div class="avaliacao-item">Avaliação final do curso</div>
//                 `
//       : ""
//     }
//           </div>
//         </div>