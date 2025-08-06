import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-hot-toast";
import ModalAcesso from "../../components/Modais/ModalAcesso";

export default function LoginPage() {
  const { login, handleVerificarHorarioAcesso, horarioAcesso, setHorarioAcesso } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [modalAberto, setModalAberto] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    await toast.promise(
      login(email, senha),
      {
        loading: "Entrando...",
        success: "Login realizado com sucesso!",
        error: (err) => err.message || "Erro ao fazer login",
      }
    );
    navigate("/");
  };

  return (
    <div className="min-h-screen flex">
      {/* Lado esquerdo - Formulário */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white">
        <form onSubmit={handleLogin} className="max-w-md w-full px-6 space-y-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center">Bem-vindo de Volta</h2>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded text-sm"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-4 py-2 border rounded text-sm"
              placeholder="••••••••"
              required
            />
            <div className="text-right">
              <a href="#" className="text-sm text-blue-600 hover:underline">
                Esqueceu a senha?
              </a>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded cursor-pointer"
          >
            Entrar
          </button>

          <div className="w-full flex justify-center">
            <button
              type="button"
              className="cursor-pointer text-sm text-gray-600 hover:text-blue-600 hover:underline"
              onClick={() => {
                if (!email) {
                  setHorarioAcesso(null);
                  toast.error("Por favor, insira um e-mail");
                  return;
                }
                setModalAberto(true);
                handleVerificarHorarioAcesso(email);
              }}
            >
              Verificar horários de acesso
            </button>
          </div>

          <ModalAcesso
            aberto={modalAberto}
            onClose={() => setModalAberto(false)}
            horarios={horarioAcesso || []}
          />

        </form>
      </div>

      {/* Lado direito - Banner */}
      <div className="hidden md:flex md:w-1/2 bg-blue-600 text-white flex-col justify-center p-12">
        {/* <img src="/logo.svg" alt="Logo" className="w-12 h-12 mb-6" /> */}
        <h1 className="text-5xl font-black mb-4">AVA - Saúde e Segurança</h1>
        <h2 className="text-3xl font-bold mb-4">
          Aprimore seus conhecimentos em Saúde e Segurança do Trabalho
        </h2>
        <p className="text-blue-100  mb-6">
          Cursos online desenvolvidos para capacitar profissionais de segurança e saúde no trabalho com conteúdo atualizado, prático e com certificação.
        </p>
        <div className="flex items-center -space-x-4">
          <img className="w-10 h-10 border-2 border-white rounded-full" src="https://randomuser.me/api/portraits/women/79.jpg" alt="" />
          <img className="w-10 h-10 border-2 border-white rounded-full" src="https://randomuser.me/api/portraits/men/85.jpg" alt="" />
          <img className="w-10 h-10 border-2 border-white rounded-full" src="https://randomuser.me/api/portraits/women/65.jpg" alt="" />
          <img className="w-10 h-10 border-2 border-white rounded-full" src="https://randomuser.me/api/portraits/men/32.jpg" alt="" />
          <span className="ml-6 text-sm text-blue-100">
            Mais de <strong>15 mil</strong> profissionais capacitados
          </span>
        </div>
      </div>

    </div >
  );
}