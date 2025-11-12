import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useState } from "react";

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  // Telas em que o sidebar não aparece
  const esconderSidebar =
    location.pathname === "/login" ||
    location.pathname === "/ajustes" ||
    location.pathname.startsWith("/cursos/playcurso");

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar fixa */}
      {!esconderSidebar && (
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      )}

      {/* Conteúdo com scroll */}
      <main
        className={`
          flex-1
          overflow-y-auto
          bg-gray-100
          transition-all
          duration-300
          ${!esconderSidebar && "p-4"}
        `}
      >
        <Outlet />
      </main>
    </div>
  );
}
