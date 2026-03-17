import { useEffect, useMemo, useState } from "react";
import { Building2, Search, X } from "lucide-react";
import { useCompany } from "../../contexts/CompanyContext";
import { apiFetch } from "../../services/apiFetch";

interface EmpresaResumo {
  idEmpresa: number;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ModalSelecionarEmpresa({ open, onClose }: Props) {
  const { selectedCompany, enterCompany, leaveCompany } = useCompany();

  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState("");
  const [empresas, setEmpresas] = useState<EmpresaResumo[]>([]);
  const [mostrarBusca, setMostrarBusca] = useState(false);

  useEffect(() => {
    if (!open) return;

    setBusca("");
    setMostrarBusca(!selectedCompany);
    carregarEmpresas();
  }, [open, selectedCompany]);

  async function carregarEmpresas() {
    try {
      setLoading(true);

      const data = await apiFetch<EmpresaResumo[]>("/empresa");
      setEmpresas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar empresas:", error);
      setEmpresas([]);
    } finally {
      setLoading(false);
    }
  }

  const empresasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return empresas;

    return empresas.filter((empresa) => {
      return (
        empresa.razaoSocial?.toLowerCase().includes(termo) ||
        empresa.nomeFantasia?.toLowerCase().includes(termo) ||
        empresa.cnpj?.toLowerCase().includes(termo)
      );
    });
  }, [busca, empresas]);

  function handleSelecionarEmpresa(empresa: EmpresaResumo) {
    enterCompany({
      idEmpresa: empresa.idEmpresa,
      razaoSocial: empresa.razaoSocial,
      nomeFantasia: empresa.nomeFantasia,
      cnpj: empresa.cnpj,
    });

    onClose();
  }

  function handleTrocarEmpresa() {
    setMostrarBusca(true);
  }

  function handleSairEmpresa() {
    leaveCompany();
    setMostrarBusca(true);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-gray-200">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Building2 className="text-sky-700" size={20} />
            <h2 className="text-lg font-semibold text-gray-800">
              Selecionar empresa
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {selectedCompany && !mostrarBusca ? (
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
              <p className="text-xs uppercase tracking-wide text-sky-700 mb-1">
                Empresa ativa
              </p>
              <p className="text-sm font-semibold text-gray-800">
                {selectedCompany.nomeFantasia || selectedCompany.razaoSocial}
              </p>
              <p className="text-xs text-gray-500">
                {selectedCompany.razaoSocial}
              </p>
              {selectedCompany.cnpj && (
                <p className="text-xs text-gray-500">{selectedCompany.cnpj}</p>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleTrocarEmpresa}
                  className="rounded-md bg-sky-700 px-3 py-2 text-sm text-white hover:bg-sky-800"
                >
                  Trocar empresa
                </button>

                <button
                  onClick={handleSairEmpresa}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Sair da empresa
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Pesquisar por razão social, nome fantasia ou CNPJ"
                  className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-200">
                {loading ? (
                  <div className="p-4 text-sm text-gray-500">
                    Carregando empresas...
                  </div>
                ) : empresasFiltradas.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">
                    Nenhuma empresa encontrada.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {empresasFiltradas.map((empresa) => (
                      <button
                        key={empresa.idEmpresa}
                        onClick={() => handleSelecionarEmpresa(empresa)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition"
                      >
                        <p className="text-sm font-medium text-gray-800">
                          {empresa.nomeFantasia || empresa.razaoSocial}
                        </p>
                        <p className="text-xs text-gray-500">
                          {empresa.razaoSocial}
                        </p>
                        {empresa.cnpj && (
                          <p className="text-xs text-gray-400">{empresa.cnpj}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedCompany && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setMostrarBusca(false)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Voltar para empresa atual
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}