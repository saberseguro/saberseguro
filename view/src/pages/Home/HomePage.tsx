import { useAuth } from "../../contexts/AuthContext";

export default function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center bg-white">
      <h1 className="text-3xl font-bold mb-4 text-blue-500">
        Bem-vindo ao AVA, {user?.email}
      </h1>
      <button
        onClick={logout}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Sair
      </button>
    </div>
  );
}
