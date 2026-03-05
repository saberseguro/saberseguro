import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import FormTrocarSenha from "../components/Formularios/FormTrocarSenha";
import FormAssinaturaUsuario from "../components/Formularios/FormAssinaturaUsuario";
import { LogOut } from "lucide-react";
import ToolTip from "../components/Auxiliares/ToolTip";

export default function AjustesObrigatoriosPage() {
  const { state } = useLocation() as {
    state: {
      precisaTrocarSenha: boolean;
      precisaAdicionarAssinatura: boolean;
    };
  };

  const navigate = useNavigate();
  const { user, atualizarTrocaSenha, logout } = useAuth();

  useEffect(() => {
    if (!state || (!state.precisaTrocarSenha && !state.precisaAdicionarAssinatura)) {
      navigate("/cursos/meuscursos");
    }
  }, [state]);

  return (
    <>
      <div className="bg-gray-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between bg-white py-4 px-8 border-b border-gray-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-sky-800">
              Olá, {user?.nome?.split(" ")[0]} 👋
            </h1>
            <p className="text-gray-600 text-sm">
              Antes de continuar, você precisa concluir os seguintes ajustes obrigatórios!
            </p>
          </div>
          <div>
            <ToolTip text="Sair" position="bottom">
              <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md cursor-pointer"> <LogOut size={16} /> </button>
            </ToolTip>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="w-10/12 mx-auto bg-white mt-8 p-6 rounded-md shadow-md space-y-10">
          {state?.precisaTrocarSenha && (
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3 border-b pb-1 border-gray-200">
                🔒 Trocar Senha
              </h2>
              <FormTrocarSenha atualizarTrocaSenha={atualizarTrocaSenha} />
            </section>
          )}

          {state?.precisaAdicionarAssinatura && (
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3 border-b pb-1 border-gray-200">
                ✍️ Adicionar Assinatura
              </h2>
              <FormAssinaturaUsuario />
            </section>
          )}

        </div>
      </div>
      <div className="flex justify-end w-10/12 mx-auto mt-4">
        <button
          disabled={!user?.assinatura || user?.trocarsenha}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-sm cursor-pointer disabled:bg-gray-400 disabled:hover:bg-gray-400 disabled:cursor-not-allowed"
          onClick={() => navigate('/cursos/meuscursos')}
        >
          Confirmar Alterações
        </button>
      </div>
    </>
  );
}