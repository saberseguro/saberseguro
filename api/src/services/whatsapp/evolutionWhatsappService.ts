import { env } from "../../config/env";

export interface EnviarWhatsappParams {
  telefone: string;
  mensagem: string;
}

export interface EnviarWhatsappResultado {
  sucesso: boolean;
  simulado: boolean;
  status: string;
  detalhe?: string;
}

const isWhatsappAtivo = () =>
  String(env.WHATSAPP_NOTIFICACOES_ATIVO).toLowerCase() === "true";

export const evolutionWhatsappService = {
  async enviarMensagem({
    telefone,
    mensagem,
  }: EnviarWhatsappParams): Promise<EnviarWhatsappResultado> {
    if (!isWhatsappAtivo()) {
      console.log("[WHATSAPP SIMULADO]", { telefone, mensagem });

      return {
        sucesso: true,
        simulado: true,
        status: "simulado",
        detalhe: "WHATSAPP_NOTIFICACOES_ATIVO=false",
      };
    }

    return {
      sucesso: false,
      simulado: false,
      status: "pendente_integracao_evolution_api",
      detalhe:
        "Estrutura da Evolution API preparada. Envio real ainda nao implementado.",
    };
  },
};
