import { useState } from "react";
import { GraduationCap, Clock, FileText, ListChecks } from "lucide-react";
import { formatarMinutosEmHoras } from "../../auxiliares/formatters";

export default function TabsInfoCurso({ curso, materiais }: { curso: any, materiais: any[] }) {
  const [abaAtiva, setAbaAtiva] = useState<"instrutor" | "materiais">("instrutor");

  const totalAulas = curso.modulos?.reduce((sum: number, mod: any) => {
    return sum + (mod.aulas?.length ?? 0);
  }, 0) || 0;

  const totalAvaliacoes =
    curso.modulos
      ?.flatMap((m: any) =>
        m.aulas.flatMap((a: any) => a.steps ?? [])
      )
      .filter((s: any) => s.tipo === "avaliacao").length || 0;

  const instrutor = curso.responsaveltecnico;

  return (
    <div className="bg-white text-sm min-h-36">
      {/* Abas */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          className={`px-4 py-2 font-medium transition cursor-pointer ${abaAtiva === "instrutor"
            ? "border-b-2 border-sky-600 text-sky-700"
            : "text-gray-500 hover:text-gray-700"
            }`}
          onClick={() => setAbaAtiva("instrutor")}
        >
          Sobre o Curso
        </button>
        <button
          className={`px-4 py-2 font-medium transition cursor-pointer ${abaAtiva === "materiais"
            ? "border-b-2 border-sky-600 text-sky-700"
            : "text-gray-500 hover:text-gray-700"
            }`}
          onClick={() => setAbaAtiva("materiais")}
        >
          Materiais do Curso
        </button>
      </div>

      {/* Conteúdo da aba ativa */}
      {abaAtiva === "instrutor" && (
        <div className="space-y-6 text-gray-700">
          {/* Descrição do curso */}
          <div className="border-b border-gray-300 pb-2">
            <h2 className="text-lg font-semibold mb-1">Descrição do Curso</h2>
            <p className="text-gray-600">{curso.descricao || "Sem descrição disponível para este curso."}</p>
          </div>

          {/* Blocos informativos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <InfoBox icon={<GraduationCap className="w-5 h-5 text-sky-600" />} label="Nível" value="Básico" />
            <InfoBox icon={<ListChecks className="w-5 h-5 text-sky-600" />} label="Aulas" value={`${totalAulas} aulas`} />
            <InfoBox icon={<FileText className="w-5 h-5 text-sky-600" />} label="Avaliações" value={`${totalAvaliacoes} avaliações`} />
            <InfoBox icon={<Clock className="w-5 h-5 text-sky-600" />} label="Duração" value={`${formatarMinutosEmHoras(curso.cargaHoraria)}`} />
            <InfoBox icon={<FileText className="w-5 h-5 text-sky-600" />} label="Certificado" value="Emitido ao final" />
          </div>

          {/* Instrutor */}
          {instrutor && (
            <div className="flex items-center gap-3 pt-6 border-t border-gray-300">
              <img
                src={`https://ui-avatars.com/api/?name=${instrutor.nome}&background=dff2fe&color=0084d1`}
                alt={instrutor.nome}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h3 className="text-base font-semibold -mb-1">{instrutor.nome}</h3>
                <p className="text-sm text-gray-500">{instrutor.funcao}: {instrutor.registro}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Materiais do curso */}
      {abaAtiva === "materiais" && (
        <div className="mt-2 px-2">
          {materiais.length === 0 ? (
            <p className="text-gray-500 italic">Nenhum material complementar disponível.</p>
          ) : (
            <>
              <p>Lista de Materiais:</p>
              <ul className="space-y-2 px-2 mt-2">
                {materiais.map((mat, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <a
                      href={mat.material}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-600 hover:underline"
                    >
                      📄 {mat.titulo}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Bloco de info visual
function InfoBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-2 py-2">
      <div className="bg-sky-100 p-2 rounded">{icon}</div>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-sm font-medium text-gray-800">{value}</div>
      </div>
    </div>
  );
}