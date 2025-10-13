import { useState, useEffect } from "react";
import type { Empresa, Unidade, Setor, Cargo, Funcionario } from "../../types/EstruturaEmpresa";
import { searchEmpresas, getEmpresa, getUnidades, getSetores, getCargos, getFuncionarios } from "../../services/apiEmpresa";
import { useAuth } from "../../contexts/AuthContext";
import { formatarDocumento } from "../../auxiliares/formatters";
import { temPermissao } from "../../auxiliares/permissoes";

// Components
import ModalBase from "../../components/Modais/ModalBase";
import FormCadastroEmpresa from '../../components/Formularios/FormEmpresa';
import FormCadastroUnidade from '../../components/Formularios/FormUnidade';
import FormCadastroSetor from '../../components/Formularios/FormSetor';
import FormCadastroCargo from '../../components/Formularios/FormCargo';
import FormFuncionario from "../../components/Formularios/FormFuncionario";

// Icons
import { ChevronDown, ChevronUp, Pencil, PencilOff, CirclePlus, CircleCheck, CircleX } from 'lucide-react';
import ToolTip from "../../components/Auxiliares/ToolTip";
import { SearchDropdown } from "../../components/SearchDropDown";
import { getCursos } from "../../services/apiCurso";
import { getMedidas } from "../../services/apiMedida";

export default function GerenciaEmpresa() {

  const { user } = useAuth();

  const isAdmin = Array.isArray(user?.role) && user.role.includes("admin");

  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [idEmpresaSelecionada, setIdEmpresaSelecionada] = useState<number | null>(null);

  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<Unidade | null>(null);

  const [setores, setSetores] = useState<Setor[]>([]);
  const [setorSelecionado, setSetorSelecionado] = useState<Setor | null>(null);

  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [cargoSelecionado, setCargoSelecionado] = useState<Cargo | null>(null);

  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<Funcionario | null>(null);

  const [isOpenEmpresa, setIsOpenEmpresa] = useState(false);
  const [isOpenUnidade, setIsOpenUnidade] = useState(false);
  const [isOpenSetor, setIsOpenSetor] = useState(false);
  const [isOpenCargo, setIsOpenCargo] = useState(false);
  const [isOpenFuncionario, setIsOpenFuncionario] = useState(false);

  const [loadingEmpresa, setLoadingEmpresa] = useState(false);
  const [loadingUnidade, setLoadingUnidade] = useState(false);
  const [loadingSetor, setLoadingSetor] = useState(false);
  const [loadingCargo, setLoadingCargo] = useState(false);
  const [loadingFuncionario, setLoadingFuncionario] = useState(false);

  const podeEditar = temPermissao(user, ["editar_empresas"]);

  const [buscaEmpresa, setBuscaEmpresa] = useState("");

  const [cursosOptions, setCursosOptions] = useState<{ label: string; value: number }[]>([]);
  const [medidasOptions, setMedidasOptions] = useState<{ label: string; value: number }[]>([]);

  useEffect(() => {
    if (!isAdmin && user?.fkEmpresaId) {
      setIdEmpresaSelecionada(user.fkEmpresaId);
    }
  }, [user, isAdmin]);

  const fetchEmpresa = async () => {
    if (!idEmpresaSelecionada) return;

    setLoadingEmpresa(true);
    try {
      const empresaData = await getEmpresa(idEmpresaSelecionada);
      setEmpresa(empresaData);
    } catch (error) {
      console.error("Erro ao buscar empresa:", error);
      setEmpresa(null);
    } finally {
      setLoadingEmpresa(false);
    }
  };

  const fetchUnidades = async () => {
    if (!idEmpresaSelecionada) return;

    setLoadingUnidade(true);
    try {
      const unidadesData = await getUnidades(idEmpresaSelecionada);
      setUnidades(unidadesData);

      if (unidadeSelecionada) {
        const atualizada = unidadesData.find(u => u.idUnidade === unidadeSelecionada.idUnidade);
        setUnidadeSelecionada(atualizada ?? null);
      }
    } catch (error) {
      console.error("Erro ao buscar unidades:", error);
      setUnidades([]);
      setUnidadeSelecionada(null);
    } finally {
      setLoadingUnidade(false);
    }
  };

  const fetchSetores = async () => {
    if (!unidadeSelecionada) return;

    setLoadingSetor(true);
    try {
      const setoresData = await getSetores(unidadeSelecionada.idUnidade, idEmpresaSelecionada!);
      setSetores(setoresData);

      if (setorSelecionado) {
        const atualizada = setoresData.find(s => s.idSetor === setorSelecionado.idSetor);
        setSetorSelecionado(atualizada ?? null);
      }
    } catch (error) {
      console.error("Erro ao buscar setores:", error);
      setSetores([]);
      setSetorSelecionado(null);
    } finally {
      setLoadingSetor(false);
    }
  };

  const fetchCargos = async () => {
    if (!setorSelecionado) return;

    setLoadingCargo(true);
    try {
      const cargosData = await getCargos(setorSelecionado.idSetor, idEmpresaSelecionada!);
      setCargos(cargosData);

      if (cargoSelecionado) {
        const atualizada = cargosData.find(c => c.idCargo === cargoSelecionado.idCargo);
        setCargoSelecionado(atualizada ?? null);
      }
    } catch (error) {
      console.error("Erro ao buscar cargos:", error);
      setCargos([]);
      setCargoSelecionado(null);
    } finally {
      setLoadingCargo(false);
    }
  };

  const fetchFuncionarios = async () => {
    setLoadingFuncionario(true);
    try {
      if (cargoSelecionado) {
        const funcionariosData = await getFuncionarios(cargoSelecionado.idCargo, idEmpresaSelecionada!);
        setFuncionarios(funcionariosData);
        console.log(funcionariosData);
      } else {
        setFuncionarios([]);
      }
    } catch (error) {
      console.error("Erro ao buscar funcionários:", error);
      setFuncionarios([]);
    } finally {
      setLoadingFuncionario(false);
    }
  };

  const buscarCursos = async () => {
    const res = await getCursos({
      page: 1,
      busca: "",
      filtros: { fkEmpresaId: idEmpresaSelecionada!, includeGlobais: true },
      lean: true,
    });

    setCursosOptions(res.data.map((c: any) => ({ label: c.titulo, value: c.idCurso })));
  };

  const buscarMedidas = async () => {
    try {
      const res = await getMedidas({ ativo: 1 });
      setMedidasOptions(res.data.map((m: any) => ({ label: m.nome, value: m.idMedida })));
    } catch (err) {
      console.error("Erro ao carregar medidas", err);
    }
  }

  useEffect(() => {
    if (idEmpresaSelecionada) {
      fetchEmpresa();
      fetchUnidades();
      buscarCursos();
      buscarMedidas();
    }
  }, [idEmpresaSelecionada]);

  useEffect(() => {
    fetchSetores();
    setSetorSelecionado(null);
    setCargos([]);
    setFuncionarios([]);
  }, [unidadeSelecionada]);

  useEffect(() => {
    fetchCargos();
    setCargoSelecionado(null);
    setFuncionarios([]);
  }, [setorSelecionado]);

  useEffect(() => {
    fetchFuncionarios();
  }, [cargoSelecionado]);

  const handleSelectUnidade = (unidade: Unidade) => {
    if (unidade.idUnidade === unidadeSelecionada?.idUnidade) {
      setUnidadeSelecionada(null);
      setSetores([]);
      setSetorSelecionado(null);
      setCargos([]);
      setFuncionarios([]);
      return;
    } else {
      setUnidadeSelecionada(unidade);
      setSetores([]);
      setSetorSelecionado(null);
      setCargos([]);
      setFuncionarios([]);
      return;
    }
  };

  const handleSelectSetor = (setor: Setor) => {
    if (setor.idSetor === setorSelecionado?.idSetor) {
      setSetorSelecionado(null);
      setCargos([]);
      setFuncionarios([]);
      return;
    } else {
      setSetorSelecionado(setor);
      setCargos([]);
      setFuncionarios([]);
      return;
    }
  };

  const handleSelectCargo = (cargo: Cargo) => {
    if (cargo.idCargo === cargoSelecionado?.idCargo) {
      setCargoSelecionado(null);
      setFuncionarios([]);
      return;
    } else {
      setCargoSelecionado(cargo);
      setFuncionarios([]);
      return;
    }
  };

  return (
    <>
      <div className="flex flex-col h-full shadow-md rounded-md bg-white">
        {isAdmin && (
          <div className="p-4 border-b border-gray-300">
            <SearchDropdown<Empresa>
              placeholder="Buscar empresa..."
              valor={buscaEmpresa}
              onChange={setBuscaEmpresa}
              onSelect={(empresa) => {
                setIdEmpresaSelecionada(empresa.idEmpresa);
                setBuscaEmpresa("");
                setUnidadeSelecionada(null);
                setSetorSelecionado(null);
                setCargoSelecionado(null);
                setFuncionarios([]);
              }}
              buscar={searchEmpresas}
              renderItem={(e) => <span>{e.nomeFantasia}</span>}
              chaveUnica={(e) => e.idEmpresa}
            />
          </div>
        )}

        {/* Card Empresa */}
        {loadingEmpresa ? (
          <div className="p-4 border-b border-gray-300 text-sm animate-pulse space-y-2">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ) : (
          empresa && (
            <div className="p-4 border-b border-gray-300 text-sm">
              <div className="w-full flex justify-between items-center">
                <h1 className="text-2xl font-bold mb-2">{empresa.nomeFantasia}</h1>
                <div>
                  {podeEditar ? (
                    <ToolTip text="Editar" position="left">
                      <button className="text-sky-500 hover:text-sky-700 cursor-pointer" onClick={() => setIsOpenEmpresa(true)}>
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
          )
        )}


        {/* Tabs com as unidades */}
        <div className="flex items-center px-4 py-2 bg-white min-h-14 border-b border-gray-300 overflow-x-auto custom-scrollbar text-sm gap-2">
          <p className="font-light whitespace-nowrap">Unidades:</p>

          {podeEditar && (
            <ToolTip text="Adicionar" position="left">
              <button
                className="text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer rounded-md p-2 flex-shrink-0"
                onClick={() => { setUnidadeSelecionada(null); setIsOpenUnidade(true) }}
              >
                <CirclePlus size={18} />
              </button>
            </ToolTip>
          )}

          {loadingUnidade ? (
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-9 w-40 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          ) : unidades.length > 0 ? (
            <div className="flex gap-2">
              {unidades
                .sort((a, b) => {
                  const ativoDiff = (b.ativo ?? 0) - (a.ativo ?? 0);
                  if (ativoDiff !== 0) return ativoDiff;
                  return (b.idUnidade ?? 0) - (a.idUnidade ?? 0);
                })
                .map((unidade) => (
                  <button
                    key={unidade.idUnidade}
                    onClick={() => handleSelectUnidade(unidade)}
                    className={`px-4 py-2 rounded font-medium whitespace-nowrap flex-shrink-0 cursor-pointer flex items-center gap-1
                    ${unidadeSelecionada?.idUnidade === unidade.idUnidade
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                  >
                    {unidade.ativo === 1 ? (
                      <CircleCheck size={16} className={`${unidadeSelecionada?.idUnidade === unidade.idUnidade
                        ? "text-white"
                        : "text-green-600"
                        }`} />
                    ) : (
                      <CircleX size={16} className={`${unidadeSelecionada?.idUnidade === unidade.idUnidade
                        ? "text-white"
                        : "text-red-600"
                        }`} />
                    )}
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
              <div className="flex items-center gap-2">
                {unidadeSelecionada.ativo === 1 ? (
                  <CircleCheck size={16} className="text-green-600" />
                ) : (
                  <CircleX size={16} className="text-red-600" />
                )}
                {podeEditar ? (
                  <ToolTip text="Editar" position="left">
                    <button className="text-sky-500 hover:text-sky-700 cursor-pointer" onClick={() => setIsOpenUnidade(true)}>
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
                    onClick={() => { setSetorSelecionado(null); setIsOpenSetor(true) }}
                  >
                    <CirclePlus size={14} />
                  </button>
                </ToolTip>
              )}
            </div>

            {unidadeSelecionada ?
              (loadingSetor ? (
                <ul className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <li key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
                  ))}
                </ul>
              ) : setores.length > 0 ? (
                <ul className="space-y-6">
                  {setores
                    .sort((a, b) => {
                      const ativoDiff = (b.ativo ?? 0) - (a.ativo ?? 0);
                      if (ativoDiff !== 0) return ativoDiff;
                      return (b.idSetor ?? 0) - (a.idSetor ?? 0);
                    })
                    .map((setor) => (
                      <li
                        key={setor.idSetor}
                        className={`flex items-center gap-2 text-center mb-2 px-4 py-2 rounded hover:shadow-sm cursor-pointer border border-gray-200 hover:border-gray-300 ${setorSelecionado?.idSetor === setor.idSetor ? "bg-blue-600 text-white" : "bg-white"}`}
                        onClick={() => handleSelectSetor(setor)}
                      >
                        {setor.ativo === 1 ? (
                          <CircleCheck size={16} className={`${setorSelecionado?.idSetor === setor.idSetor ? "text-white" : "text-green-600"}`} />
                        ) : (
                          <CircleX size={16} className={`${setorSelecionado?.idSetor === setor.idSetor ? "text-white" : "text-red-600"}`} />
                        )}
                        <h1 className="font-semibold">{setor.nome}</h1>
                      </li>
                    ))}
                </ul>
              ) : (
                <div className="text-center font-medium text-sm text-gray-500 p-2 bg-white border border-gray-200 rounded cursor-not-allowed">Nenhum setor encontrado!</div>
              )) : (
                <>
                  <button className={`block w-full px-4 py-2 rounded mb-1 cursor-pointer bg-gray-200 text-gray-500 font-medium text-center text-sm`}>
                    Selecione uma unidade para ver os setores!
                  </button>
                </>
              )}
          </div>

          <div className={`flex-1 overflow-y-auto p-4`}>
            {/* Card Setor */}
            {setorSelecionado && (
              <>
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-bold mb-2">{setorSelecionado?.nome}</h1>
                  <div className="flex items-center gap-2">
                    {setorSelecionado?.ativo === 1 ? (
                      <CircleCheck size={16} className="text-green-600" />
                    ) : (
                      <CircleX size={16} className="text-red-600" />
                    )}
                    {podeEditar ? (
                      <ToolTip text="Editar" position="left">
                        <button className="text-sky-500 hover:text-sky-700 cursor-pointer" onClick={() => setIsOpenSetor(true)}>
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
                <p className="text-xs mb-2"><strong>Descrição:</strong> {setorSelecionado?.descricao}</p>
                <div className="border-b border-gray-300 mb-4" />
              </>
            )}

            {/* Listade Cargos */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-md font-semibold">Lista de Cargos</h2>
              {podeEditar && setorSelecionado && (
                <ToolTip text="Adicionar" position="left">
                  <button
                    className="text-sm text-gray-700 bg-white hover:bg-gray-100 cursor-pointer border border-gray-200 hover:border-gray-300 rounded p-2"
                    onClick={() => { setCargoSelecionado(null); setIsOpenCargo(true) }}
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
                {loadingCargo ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  cargos
                    .sort((a, b) => {
                      const ativoDiff = (b.ativo ?? 0) - (a.ativo ?? 0);
                      if (ativoDiff !== 0) return ativoDiff;
                      return (b.idCargo ?? 0) - (a.idCargo ?? 0);
                    })
                    .map((cargo) => (
                      <div key={cargo.idCargo} className="bg-white rounded hover:shadow border border-gray-200">
                        {/* Cabeçalho do cargo */}
                        <button
                          className="w-full text-left px-4 py-2 font-semibold text-gray-700"
                        >
                          <div className="flex items-center justify-between">
                            {cargo.nome}
                            <div className="flex items-center gap-1">
                              {cargo.ativo === 1 ? (
                                <CircleCheck size={16} className="text-green-600" />
                              ) : (
                                <CircleX size={16} className="text-red-600" />
                              )}
                              {cargoSelecionado?.idCargo === cargo.idCargo ? (
                                <>
                                  {podeEditar ? (
                                    <ToolTip text="Editar" position="left">
                                      <button className="text-sky-500 hover:text-sky-700 cursor-pointer" onClick={() => setIsOpenCargo(true)}>
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
                                  <ChevronUp size={16} className="text-gray-400 cursor-pointer" onClick={() => setCargoSelecionado(null)} />
                                </>
                              ) : (
                                <ChevronDown size={16} className="text-gray-400 cursor-pointer" onClick={() => handleSelectCargo(cargo)} />
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
                                    className="text-sm text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded p-2 cursor-pointer"
                                    onClick={() => { setFuncionarioSelecionado(null); setIsOpenFuncionario(true) }}
                                  >
                                    <div className="flex items-center justify-center gap-1">
                                      <CirclePlus size={14} />
                                      <p className="text-xs font-medium">Novo Funcionário</p>
                                    </div>
                                  </button>
                                </ToolTip>
                              )}
                            </div>
                            <table className="w-full text-xs border border-gray-200 text-center">
                              <thead>
                                <tr className="bg-gray-100">
                                  <th className="px-3 py-2">Nome</th>
                                  <th className="px-3 py-2">Email</th>
                                  <th className="px-3 py-2">Ações</th>
                                </tr>
                              </thead>
                              <tbody>
                                {loadingFuncionario ? (
                                  Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i} className="border-t border-gray-300 animate-pulse">
                                      <td className="px-3 py-3">
                                        <div className="h-4 bg-gray-200 rounded w-24 mx-auto" />
                                      </td>
                                      <td className="px-3 py-3">
                                        <div className="h-4 bg-gray-200 rounded w-32 mx-auto" />
                                      </td>
                                      <td className="px-3 py-3">
                                        <div className="h-4 bg-gray-200 rounded w-20 mx-auto" />
                                      </td>
                                    </tr>
                                  ))
                                ) : funcionarios.length > 0 ? (
                                  funcionarios.map((f) => (
                                    <tr key={f.idUsuario} className="border-t border-gray-300">
                                      <td className="px-3 py-2">{f.nome}</td>
                                      <td className="px-3 py-2">{f.email}</td>
                                      <td className="px-3 py-2 flex items-center justify-center gap-4">
                                        {podeEditar ? (
                                          <ToolTip text="Editar" position="left">
                                            <button
                                              className="text-sky-500 hover:text-sky-700 cursor-pointer"
                                              onClick={() => {
                                                setFuncionarioSelecionado(f);
                                                setIsOpenFuncionario(true);
                                              }}
                                            >
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

                                        {/* Ativo/Inativo */}
                                        {f.ativo === 1 ? (
                                          <ToolTip text="Ativo">
                                            <CircleCheck size={16} className="text-green-600" />
                                          </ToolTip>
                                        ) : (
                                          <ToolTip text="Inativo">
                                            <CircleX size={16} className="text-red-600" />
                                          </ToolTip>
                                        )}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={3} className="px-3 py-4 text-gray-500 italic">
                                      Nenhum funcionário cadastrado.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Selecione um setor para ver os cargos.</p>
            )}
          </div>
        </div >
      </div >

      {/* Modais */}
      <ModalBase
        titulo="Cadastro da Empresa"
        isOpen={isOpenEmpresa}
        onClose={() => setIsOpenEmpresa(false)}
        largura="max-w-8/12"
      >
        <FormCadastroEmpresa
          fetchEmpresa={fetchEmpresa}
          onEdit={empresa ?? undefined}
          setIsOpenEmpresa={setIsOpenEmpresa}
        />
      </ModalBase>

      <ModalBase
        titulo="Cadastro de Unidades"
        isOpen={isOpenUnidade}
        onClose={() => setIsOpenUnidade(false)}
        largura="max-w-8/12"
      >
        <FormCadastroUnidade
          fkEmpresaId={idEmpresaSelecionada ?? user?.fkEmpresaId ?? undefined}
          fetchUnidades={fetchUnidades}
          onEdit={unidadeSelecionada ?? undefined}
          setIsOpenUnidade={setIsOpenUnidade}
          cursosOptions={cursosOptions}
          medidasOptions={medidasOptions}
        />
      </ModalBase>

      <ModalBase
        titulo="Cadastro de Setores"
        isOpen={isOpenSetor}
        onClose={() => setIsOpenSetor(false)}
        largura="max-w-8/12"
      >
        <FormCadastroSetor
          fkUnidadeId={unidadeSelecionada?.idUnidade}
          fetchSetores={fetchSetores}
          onEdit={setorSelecionado ?? undefined}
          setIsOpenSetor={setIsOpenSetor}
          cursosOptions={cursosOptions}
          medidasOptions={medidasOptions}
        />
      </ModalBase>

      <ModalBase
        titulo="Cadastro de Cargos"
        isOpen={isOpenCargo}
        onClose={() => setIsOpenCargo(false)}
        largura="max-w-8/12"
      >
        <FormCadastroCargo
          fkSetorId={setorSelecionado?.idSetor}
          fetchCargos={fetchCargos}
          onEdit={cargoSelecionado ?? undefined}
          setIsOpenCargo={setIsOpenCargo}
          cursosOptions={cursosOptions}
          medidasOptions={medidasOptions}
        />
      </ModalBase>

      <ModalBase
        titulo="Cadastro de Funcionários"
        isOpen={isOpenFuncionario}
        onClose={() => setIsOpenFuncionario(false)}
        largura="max-w-8/12"
      >
        <FormFuncionario
          fkEmpresaId={idEmpresaSelecionada ?? user?.fkEmpresaId ?? undefined}
          fkCargoId={cargoSelecionado?.idCargo}
          onEdit={funcionarioSelecionado ?? undefined}
          setIsOpenFuncionario={setIsOpenFuncionario}
          fetchFuncionarios={fetchFuncionarios}
          isOpen={isOpenFuncionario}
          cursosOptions={cursosOptions}
          medidasOptions={medidasOptions}
        />

      </ModalBase>

    </>
  );
}