// src/pages/GerenciaEmpresa.tsx
import { useState, useEffect } from "react";
import type { Empresa, Unidade, Setor, Cargo, Funcionario } from "../../types/EstruturaEmpresa";
import { getEmpresa, getUnidades, getSetores, getCargos, getFuncionarios } from "../../services/apiEmpresa";
import { useAuth } from "../../contexts/AuthContext";
import { formatarDocumento } from "../../auxiliares/formatters";
import { temPermissao } from "../../auxiliares/permissoes";

// Icons
import { ChevronDown, ChevronUp, Pencil, PencilOff, CirclePlus } from 'lucide-react';
import ToolTip from "../../components/Auxiliares/ToolTip";
import ModalBase from "../../components/Modais/ModalBase";

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

  const [modalAberto, setModalAberto] = useState(false);

  const podeEditar = temPermissao(user, ["gerenciar_empresa"]);

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
    <>
      <div className="flex flex-col h-full shadow-md rounded-md bg-white">
        {/* Card Empresa */}
        {empresa && (
          <div className="p-4 border-b border-gray-300 text-sm">
            <div className="w-full flex justify-between items-center">
              <h1 className="text-2xl font-bold mb-2">{empresa.nomeFantasia}</h1>
              <div>
                {podeEditar ? (
                  <ToolTip text="Editar" position="left">
                    <button className="text-sky-500 hover:text-sky-700 cursor-pointer">
                      <Pencil size={18} className="mr-2" />
                    </button>
                  </ToolTip>
                ) : (
                  <ToolTip text="Sem permissão" position="left">
                    <button className="text-gray-400 cursor-not-allowed">
                      <PencilOff size={18} className="mr-2" />
                    </button>
                  </ToolTip>
                )}
              </div>
            </div>
            <p><strong>Razão Social:</strong> {empresa.razaoSocial}</p>
            <p><strong>CNPJ:</strong> {formatarDocumento(empresa.documento, 'cnpj')}</p>
            <p><strong>Endereço:</strong> {empresa.endereco}, {empresa.numero} {empresa.complemento} - {empresa.bairro}, {empresa.cidade}/{empresa.uf} - {formatarDocumento(empresa.cep, 'cep')}</p>
          </div>
        )}

        {/* Tabs com as unidades */}
        <div className="flex items-center px-4 py-2 bg-white min-h-14 border-b border-gray-300 overflow-x-auto custom-scrollbar text-sm gap-2">
          <p className="font-light whitespace-nowrap">Unidades:</p>

          {podeEditar && (
            <ToolTip text="Adicionar" position="left">
              <button
                className="text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer rounded-md p-2 flex-shrink-0"
              >
                <CirclePlus size={18} />
              </button>
            </ToolTip>
          )}

          {unidades.length > 0 ? (
            <div className="flex gap-2">
              {unidades.map((unidade) => (
                <button
                  key={unidade.idUnidade}
                  onClick={() => setUnidadeSelecionada(unidadeSelecionada?.idUnidade === unidade.idUnidade ? null : unidade)}
                  className={`px-4 py-2 rounded font-medium whitespace-nowrap flex-shrink-0 cursor-pointer
                    ${unidadeSelecionada?.idUnidade === unidade.idUnidade
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  {unidade.nomeFantasia}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 font-medium ml-2">Nenhuma unidade cadastrada!</p>
          )}
        </div>


        {/* Card Unidade */}
        {unidadeSelecionada && (
          <div className="p-4 bg-gray-50 text-sm">
            <div className="w-full flex justify-between items-center">
              <h1 className="text-2xl font-bold mb-2">{unidadeSelecionada.nomeFantasia}</h1>
              <div>
                {podeEditar ? (
                  <ToolTip text="Editar" position="left">
                    <button className="text-sky-500 hover:text-sky-700 cursor-pointer">
                      <Pencil size={16} className="mr-2" />
                    </button>
                  </ToolTip>
                ) : (
                  <ToolTip text="Sem permissão" position="left">
                    <button className="text-gray-400 cursor-not-allowed">
                      <PencilOff size={16} className="mr-2" />
                    </button>
                  </ToolTip>
                )}
              </div>
            </div>
            <p><strong>Razão Social:</strong> {unidadeSelecionada.razaoSocial}</p>
            <p><strong>CNPJ:</strong> {formatarDocumento(unidadeSelecionada.documento, 'cnpj')}</p>
            <p><strong>Endereço:</strong> {unidadeSelecionada.endereco}, {unidadeSelecionada.numero} {unidadeSelecionada.complemento} - {unidadeSelecionada.bairro}, {unidadeSelecionada.cidade}/{unidadeSelecionada.uf} - {formatarDocumento(unidadeSelecionada.cep, 'cep')}</p>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          {/* Lista de setores */}
          <div className="w-80 bg-gray-50 overflow-y-auto py-3 px-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-md font-semibold">Lista de Setores</h2>

              {podeEditar && unidadeSelecionada && (
                <ToolTip text="Adicionar" position="left">
                  <button
                    className="text-sm text-gray-700 bg-white hover:bg-gray-100 cursor-pointer border border-gray-200 hover:border-gray-300 rounded p-2"
                  >
                    <CirclePlus size={14} />
                  </button>
                </ToolTip>
              )}
            </div>

            {unidadeSelecionada ?
              (setores.length > 0 ? (
                setores.map((setor) => (
                  <ul className="space-y-2">
                    <li
                      key={setor.idSetor}
                      className={`text-center px-4 py-2 rounded hover:shadow-sm cursor-pointer border border-gray-200 hover:border-gray-300 ${setorSelecionado?.idSetor === setor.idSetor ? "bg-gray-200" : "bg-white"}`}
                      onClick={() => setSetorSelecionado(setorSelecionado?.idSetor === setor.idSetor ? null : setor)}
                    >
                      <h1 className="font-semibold">
                        {setor.nome}
                      </h1>
                    </li>
                  </ul>
                ))
              ) : (
                <>
                  <button className={`block w-full px-4 py-2 rounded mb-1 cursor-pointer bg-gray-200 text-gray-500 font-medium text-center text-sm`}>
                    Nenhum setor cadastrado!
                  </button>
                </>
              )
              ) : (
                <>
                  <button className={`block w-full px-4 py-2 rounded mb-1 cursor-pointer bg-gray-200 text-gray-500 font-medium text-center text-sm`}>
                    Selecione uma unidade para ver os setores!
                  </button>
                </>
              )}
          </div>

          <div className={`flex-1 overflow-y-auto p-4`}>
            {setorSelecionado && (
              <>
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-bold mb-2">{setorSelecionado?.nome}</h1>
                  {podeEditar ? (
                    <ToolTip text="Editar" position="left">
                      <button className="text-sky-500 hover:text-sky-700 cursor-pointer">
                        <Pencil size={16} className="mr-2" />
                      </button>
                    </ToolTip>
                  ) : (
                    <ToolTip text="Sem permissão" position="left">
                      <button className="text-gray-400 cursor-not-allowed">
                        <PencilOff size={16} className="mr-2" />
                      </button>
                    </ToolTip>
                  )}
                </div>
                <div className="border-b border-gray-300 mb-4" />
              </>
            )}

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-md font-semibold">Lista de Cargos</h2>
              {podeEditar && setorSelecionado && (
                <ToolTip text="Adicionar" position="left">
                  <button
                    className="text-sm text-gray-700 bg-white hover:bg-gray-100 cursor-pointer border border-gray-200 hover:border-gray-300 rounded p-2"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <CirclePlus size={14} />
                    </div>
                  </button>
                </ToolTip>
              )}
            </div>


            {setorSelecionado ? (
              <div className="space-y-4">
                {cargos.map((cargo) => (
                  <div key={cargo.idCargo} className="bg-white rounded hover:shadow border border-gray-200 cursor-pointer">
                    {/* Cabeçalho do cargo */}
                    <button
                      onClick={() =>
                        setCargoSelecionado(cargoSelecionado?.idCargo === cargo.idCargo ? null : cargo)
                      }
                      className="w-full text-left px-4 py-2 font-semibold text-gray-700 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        {cargo.nome}
                        <div className="flex items-center gap-1">
                          {cargoSelecionado?.idCargo === cargo.idCargo ? (
                            <>
                              {podeEditar ? (
                                <ToolTip text="Editar" position="left">
                                  <button className="text-sky-500 hover:text-sky-700 cursor-pointer">
                                    <Pencil size={15} className="mr-2" />
                                  </button>
                                </ToolTip>
                              ) : (
                                <ToolTip text="Sem permissão" position="left">
                                  <button className="text-gray-400 cursor-not-allowed">
                                    <PencilOff size={15} className="mr-2" />
                                  </button>
                                </ToolTip>
                              )}
                              <ChevronUp size={16} className="text-gray-400" />
                            </>
                          ) : (
                            <ChevronDown size={16} className="text-gray-400" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Se estiver selecionado, mostra a tabela de funcionários */}
                    {cargoSelecionado?.idCargo === cargo.idCargo && (
                      <div className="p-4">
                        <div className="flex items-center justify-end mb-2">
                          {podeEditar && setorSelecionado && (
                            <ToolTip text="Adicionar" position="left">
                              <button
                                className="text-sm text-gray-700 bg-white hover:bg-gray-100 cursor-pointer border border-gray-200 hover:border-gray-300 rounded p-2"
                              >
                                <div className="flex items-center justify-center gap-1">
                                  <CirclePlus size={14} />
                                  <p className="text-xs font-medium">Novo Funcionário</p>
                                </div>
                              </button>
                            </ToolTip>
                          )}
                        </div>
                        {funcionarios.length > 0 ? (
                          <table className="w-full text-xs border border-gray-200 text-center">
                            <thead>
                              <tr className="bg-gray-100">
                                <th className="px-3 py-2">Nome</th>
                                <th className="px-3 py-2">Email</th>
                                <th className="px-3 py-2">Ações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {funcionarios.map((f) => (
                                <tr key={f.idUsuario} className="border-t border-gray-300">
                                  <td className="px-3 py-2">{f.nome}</td>
                                  <td className="px-3 py-2">{f.email}</td>
                                  <td className="px-3 py-2 flex items-center justify-center gap-4">
                                    {podeEditar ? (
                                      <ToolTip text="Editar" position="left">
                                        <button className="text-sky-500 hover:text-sky-700 cursor-pointer">
                                          <Pencil size={15} />
                                        </button>
                                      </ToolTip>
                                    ) : (
                                      <ToolTip text="Sem permissão" position="left">
                                        <button className="text-gray-400 cursor-not-allowed">
                                          <PencilOff size={15} />
                                        </button>
                                      </ToolTip>
                                    )}
                                    <input
                                      type="checkbox"
                                      checked={!f.ativo}
                                      className="h-4 w-4"
                                    />
                                  </td>
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
        </div >
      </div >

      {/* Modais */}
      {/* <ModalBase
        titulo="Cadastrar Funcionário"
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
      >
      </ModalBase> */}

    </>
  );
}