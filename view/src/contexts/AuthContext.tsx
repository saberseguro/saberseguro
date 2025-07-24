import { createContext, useContext, useEffect, useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../services/firebase";

const API_URL = import.meta.env.VITE_API_URL;

interface Usuario {
  idUsuario: number;
  email: string;
  nome: string;
  roles: string[];
  permissoes: string[];
  fkEmpresaId?: number;
  fkResponsavelTecnicoId?: number;
  fkCargoId?: number;
}

interface AuthContextType {
  user: Usuario | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  token: string | null;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  const login = async (email: string, senha: string): Promise<void> => {
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
    } catch (err: any) {
      console.error("Erro no login:", err);
      throw new Error(err.message || "Erro desconhecido");
    } finally {
      setLoading(false);
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

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
