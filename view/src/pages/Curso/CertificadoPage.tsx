import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { Certificado } from "../../types/EstruturaCurso";
import { useNavigate } from "react-router-dom";
import { getCertificados } from "../../services/apiCurso";
import toast from "react-hot-toast";
import ToolTip from "../../components/Auxiliares/ToolTip";
import TabelaBase from "../../components/Tabelas/TabelaBase";

export default function CertificadoPage() {
  const navigate = useNavigate();
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const lista = await getCertificados();
        setCertificados(lista);
      } catch (e: any) {
        toast.error("Erro ao carregar certificados.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handlePreview = async (cert: Certificado) => {
    if (cert.fkCursoId) {
      navigate(`/certificado/${cert.fkCursoId}`, {
        state: { idFuncionario: cert.fkUsuarioId },
      });
    } else {
      toast.error("Erro ao gerar certificado.");
    };
  };

  const columns = [
    {
      header: "Código",
      accessor: "codigo" as keyof Certificado,
      sortable: true,
    },
    {
      header: "Curso",
      accessor: "curso" as keyof Certificado,
      sortable: true,
    },
    {
      header: "Carga Horária",
      accessor: "cargaHoraria" as keyof Certificado,
      sortable: true,
    },
    {
      header: "Funcionário",
      accessor: "funcionario" as keyof Certificado,
      sortable: true,
    },
    {
      header: "Data de Geração",
      accessor: "dataGeracao" as keyof Certificado,
      sortable: true,
    },
    {
      header: "Ações",
      accessor: "idCertificado" as keyof Certificado,
      render: (_val: any, row: Certificado) => {
        const podeVisualizar = row?.valido;

        return (
          <div className="flex justify-center items-center">
            <ToolTip
              text={
                podeVisualizar
                  ? "Visualizar Certificado"
                  : "Você não tem permissão para abrir este certificado"
              }
              position="left"
            >
              <button
                onClick={() => podeVisualizar && handlePreview(row)}
                disabled={!podeVisualizar}
                className={`cursor-pointer ${podeVisualizar
                  ? "text-sky-600 hover:text-sky-800"
                  : "text-gray-300 cursor-not-allowed"
                  }`}
              >
                {podeVisualizar ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </ToolTip>
          </div>
        );
      },
    }
  ];

  return (
    <>
      <div className="p-4 rounded-md shadow-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Meus Certificados</h1>
        </div>

        <TabelaBase
          columns={columns}
          data={certificados}
          isLoading={loading}
          itemsPerPage={10}
        />
      </div>
    </>
  );
}
