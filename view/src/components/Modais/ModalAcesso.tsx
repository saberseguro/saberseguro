import ModalBase from "./ModalBase";

interface HorarioAcesso {
  diaSemana: string;
  permitido: boolean;
  horarioInicio: string;
  horarioFim: string;
}

interface ModalHorarioAcessoProps {
  aberto: boolean;
  onClose: () => void;
  horarios: HorarioAcesso[];
}

export default function ModalHorarioAcesso({
  aberto,
  onClose,
  horarios,
}: ModalHorarioAcessoProps) {

  const agora = new Date();

  const diaAtual = agora.toLocaleDateString("pt-BR", { weekday: "long" });
  const horaAtual = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });


  return (
    <ModalBase isOpen={aberto} onClose={onClose} titulo="Horários de Acesso">
      <div className="text-sm text-gray-600 mb-4 text-center">
        Hoje é <strong className="capitalize">{diaAtual}</strong>, agora são <strong>{horaAtual}</strong>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {horarios.map((h) => {
          const ehHoje = h.diaSemana.toLowerCase() === diaAtual;

          return (
            <div
              key={h.diaSemana}
              className={`p-3 rounded-md text-sm border shadow-sm transition-all duration-200
                ${h.permitido && !ehHoje
                  ? "bg-gray-50 border-gray-300 text-gray-800"
                  : "bg-blue-50 border-blue-300 text-gray-800"}
              `}
            >
              <div className="font-semibold capitalize flex items-center">
                <p>{h.diaSemana}</p> 
                {ehHoje && <span className="ml-1 text-xs text-blue-700">(Hoje)</span>}
              </div>
              <div>
                {h.permitido
                  ? `Entrada: ${h.horarioInicio} - Saída: ${h.horarioFim}`
                  : "Acesso não permitido"}
              </div>
            </div>
          );
        })}
      </div>
    </ModalBase>
  );
}
