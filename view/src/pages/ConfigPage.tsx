import { useEffect, useState } from "react";
import TabelaBase from "../components/Tabelas/TabelaBase";
import ModalBase from "../components/Modais/ModalBase";
import FormResponsavelTecnico from "../components/Formularios/FormResponsavelTecnico";
import FormCategoria from "../components/Formularios/FormCategoria";
import type { Categoria, ResponsavelTecnico } from "../types/EstruturaCurso";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/Tabs/Tabs";
import { getCategorias, getResponsaveisTecnicos } from "../services/apiCurso";
import { formatarDocumento, formatarTelefone } from "../auxiliares/formatters";

export default function ConfigPage() {
  const [aba, setAba] = useState("responsavel");
  const [modalOpen, setModalOpen] = useState(false);
  const [responsaveis, setResponsaveis] = useState<ResponsavelTecnico[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const [editando, setEditando] = useState<any>(null);

  const columnsResponsavel: {
    header: string;
    accessor: keyof ResponsavelTecnico;
    sortable?: boolean;
    render?: (val: any, row: ResponsavelTecnico) => React.ReactNode;
  }[] = [
      {
        header: "ID",
        accessor: "idResponsavelTecnico" as keyof ResponsavelTecnico,
        sortable: true,
      },
      {
        header: "Nome",
        accessor: "nome" as keyof ResponsavelTecnico,
        sortable: true,
      },
      {
        header: "Função",
        accessor: "funcao" as keyof ResponsavelTecnico,
        sortable: true,
      },
      {
        header: "Registro",
        accessor: "registro" as keyof ResponsavelTecnico,
        sortable: true,
      },
      {
        header: "Documento",
        accessor: "documento" as keyof ResponsavelTecnico,
        sortable: true,
        render: (_val, row) => formatarDocumento(row.documento, row.tipoDocumento),
      },
      {
        header: "Telefone",
        accessor: "telefone" as keyof ResponsavelTecnico,
        sortable: true,
        render: (_val, row) => formatarTelefone(row.telefone) || "—",
      },
    ];

  const columnsCategoria: {
    header: string;
    accessor: keyof Categoria;
    sortable?: boolean;
    render?: (val: any, row: Categoria) => React.ReactNode;
  }[] = [
      {
        header: "ID",
        accessor: "idCategoria" as keyof Categoria,
        sortable: true,
      },
      {
        header: "Nome",
        accessor: "nome" as keyof Categoria,
        sortable: true,
      },
      {
        header: "Descrição",
        accessor: "descricao" as keyof Categoria,
        render: (_val, row) => row.descricao || "—",
      },
    ];

  useEffect(() => {
    fetchResponsaveis();
    fetchCategorias();
  }, []);

  const fetchResponsaveis = async () => {
    const res = await getResponsaveisTecnicos();
    setResponsaveis(res);
  };

  const fetchCategorias = async () => {
    const res = await getCategorias();
    setCategorias(res);
  };

  const handleAdd = () => {
    setEditando(null);
    setModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditando(item);
    setModalOpen(true);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Configurações</h1>

      <Tabs value={aba} onValueChange={setAba}>
        <TabsList className="mb-4">
          <TabsTrigger value="responsavel">Responsável Técnico</TabsTrigger>
          <TabsTrigger value="categoria">Categorias</TabsTrigger>
        </TabsList>

        {/* === ABA RESPONSÁVEL === */}
        <TabsContent value="responsavel">
          <div className="flex justify-end mb-4">
            <button
              className="bg-sky-600 text-white px-4 py-2 rounded cursor-pointer text-sm"
              onClick={handleAdd}
            >
              + Novo Responsável
            </button>
          </div>
          <TabelaBase<ResponsavelTecnico>
            columns={columnsResponsavel}
            data={responsaveis}
            onEdit={handleEdit}
          />

          <ModalBase
            largura="max-w-6xl"
            isOpen={modalOpen && aba === "responsavel"}
            onClose={() => setModalOpen(false)}
            titulo={editando ? "Editar Responsável Técnico" : "Novo Responsável Técnico"}
          >
            <FormResponsavelTecnico
              initialData={editando}
              setIsOpen={setModalOpen}
              fetchResponsaveis={fetchResponsaveis}
            />

          </ModalBase>
        </TabsContent>

        {/* === ABA CATEGORIAS === */}
        <TabsContent value="categoria">
          <div className="flex justify-end mb-4">
            <button
              className="bg-sky-600 text-white px-4 py-2 rounded cursor-pointer text-sm"
              onClick={handleAdd}
            >
              + Nova Categoria
            </button>
          </div>
          <TabelaBase<Categoria>
            columns={columnsCategoria}
            data={categorias}
            onEdit={handleEdit}
          />

          <ModalBase
            largura="max-w-6xl"
            isOpen={modalOpen && aba === "categoria"}
            onClose={() => setModalOpen(false)}
            titulo={editando ? "Editar Categoria" : "Nova Categoria"}
          >
            <FormCategoria
              initialData={editando}
              setIsOpen={setModalOpen}
              fetchCategorias={fetchCategorias}
            />
          </ModalBase>
        </TabsContent>
      </Tabs>
    </div>
  );
}