import puppeteer, { Browser, PDFOptions } from "puppeteer";

/**
 * Instância única (singleton) do Chromium do Puppeteer, compartilhada entre
 * todos os relatórios em PDF.
 *
 * Por quê: abrir e fechar um Chromium inteiro a cada PDF gerado é a parte
 * mais lenta da geração de relatório (na prática, ~1-3s só de abrir o
 * navegador, antes até de renderizar a página). Como os relatórios usam o
 * Puppeteer só pra "imprimir" um HTML em PDF, dá pra manter UM navegador
 * aberto e abrir/fechar apenas uma aba (page) por relatório — a aba é bem
 * mais leve que o processo inteiro do Chromium.
 *
 * O ponto de o navegador ficar aberto sem uso é: ele consome memória
 * (tipicamente uns 100-200MB) enquanto ligado, mesmo sem gerar nada. Pra
 * não deixar isso consumindo à toa quando ninguém está gerando relatório,
 * ele se fecha sozinho depois de um tempo de inatividade (ver
 * TEMPO_INATIVIDADE_MS) e é religado automaticamente na próxima vez que for
 * preciso — o "custo" de reabrir só volta a acontecer se passar muito tempo
 * sem uso.
 */

const TEMPO_INATIVIDADE_MS = 10 * 60 * 1000; // 10 minutos sem uso -> fecha

let browserPromise: Promise<Browser> | null = null;
let timeoutFechamento: NodeJS.Timeout | null = null;

async function iniciarBrowser(): Promise<Browser> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  // Se o Chromium cair ou for fechado por fora (ex.: erro interno, kill do
  // processo), esquece a instância guardada pra recriar do zero na próxima
  // chamada em vez de reusar uma referência morta.
  browser.on("disconnected", () => {
    browserPromise = null;
    if (timeoutFechamento) {
      clearTimeout(timeoutFechamento);
      timeoutFechamento = null;
    }
  });

  return browser;
}

/** Pega o navegador compartilhado, abrindo um novo se ainda não existir. */
export async function obterBrowserCompartilhado(): Promise<Browser> {
  // Cancela o fechamento por inatividade agendado, já que o navegador vai
  // ser usado agora.
  if (timeoutFechamento) {
    clearTimeout(timeoutFechamento);
    timeoutFechamento = null;
  }

  if (!browserPromise) {
    browserPromise = iniciarBrowser();
  }

  return browserPromise;
}

/** Rearma o timer de fechamento por inatividade. Chamar após usar o navegador. */
export function agendarFechamentoPorInatividade() {
  if (timeoutFechamento) clearTimeout(timeoutFechamento);

  timeoutFechamento = setTimeout(async () => {
    const promisePendente = browserPromise;
    browserPromise = null;

    if (promisePendente) {
      const browser = await promisePendente.catch(() => null);
      await browser?.close().catch(() => {});
    }
  }, TEMPO_INATIVIDADE_MS);

  // Não deve impedir o processo Node de encerrar (ex.: em testes/scripts).
  timeoutFechamento.unref?.();
}

/**
 * Gera um PDF a partir de um HTML usando o navegador compartilhado.
 * Substitui o padrão antigo de "puppeteer.launch -> gerar -> browser.close()"
 * em cada relatório.
 */
export async function gerarPdfDeHtml(
  html: string,
  opcoesPdf: PDFOptions
): Promise<Buffer> {
  const browser = await obterBrowserCompartilhado();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf(opcoesPdf);
    return Buffer.from(pdfBuffer);
  } finally {
    await page.close().catch(() => {});
    agendarFechamentoPorInatividade();
  }
}
