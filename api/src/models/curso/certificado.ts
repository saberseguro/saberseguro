import puppeteer from "puppeteer";
import { prisma } from "../../config/prisma-client";
import { formatarCpf } from "../../auxiliares/formatter";
import { format } from "date-fns";
import https from "https";
import { registrarEvento } from "../../shared/utils/registrarEvento";
import { cert } from "firebase-admin/app";

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

// Modelos de certificados
export const buscarModeloCertificado = {
  async execute(id: number, usuario: any) {
    const modelo = await prisma.certificadomodelo.findUnique({
      where: { idCertificadoModelo: id },
      include: {
        empresa: {
          select: {
            idEmpresa: true,
            nomeFantasia: true,
          },
        },
        cursos: {
          select: {
            idCurso: true,
            titulo: true,
          },
        },
      },
    });

    if (!modelo) {
      throw new Error("Modelo de certificado não encontrado.");
    }

    const isAdmin = usuario.roles?.includes("admin");
    const isGestor = usuario.roles?.includes("gestor");

    if (isGestor && modelo.fkEmpresaId !== usuario.fkEmpresaId && modelo.tipoEscopo !== "global") {
      throw new Error("Você não tem permissão para visualizar este modelo.");
    }

    return {
      idCertificadoModelo: modelo.idCertificadoModelo,
      titulo: modelo.titulo,
      conteudoHtml: modelo.conteudoHtml,
      tipoEscopo: modelo.tipoEscopo,
      empresa: modelo.empresa ? {
        idEmpresa: modelo.empresa.idEmpresa,
        nomeFantasia: modelo.empresa.nomeFantasia,
      } : null,
      cursosVinculados: modelo.cursos.map((c) => ({
        idCurso: c.idCurso,
        titulo: c.titulo,
      })),
      criadoEm: modelo.criadoEm.toLocaleDateString("pt-BR"),
    };
  },
};

export const listarModelosCertificado = {
  async execute(usuario: any) {
    const isGestor = usuario.roles?.includes("gestor");
    const isAdmin = usuario.roles?.includes("admin");

    if (!isGestor && !isAdmin) {
      throw new Error("Usuário sem permissão para visualizar modelos de certificado.");
    }

    const where: any = {
      ativo: 1,
    };

    if (isGestor) {
      if (!usuario.fkEmpresaId) {
        throw new Error("Empresa do usuário não identificada.");
      }

      where.OR = [
        { tipoEscopo: "global" },
        { fkEmpresaId: usuario.fkEmpresaId },
      ];
    }

    if (isAdmin) {
      // Admin vê todos; pode ter filtro depois se quiser
    }

    const modelos = await prisma.certificadomodelo.findMany({
      where,
      orderBy: { criadoEm: "desc" },
      include: {
        empresa: {
          select: {
            idEmpresa: true,
            nomeFantasia: true,
          },
        },
        cursos: {
          select: {
            idCurso: true,
            titulo: true,
          },
        },
      },
    });

    return modelos.map((m) => ({
      idCertificadoModelo: m.idCertificadoModelo,
      titulo: m.titulo,
      tipoEscopo: m.tipoEscopo,
      empresa: m.empresa ? {
        idEmpresa: m.empresa.idEmpresa,
        nomeFantasia: m.empresa.nomeFantasia,
      } : null,
      cursosVinculados: m.cursos.map((c) => ({
        idCurso: c.idCurso,
        titulo: c.titulo,
      })),
      criadoEm: m.criadoEm.toLocaleDateString("pt-BR"),
    }));
  },
};

export const criarModeloCertificado = {
  async execute(dados: any, usuario: any) {
    const isAdmin = usuario.roles?.includes("admin");
    const isGestor = usuario.roles?.includes("gestor");

    if (!isAdmin && !isGestor) {
      throw new Error("Usuário sem permissão para criar modelos de certificado.");
    }

    let tipoEscopo: "global" | "empresa" = "empresa";
    let fkEmpresaId: number | null = usuario.fkEmpresaId ?? null;

    if (isAdmin) {
      tipoEscopo = "global";
      fkEmpresaId = null;
    }

    const novoModelo = await prisma.certificadomodelo.create({
      data: {
        titulo: dados.titulo,
        conteudoHtml: dados.conteudoHtml,
        tipoEscopo,
        fkEmpresaId,
        ativo: 1,
      },
    });

    return {
      idCertificadoModelo: novoModelo.idCertificadoModelo,
      titulo: novoModelo.titulo,
      tipoEscopo: novoModelo.tipoEscopo,
      criadoEm: novoModelo.criadoEm.toLocaleDateString("pt-BR"),
    };
  },
};

export const editarModeloCertificado = {
  async execute(id: number, dados: any, usuario: any) {
    const modelo = await prisma.certificadomodelo.findUnique({
      where: { idCertificadoModelo: id },
    });

    if (!modelo) {
      throw new Error("Modelo de certificado não encontrado.");
    }

    const isAdmin = usuario.roles?.includes("admin");
    const isGestor = usuario.roles?.includes("gestor");

    // Gestor só pode editar os da própria empresa
    if (isGestor && modelo.fkEmpresaId !== usuario.fkEmpresaId) {
      throw new Error("Você não tem permissão para editar este modelo.");
    }

    const atualizado = await prisma.certificadomodelo.update({
      where: { idCertificadoModelo: id },
      data: {
        titulo: dados.titulo,
        conteudoHtml: dados.conteudoHtml,
        editadoEm: new Date(),
      },
    });

    return {
      idCertificadoModelo: atualizado.idCertificadoModelo,
      titulo: atualizado.titulo,
      tipoEscopo: atualizado.tipoEscopo,
      atualizadoEm: atualizado.editadoEm.toLocaleDateString("pt-BR"),
    };
  },
};

export const excluirModeloCertificado = {
  async execute(id: number, usuario: any) {
    const modelo = await prisma.certificadomodelo.findUnique({
      where: { idCertificadoModelo: id },
    });

    if (!modelo) {
      throw new Error("Modelo não encontrado.");
    }

    const isAdmin = usuario.roles?.includes("admin");
    const isGestor = usuario.roles?.includes("gestor");

    if (isGestor && modelo.fkEmpresaId !== usuario.fkEmpresaId) {
      throw new Error("Você não tem permissão para excluir este modelo.");
    }

    await prisma.certificadomodelo.update({
      where: { idCertificadoModelo: id },
      data: { ativo: 0 },
    });

    return { mensagem: "Modelo excluído com sucesso." };
  },
};

// Certificados
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
    const certificado = await prisma.certificado.findUnique({
      where: { idCertificado },
      include: {
        curso: {
          include: {
            certificadomodelo: true,
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
          },
        },
        usuario: {
          select: {
            idUsuario: true,
            nome: true,
            cpf: true,
            assinatura: true,
            empresa: { select: { nomeFantasia: true } },
          },
        },
      },
    });

    if (!certificado) throw new Error("Certificado não encontrado.");

    const acessos = await prisma.cursoacesso.findMany({
      where: {
        fkCursoId: certificado.fkCursoId,
        fkUsuarioId: certificado.fkUsuarioId,
      },
      select: { concluido: true, dataConclusao: true },
    });

    (certificado as any).curso.acessos = acessos;

    const isDono = certificado.fkUsuarioId === usuario.idUsuario;
    const roles: string[] = usuario.roles || [];
    const isGestor = roles.includes("admin") || roles.includes("gestor");

    if (!isDono && !isGestor) {
      throw new Error("Sem permissão para visualizar este certificado.");
    }

    const curso = certificado.curso;
    const acesso = acessos?.[0];

    if (!curso || !acesso || acesso.concluido !== 1)
      throw new Error("Curso não concluído.");

    // ==== DADOS ORGANIZADOS ====
    const dados = {
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
      usuario: {
        nome: certificado.usuario.nome,
        cpf: certificado.usuario.cpf,
        empresa: certificado.usuario.empresa?.nomeFantasia,
        assinatura: certificado.usuario.assinatura,
      },
      instrutor: {
        nome: curso.responsaveltecnico?.nome,
        funcao: curso.responsaveltecnico?.funcao,
        registro: curso.responsaveltecnico?.registro,
        assinatura: curso.responsaveltecnico?.assinatura,
      },
      certificado: {
        codigo: certificado.codigo,
        dataGeracao: new Date(certificado.dataGeracao).toLocaleDateString("pt-BR"),
      },
      modelo: curso.certificadomodelo,
    };


    let pdfBuffer: Buffer;

    if (
      dados.modelo &&
      Array.isArray(dados.modelo.conteudoHtml) &&
      dados.modelo.conteudoHtml.length > 0
    ) {
      pdfBuffer = await gerarCertificadoPdf(dados);
    } else {
      pdfBuffer = await gerarCertificadoPdf(dados);
    }

    return { pdfBase64: pdfBuffer.toString("base64") };
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

function garantirString(valor: any): string {
  if (!valor) return "";
  if (typeof valor === "string") return valor;

  // Se veio array → pega primeiro
  if (Array.isArray(valor)) return valor.join(" ");

  // Se veio objeto → transforma em HTML bruto
  return JSON.stringify(valor);
}

function aplicarVariaveis(texto: string, vars: Record<string, any>) {
  let html = texto || "";
  Object.entries(vars).forEach(([key, value]) => {
    html = html.split(key).join(value ?? "");
  });
  return html;
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

  const textoPagina1Padrao = `
    Funcionário(a) da empresa <strong>${dados.usuario?.empresa}</strong>,
    portador do CPF <strong>${formatarCpf(dados.usuario?.cpf)}</strong>,
    concluiu com êxito o curso <strong>${dados.curso?.titulo}</strong>,
    com carga horária de <strong>${formatarMinutosEmHoras(dados.curso?.cargaHoraria)}</strong>,
    finalizado em <strong>${dados.certificado?.dataGeracao}</strong>.
  `;

  function gerarConteudoProgramaticoPadrao(dados: any) {
    let contadorModulo = 1;

    const htmlModulos = dados.curso?.grade
      ?.map((m: any) => {
        const aulasOrdenadas = [...m.aulas].sort(
          (a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)
        );

        let contadorAula = 1;

        const bloco = `
        <li style="margin-bottom: 10px;">
          <strong>${contadorModulo}. ${m.titulo}</strong>

          <ol style="margin-left: 25px; list-style: none; padding-left: 0;">
            ${aulasOrdenadas
            .map(
              (a: any) =>
                `<li>${contadorModulo}.${contadorAula++} ${a.titulo}</li>`
            )
            .join("")}
          </ol>
        </li>
      `;

        contadorModulo++; // 🔥 INCREMENTA AQUI!

        return bloco;
      })
      .join("");

    const avaliacaoFinal = dados.curso?.avaliacoes?.length
      ? `
      <li style="margin-bottom: 5px;">
        <strong>${contadorModulo}. Avaliação final do curso</strong>
      </li>
    `
      : "";

    return `
    <ol style="padding-left: 18px; list-style: none; margin: 0;">
      ${htmlModulos}
      ${avaliacaoFinal}
    </ol>
  `;
  };

  const variaveis = {
    "{{nomeAluno}}": dados.usuario.nome,
    "{{cpfAluno}}": formatarCpf(dados.usuario.cpf),
    "{{empresaAluno}}": dados.usuario.empresa ?? "",
    "{{nomeInstrutor}}": dados.instrutor?.nome ?? "",
    "{{funcaoInstrutor}}": dados.instrutor?.funcao ?? "",
    "{{registroInstrutor}}": dados.instrutor?.registro ?? "",
    "{{nomeCurso}}": dados.curso.titulo,
    "{{cargaHoraria}}": formatarMinutosEmHoras(dados.curso.cargaHoraria),
    "{{dataConclusao}}": dados.certificado.dataGeracao,
    "{{dataAtual}}": new Date().toLocaleDateString("pt-BR"),
    "{{codigoCertificado}}": dados.certificado.codigo,
  };

  const modeloPagina1 =
    Array.isArray(dados.modelo?.conteudoHtml) &&
      dados.modelo.conteudoHtml[0]
      ? garantirString(dados.modelo.conteudoHtml[0].html)
      : textoPagina1Padrao;

  const modeloPagina2 =
    Array.isArray(dados.modelo?.conteudoHtml) &&
      dados.modelo.conteudoHtml[1]
      ? garantirString(dados.modelo.conteudoHtml[1].html)
      : gerarConteudoProgramaticoPadrao(dados);

  const pagina1Texto = aplicarVariaveis(modeloPagina1, variaveis);
  const pagina2Texto = aplicarVariaveis(modeloPagina2, variaveis);

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
            ${pagina1Texto}
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
              <div>Funcionário: <strong>${dados.usuario.nome}</strong></div>
              <div>CPF: ${formatarCpf(dados.usuario.cpf)}</div>
            </div>
          </div>


          <div class="rodape">
            Emitido por <strong>Saber Seguro Treinamentos</strong>
          </div>
        </div>

        <!-- Página 2: Conteúdo Programático -->
        <div class="container container-programa" style="page-break-before: always;">
          <div class="programa-titulo">CONTEÚDO PROGRAMÁTICO</div>
          <div class="programa-corpo">
            ${pagina2Texto}
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