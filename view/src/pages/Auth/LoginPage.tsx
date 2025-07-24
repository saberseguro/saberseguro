import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

import { toast } from "react-hot-toast";

export default function LoginPage() {

  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow w-96 space-y-4">
        <h1 className="text-2xl font-bold text-center text-gray-800">Login</h1>

        <input
          type="email"
          className="w-full border rounded px-4 py-2"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full border rounded px-4 py-2"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-sky-600 text-white py-2 rounded hover:bg-sky-700"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
