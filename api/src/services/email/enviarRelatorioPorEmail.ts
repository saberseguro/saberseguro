import nodemailer from "nodemailer";

interface EnviarRelatorioPorEmailParams {
  // Aceita um e-mail só ou uma lista (o cadastro de agendamento guarda os
  // e-mails separados por vírgula em uma única string).
  para: string | string[];
  assunto: string;
  html: string;
  buffer: Buffer | Uint8Array | ArrayBuffer;
  nomeArquivo: string;
  mimeType: string;
}

// Generaliza o mesmo transporter usado em enviarCertificadoPorEmail.ts, mas
// pra um anexo genérico (qualquer relatório gerado por gerarRelatorio.execute),
// em vez de só o PDF do certificado.
export const enviarRelatorioPorEmail = {
  async execute({
    para,
    assunto,
    html,
    buffer,
    nomeArquivo,
    mimeType,
  }: EnviarRelatorioPorEmailParams) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Saber Seguro Treinamentos" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: Array.isArray(para) ? para.join(",") : para,
      subject: assunto,
      html,
      attachments: [
        {
          filename: nomeArquivo,
          content: Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as any),
          contentType: mimeType,
        },
      ],
    });
  },
};
