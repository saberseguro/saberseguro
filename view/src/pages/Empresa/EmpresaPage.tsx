// src/pages/GerenciaEmpresa.tsx
import { useState, useEffect } from "react";
import type { Empresa, Unidade, Setor, Cargo, Funcionario } from "../../types";
import { getEmpresa, getUnidades, getSetores, getCargos, getFuncionarios } from "../../services/apiEmpresa";
import { useAuth } from "../../contexts/AuthContext";

export default function GerenciaEmpresa() {

  const { user } = useAuth();

  const [empresa, setEmpresa] = useState<Empresa | null>(null);

  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<Unidade | null>(null);

  const [setores, setSetores] = useState<Setor[]>([]);
  const [setorSelecionado, setSetorSelecionado] = useState<Setor | null>(null);

  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [cargoSelecionado, setCargoSelecionado] = useState<Cargo | null>(null);

  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);

  useEffect(() => {
    const fetchDadosIniciais = async () => {
      if (user?.fkEmpresaId) {
        const empresaData = await getEmpresa(user.fkEmpresaId);
        setEmpresa(empresaData);

        const unidadesData = await getUnidades(user.fkEmpresaId);
        setUnidades(unidadesData);
      }
    };

    fetchDadosIniciais();
  }, [user?.fkEmpresaId]);

  useEffect(() => {
    if (unidadeSelecionada) {
      getSetores(unidadeSelecionada.idUnidade).then(setSetores);
      setSetorSelecionado(null);
      setCargos([]);
      setFuncionarios([]);
    }
  }, [unidadeSelecionada]);

  useEffect(() => {
    if (setorSelecionado) {
      getCargos(setorSelecionado.idSetor).then(setCargos);
      setCargoSelecionado(null);
      setFuncionarios([]);
    }
  }, [setorSelecionado]);

  useEffect(() => {
    if (cargoSelecionado) {
      getFuncionarios(cargoSelecionado.idCargo).then(setFuncionarios);
    } else {
      setFuncionarios([]);
    }
  }, [cargoSelecionado]);


  return (
    <div className="flex flex-col shadow-sm rounded bg-white">
      {/* Card Empresa */}
      {empresa && (
        <div className="p-4 border-b border-gray-300 text-sm">
          <div className="w-full flex justify-between items-center">
            <h1 className="text-xl font-bold mb-2">{empresa.nomeFantasia}</h1>
            <p className="text-lg"><strong>CNPJ:</strong> {empresa.documento}</p>
          </div>
          <p><strong>Razão Social:</strong> {empresa.razaoSocial}</p>
          <p><strong>Endereço:</strong> {empresa.endereco}, {empresa.numero} - {empresa.bairro}</p>
          <p><strong>Cidade:</strong> {empresa.cidade} - {empresa.uf} | CEP: {empresa.cep}</p>
        </div>
      )}

      {/* Tabs com as unidades */}
      <div className="flex px-2 pt-2 bg-white min-h-10 items-center overflow-x-auto custom-scrollbar">
        <p className="text-sm">Unidades:</p>
        {unidades.map((unidade) => (
          <button
            key={unidade.idUnidade}
            onClick={() => setUnidadeSelecionada(unidade)}
            className={`mx-2 px-4 py-2 rounded-t cursor-pointer font-medium ${unidadeSelecionada?.idUnidade === unidade.idUnidade ? "bg-gray-50 text-gray-500" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
          >
            {unidade.nomeFantasia}
          </button>
        ))}
      </div>

      {unidadeSelecionada && (
        <div className="flex flex-1 overflow-hidden">
          {/* Lista de setores */}
          <div className="w-64 bg-gray-50 overflow-y-auto py-3 pl-3">
            <h2 className="text-md font-semibold mb-2">Setores</h2>
            {setores.map((setor) => (
              <button
                key={setor.idSetor}
                onClick={() => setSetorSelecionado(setor)}
                className={`block w-full text-left pl-4 py-2 rounded-l mb-1 cursor-pointer ${setorSelecionado?.idSetor === setor.idSetor ? "bg-gray-100 font-semibold" : "hover:bg-gray-200"
                  }`}
              >
                {setor.nome}
              </button>
            ))}
          </div>

          <div className={`flex-1 overflow-y-auto p-4 ${setorSelecionado ? "bg-gray-100" : "bg-white"}`}>
            <h2 className="text-md font-semibold mb-4">Cargos</h2>

            {setorSelecionado ? (
              <div className="space-y-4">
                {cargos.map((cargo) => (
                  <div key={cargo.idCargo} className="bg-white rounded shadow hover:shadow-md">
                    {/* Cabeçalho do cargo */}
                    <button
                      onClick={() =>
                        setCargoSelecionado(cargoSelecionado?.idCargo === cargo.idCargo ? null : cargo)
                      }
                      className="w-full text-left px-4 py-2 font-semibold text-gray-700 cursor-pointer"
                    >
                      {cargo.nome}
                    </button>

                    {/* Se estiver selecionado, mostra a tabela de funcionários */}
                    {cargoSelecionado?.idCargo === cargo.idCargo && (
                      <div className="p-4">
                        {funcionarios.length > 0 ? (
                          <table className="w-full text-sm border border-gray-100 text-center">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="px-3 py-2 border border-gray-300">Nome</th>
                                <th className="px-3 py-2 border border-gray-300">Email</th>
                                <th className="px-3 py-2 border border-gray-300">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {funcionarios.map((f) => (
                                <tr key={f.idUsuario} className="border-t">
                                  <td className="px-3 py-1 border border-gray-300">{f.nome}</td>
                                  <td className="px-3 py-1 border border-gray-300">{f.email}</td>
                                  <td className="px-3 py-1 border border-gray-300">{f.ativo ? "Ativo" : "Inativo"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="text-sm text-gray-500">Nenhum funcionário cadastrado.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Selecione um setor para ver os cargos.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}