import nodemailer from "nodemailer";

interface EnviarCertificadoPorEmailParams {
  para: string;
  assunto: string;
  html: string;
  pdfBuffer: Buffer;
  nomeArquivo?: string;
}

export const enviarCertificadoPorEmail = {
  async execute({
    para,
    assunto,
    html,
    pdfBuffer,
    nomeArquivo = "certificado.pdf",
  }: EnviarCertificadoPorEmailParams) {
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
      to: para,
      subject: assunto,
      html,
      attachments: [
        {
          filename: nomeArquivo,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });
  },
};