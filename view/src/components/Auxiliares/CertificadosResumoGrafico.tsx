import { PieChart, Pie, Cell } from "recharts";
import { useCertificados } from "../../contexts/CertificadosContext";
import { useEffect } from "react";

const COLORS = ["#0069a8", "#e5e7eb"];

export default function CertificadosResumoGrafico({ isOpen }: any) {
  const { resumo, atualizarResumo } = useCertificados();

  useEffect(() => {
    atualizarResumo().catch((err) =>
      console.error("Erro ao atualizar créditos:", err)
    );
  }, []);

  if (!resumo) return null;

  const totalGerados = resumo.totalGerados ?? 0;
  const limiteMensal = resumo.limiteMensal ?? 0;
  const restante = Math.max(limiteMensal - totalGerados, 0);

  const data = [
    { name: "Gerado", value: totalGerados },
    { name: "Limite", value: Math.max(limiteMensal - totalGerados, 0) },
  ];

  // === Tamanhos ajustados ===
  const chartSize = isOpen ? 85 : 65;
  const innerRadius = isOpen ? 26 : 18;
  const outerRadius = isOpen ? 34 : 24;

  return (
    <div className="flex flex-col items-center justify-center py-2">
      <div className="relative flex items-center justify-center">
        <PieChart width={chartSize} height={chartSize}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            startAngle={90}
            endAngle={450}
            stroke="none"
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
        </PieChart>

        {/* Texto central */}
        <div className="absolute text-gray-400 flex items-center justify-center text-center leading-none">
          <span className="text-sky-700 text-base font-bold">
            {totalGerados}
          </span>
          /
          <span className="text-gray-400 text-base font-bold">
            {restante}
          </span>
        </div>
      </div>

      {/* Legenda abaixo */}
      {isOpen && (
        <>
          <div className="flex justify-center gap-2 mt-1 text-gray-500 text-[10px]">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-700"></span> Gerado
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-gray-300"></span> Crédito
            </div>
          </div>
        </>
      )}
    </div>
  );
}
