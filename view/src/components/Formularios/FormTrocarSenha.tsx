import { useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { auth } from "../../services/firebase";
import toast from "react-hot-toast";
import Spinner from "../Spinner";
import { Input } from "./Inputs";
import { useAuth } from "../../contexts/AuthContext";

interface FormTrocarSenhaProps {
  atualizarTrocaSenha: (idUsuario: number) => Promise<void>;
}

export default function FormTrocarSenha({ atualizarTrocaSenha }: FormTrocarSenhaProps) {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [senhaVerificada, setSenhaVerificada] = useState(false);

  const { user } = useAuth();

  const handleValidarSenha = async () => {
    try {
      setLoading(true);
      const usuario = auth.currentUser;
      if (!usuario || !usuario.email) throw new Error("Usuário não autenticado");

      const credenciais = EmailAuthProvider.credential(usuario.email, senhaAtual);
      await reauthenticateWithCredential(usuario, credenciais);

      setSenhaVerificada(true);
      toast.success("Senha atual verificada!");
    } catch (err: any) {
      toast.error("Senha atual incorreta.");
      setSenhaVerificada(false);
    } finally {
      setLoading(false);
    }
  };

  const handleTrocarSenha = async (e: React.FormEvent) => {
    e.preventDefault();

    if (novaSenha.length < 6) {
      toast.error("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (novaSenha !== confirmacao) {
      toast.error("As senhas não coincidem.");
      return;
    
    }

    if (novaSenha === senhaAtual) {
      toast.error("A nova senha deve ser diferente da senha atual.");
      return;
    }

    try {
      setLoading(true);
      const usuario = auth.currentUser;
      if (!usuario) throw new Error("Usuário não autenticado");

      await updatePassword(usuario, novaSenha);

      if (user?.idUsuario) {
        await atualizarTrocaSenha(user.idUsuario);
      }

      toast.success("Senha alterada com sucesso!");
      setNovaSenha("");
      setConfirmacao("");
      setSenhaAtual("");
      setSenhaVerificada(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao trocar senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleTrocarSenha}>
      {!senhaVerificada && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Input
            type="password"
            label="Senha Atual"
            name="senhaAtual"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
          />
        </div>
      )}

      {!senhaVerificada ? (
        <div className="flex justify-end">
          <button
            type="button"
            disabled={loading || senhaAtual.length === 0}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 cursor-pointer"
            onClick={handleValidarSenha}
          >
            {loading ? <Spinner /> : "Validar Senha"}
          </button>
        </div>
      ) : (
        <>
          {/* Etapa 2 - Nova senha */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input
              type="password"
              label="Nova Senha"
              name="novaSenha"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
            />
            <Input
              type="password"
              label="Confirmar Nova Senha"
              name="confirmacao"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 cursor-pointer"
            >
              {loading ? <Spinner /> : "Trocar Senha"}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
