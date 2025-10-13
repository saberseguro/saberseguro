import { useAuth } from "../../contexts/AuthContext";
import logo from "../../assets/media/logotipos/logo_h_azul_preto.png";
import { LogOut } from "lucide-react";

export default function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center bg-white p-4 rounded border border-gray-300">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold text-gray-600">
          Bem-vindo {user?.nome}
        </h1>
        <button
          onClick={logout}
          className="text-red-600 p-2 rounded-full hover:bg-red-500 hover:text-white cursor-pointer flex items-center gap-2"
        >
          <LogOut size={20} />
        </button>
      </div>
      <img src={logo} alt="" className="h-32 my-10" />
    </div>
  );
}
