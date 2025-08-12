import { useEffect, useState, useCallback } from "react";
import type { Medida, MedidaTipo } from "../../types/EstruturaMedida";
import { getMedidas, createMedida, updateMedida, deleteMedida, toggleStatusMedida } from "../../services/apiMedida";

// Componentes
import TabelaBase from "../../components/Tabelas/TabelaBase";
import FiltrosMedidas from "../../components/Filtros/FiltrosMedidas";
import ModalMedida from "../../components/Modais/ModalMedida";
import { makeMedida } from "../../types/FactoriesMedida";
import ToolTip from "../../components/Auxiliares/ToolTip";
import { Plus } from "lucide-react";
import CheckboxStatus from "../../components/Formularios/Inputs";

export default function MedidaPage() {
  const [medidas, setMedidas] = useState<Medida[]>([]);
  const [busca, setBusca] = useState("");
  const [filtros, setFiltros] = useState<{ tipo: string | null; ativo: string | null }>({
    tipo: null,
    ativo: null,
  });
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [medidaSelecionada, setMedidaSelecionada] = useState<Medida | null>(null);
  const [loading, setLoading] = useState(false);

  const columns = [
    { header: "ID", accessor: "idMedida" as keyof Medida, sortable: true },
    {
      header: "Nome",
      accessor: "nome" as keyof Medida,
      sortable: true,
    },
    {
      header: "Tipo",
      accessor: "tipo" as keyof Medida,
      sortable: true,
      render: (_: any, row: Medida) => {
        const upperTypes = ["epi", "epc", "adm"];
        const isUpper = upperTypes.includes(row.tipo.toLowerCase());

        return (
          <span className={isUpper ? "uppercase" : "capitalize"}>
            {row.tipo}
          </span>
        );
      },
    },
  ];

  const buscarMedidas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMedidas({
        busca,
        tipo: (filtros.tipo ?? "") as MedidaTipo | "",
        page: 1,
      });
      const lista = Array.isArray(res) ? res : res.data ?? [];
      setMedidas(lista);
    } finally {
      setLoading(false);
    }
  }, [busca, filtros]);

  useEffect(() => {
    buscarMedidas();
  }, [buscarMedidas]);

  const handleEditMedida = (m: Medida) => {
    setMedidaSelecionada(m);
    setIsOpenModal(true);
  };

  const handleNovaMedida = () => {
    setMedidaSelecionada(makeMedida());
    setIsOpenModal(true);
  };

  return (
    <div className="p-4 rounded-md shadow-md bg-white">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Medidas</h1>
        <button className="bg-sky-600 text-white px-4 py-2 rounded cursor-pointer text-sm" onClick={handleNovaMedida}>
          <Plus size={18} className="inline mr-1" />
          Nova Medida
        </button>
      </div>

      <FiltrosMedidas busca={busca} setBusca={setBusca} filtros={filtros} setFiltros={setFiltros} onFiltrar={buscarMedidas} />

      <TabelaBase<Medida>
        columns={columns}
        data={medidas}
        itemsPerPage={10}
        isLoading={loading}
        onEdit={handleEditMedida}
        onDelete={async (m) => {
          if (!confirm(`Excluir a medida "${m.nome}"?`)) return;
          await deleteMedida(m.idMedida);
          buscarMedidas();
        }}
      />

      <ModalMedida
        isOpen={isOpenModal}
        onClose={() => setIsOpenModal(false)}
        medidaSelecionada={medidaSelecionada}
        onSaved={buscarMedidas}
        onCreate={createMedida}
        onUpdate={updateMedida}
      />
    </div>
  );
}