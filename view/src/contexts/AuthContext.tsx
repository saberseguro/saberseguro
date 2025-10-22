import { createContext, useContext, useEffect, useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { apiFetch } from "../services/apiFetch";
import type { Usuario, HorarioAcesso } from "../types/Usuario";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL;

interface AuthContextType {
  user: Usuario | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<Usuario>;
  atualizarTrocaSenha: (idUsuario: number) => Promise<void>;
  atualizarAssinatura: (url: string, idUsuario: number) => Promise<void>;
  logout: () => Promise<void>;
  token: string | null;
  handleVerificarHorarioAcesso: (email: string) => Promise<void>;
  horarioAcesso: HorarioAcesso | null;
  setHorarioAcesso: React.Dispatch<React.SetStateAction<HorarioAcesso | null>>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [horarioAcesso, setHorarioAcesso] = useState<HorarioAcesso | null>(null);

  useEffect(() => {
    const restaurarSessao = async () => {
      const token = localStorage.getItem("token");
      const userLocal = localStorage.getItem("user");

      if (!token || !userLocal) {
        await logout();
        setLoading(false);
        return;
      };

      try {
        const res = await fetch(`${API_URL}/auth/verify`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Token inválido");

        setUser(JSON.parse(userLocal));
      } catch {
        await logout();
      } finally {
        setLoading(false);
      }
    };

    restaurarSessao();
  }, []);

  const login = async (email: string, senha: string): Promise<Usuario> => {
    try {
      setLoading(true);
      const cred = await signInWithEmailAndPassword(auth, email, senha);
      const firebaseUser = cred.user;
      const firebaseToken = await firebaseUser.getIdToken();

      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: firebaseToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Erro ao validar no backend.");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.usuario));
      setUser(data.usuario);
      setToken(data.token);

      return data.usuario;
    } catch (err: any) {
      console.error("Erro no login:", err);
      throw new Error(err.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const atualizarTrocaSenha = async (idUsuario: number): Promise<void> => {
    try {
      await apiFetch(`/confirmar-troca-senha`, {
        method: "POST",
        body: JSON.stringify({ idUsuario }),
      });

      if (user) {
        const usuarioAtualizado = { ...user, trocarsenha: false };
        setUser(usuarioAtualizado);
        localStorage.setItem("user", JSON.stringify(usuarioAtualizado));
      }

    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar status de troca de senha.");
      throw error;
    }
  };

  const atualizarAssinatura = async (url: string, idUsuario: Number): Promise<void> => {
    try {
      await apiFetch(`/atualizar-assinatura`, {
        method: "POST",
        body: JSON.stringify({ url: url, idUsuario: idUsuario }),
      });

      if (user) {
        const usuarioAtualizado = { ...user, assinatura: url };
        setUser(usuarioAtualizado);
        localStorage.setItem("user", JSON.stringify(usuarioAtualizado));
      }

    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar status de troca de senha.");
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);

      if (token) {
        const res = await fetch(`${API_URL}/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || data.erro);
        }
      }

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    }
  };

  const handleVerificarHorarioAcesso = async (email: string): Promise<void> => {
    if (!email) return Promise.resolve();

    try {
      const data = await apiFetch<HorarioAcesso>(`/usuario/verificarHorarioAcesso`, {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      setHorarioAcesso(data);
    } catch (error) {
      console.error("Erro ao verificar horário de acesso:", error);
      setHorarioAcesso(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, atualizarTrocaSenha, atualizarAssinatura, logout, token, handleVerificarHorarioAcesso, horarioAcesso, setHorarioAcesso }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
