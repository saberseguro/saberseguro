import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface LinhaStatus {
  idUsuario: number;
  idCurso: number;
  status: string;
  percentual: number;
  prazoLimite: string | null;
}

interface Usuario {
  idUsuario: number;
  nome: string;
  cargo: {
    nome: string;
    setor: { nome: string };
  };
}

interface Curso {
  idCurso: number;
  titulo: string;
}

interface Props {
  tabela?: LinhaStatus[];
  usuarios?: Usuario[];
  cursos?: Curso[];
}

export default function TabelaStatusCursosFuncionarios({
  tabela,
  usuarios,
  cursos
}: Props) {
  const [expandido, setExpandido] = useState<Record<number, boolean>>({});

  // Agrupar por usuário
  const tabelaPorUsuario = useMemo(() => {
    const map: Record<number, LinhaStatus[]> = {};

    tabela?.forEach((linha) => {
      if (!map[linha.idUsuario]) map[linha.idUsuario] = [];
      map[linha.idUsuario].push(linha);
    });

    return map;
  }, [tabela]);

  const getCurso = (idCurso: number) =>
    cursos?.find((c) => c.idCurso === idCurso)?.titulo ?? "Curso não encontrado";

  const getStatusBadge = (status: string) => {
    const cores: Record<string, string> = {
      "NAO_INICIADO": "bg-gray-300 text-gray-800",
      "EM_ANDAMENTO": "bg-blue-200 text-blue-900",
      "CONCLUIDO": "bg-green-300 text-green-900",
      "ATRASADO": "bg-red-300 text-red-800"
    };
    return cores[status] ?? "bg-gray-200";
  };

  return (
    <div className="mt-6 border rounded-xl bg-white dark:bg-neutral-900 shadow-sm">
      <div className="p-4 border-b font-semibold text-lg">
        Status dos Funcionários × Cursos
      </div>

      <div>
        {usuarios?.map((user) => {
          const linhas = tabelaPorUsuario[user.idUsuario] ?? [];

          return (
            <div key={user.idUsuario} className="border-b last:border-b-0">
              {/* Cabeçalho do Funcionário */}
              <button
                onClick={() =>
                  setExpandido((prev) => ({
                    ...prev,
                    [user.idUsuario]: !prev[user.idUsuario],
                  }))
                }
                className="w-full flex items-center justify-between p-4 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <div className="text-left">
                  <div className="font-semibold text-neutral-800 dark:text-neutral-100">
                    {user.nome}
                  </div>
                  <div className="text-sm text-neutral-500">
                    {user.cargo?.nome} • {user.cargo?.setor?.nome}
                  </div>
                </div>

                {expandido[user.idUsuario] ? (
                  <ChevronUp />
                ) : (
                  <ChevronDown />
                )}
              </button>

              {/* Tabela dos cursos */}
              {expandido[user.idUsuario] && (
                <div className="px-4 pb-4">
                  <table className="w-full text-sm mt-2 border-collapse">
                    <thead>
                      <tr className="border-b text-left text-neutral-700 dark:text-neutral-300">
                        <th className="py-2">Curso</th>
                        <th>Status</th>
                        <th>Progresso</th>
                        <th>Prazo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linhas.map((linha, i) => (
                        <tr
                          key={i}
                          className="border-b last:border-b-0 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        >
                          <td className="py-2">{getCurso(linha.idCurso)}</td>

                          {/* Status */}
                          <td>
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(
                                linha.status
                              )}`}
                            >
                              {linha.status.replace("_", " ")}
                            </span>
                          </td>

                          {/* Percentual */}
                          <td>{linha.percentual}%</td>

                          {/* Prazo */}
                          <td>
                            {linha.prazoLimite
                              ? new Date(linha.prazoLimite).toLocaleDateString(
                                  "pt-BR"
                                )
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {linhas.length === 0 && (
                    <div className="py-4 text-neutral-500 text-sm">
                      Nenhum curso disponível.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}