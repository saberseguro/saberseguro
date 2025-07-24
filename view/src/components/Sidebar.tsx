import { createContext, useContext } from "react";
import {
  Home,
  Boxes,
  HeartHandshake,
  ChevronFirst,
  ChevronLast,
  Settings,
  LogOut,
} from "lucide-react";

import ToolTip from "./Auxiliares/ToolTip";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Props
interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

interface SidebarItemProps {
  icon: React.ReactNode;
  text: string;
  path: string;
}

const SidebarContext = createContext<{ isOpen: boolean } | undefined>(undefined);

export default function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const { user, logout } = useAuth();
  console.log(user);
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === "/login") {
    return null;
  }

  const menuItems = [
    { label: "Home", icon: <Home />, path: "/", permissoes: [] },
    { label: "Empresa", icon: <Boxes />, path: "/empresa", permissoes: ["gerenciar_usuarios"] },
    { label: "Cursos", icon: <HeartHandshake />, path: "/cursos", permissoes: ["visualizar_cursos"] },
  ];

  return (
    <aside className={`min-h-screen transition-all duration-300 ${isOpen ? "w-64" : "w-20"}`}>
      <nav className="h-full flex flex-col bg-white border-r border-gray-300 shadow-sm">
        {/* Header */}
        <div className={`flex items-center h-16 px-4 border-b border-gray-300 ${isOpen ? "justify-between" : "justify-center"}`}>
          {isOpen && <span className="text-lg font-bold text-center w-full text-gray-700">AVA</span>}
          <ToolTip text={isOpen ? "Minimizar" : "Expandir"} position="right" key={isOpen ? "open" : "closed"}>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-gray-100 transition cursor-pointer"
            >
              {isOpen ? <ChevronFirst size={18} /> : <ChevronLast size={18} />}
            </button>
          </ToolTip>
        </div>

        <SidebarContext.Provider value={{ isOpen }}>
          <ul className="flex-1 space-y-1 px-2 py-4">
            {menuItems
              .filter((item) =>
                item.permissoes.length === 0 ||
                (user?.permissoes && item.permissoes.some(p => user.permissoes!.includes(p)))
              )
              .map((item) => (
                <SidebarItem key={item.label} icon={item.icon} text={item.label} path={item.path} />
              ))}

          </ul>
        </SidebarContext.Provider>

        {/* Footer */}
        <div className="border-t border-gray-300 p-3">
          <div className={`flex ${isOpen ? "items-center gap-3" : "flex-col items-center"}`}>
            {isOpen ? (
              <>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{user?.nome}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <ToolTip text="Configurações" position="top">
                    <button onClick={() => navigate("/")}>
                      <Settings className="text-gray-400 hover:text-gray-700" size={16} />
                    </button>
                  </ToolTip>
                  <ToolTip text="Sair" position="top">
                    <button onClick={logout}>
                      <LogOut className="text-gray-400 hover:text-gray-700" size={16} />
                    </button>
                  </ToolTip>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <ToolTip text="Configurações" position={`${isOpen ? 'top' : 'right'}`}>
                  <button className="cursor-pointer" onClick={() => navigate("/")}>
                    <Settings className="text-gray-400 hover:text-gray-700" size={16} />
                  </button>
                </ToolTip>
                <ToolTip text="Sair" position={`${isOpen ? 'top' : 'right'}`}>
                  <button className="cursor-pointer" onClick={logout}>
                    <LogOut className="text-gray-400 hover:text-gray-700" size={16} />
                  </button>
                </ToolTip>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">v 1.0.0</p>
        </div>
      </nav>
    </aside>
  );
}

function SidebarItem({ icon, text, path }: SidebarItemProps) {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("SidebarItem must be used within SidebarContext");
  const { isOpen } = context;
  const location = useLocation();
  const isActive = location.pathname === path;

  return (
    <li>
      <Link to={path}>
        <div
          className={`
            flex p-2 cursor-pointer rounded transition-all
            ${isOpen ? "items-center" : "flex-col items-center justify-center"}
            ${isActive
              ? "border-l-4 border-sky-700 text-gray-600 hover:text-sky-700"
              : "text-gray-600 hover:text-gray-800"
            }
          `}
        >
          <span className={`text-xl ${isOpen ? "" : "mb-1"}`}>
            {isOpen ? (
              <>
                {icon}
              </>
            ) : (
              <>
                <ToolTip text={text} position="right">
                  {icon}
                </ToolTip>
              </>
            )}
          </span>
          {isOpen && (
            <span className="ml-3 text-sm font-medium transition-all">
              {text}
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}