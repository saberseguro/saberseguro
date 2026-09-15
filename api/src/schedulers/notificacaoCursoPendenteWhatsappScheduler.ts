import cron from "node-cron";
import { executarNotificacoesCursosPendentesWhatsapp } from "../models/curso/notificacaoCursoPendenteWhatsapp";

export function iniciarNotificacaoCursoPendenteWhatsappScheduler() {
  cron.schedule(
    "0 9 * * 1",
    async () => {
      try {
        const resultado =
          await executarNotificacoesCursosPendentesWhatsapp.execute();

        console.log(
          "[SCHEDULER] Notificacoes de cursos pendentes executadas",
          resultado
        );
      } catch (error) {
        console.error(
          "[SCHEDULER] Erro ao executar notificacoes de cursos pendentes",
          error
        );
      }
    },
    {
      timezone: "America/Sao_Paulo",
    }
  );
}
