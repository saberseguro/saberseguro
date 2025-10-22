import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { CertificadosResumo } from "../types/EstruturaCurso";
import { getResumoCertificadoEmpresa } from "../services/apiEmpresa";
import { useAuth } from "./AuthContext";

interface CertificadosContextType {
  resumo: CertificadosResumo | null;
  atualizarResumo: () => Promise<void>;
}

const CertificadosContext = createContext<CertificadosContextType | undefined>(undefined);

export function CertificadosProvider({ children }: { children: ReactNode }) {
  const [resumo, setResumo] = useState<CertificadosResumo | null>(null);
  const { user } = useAuth();

  const atualizarResumo = async () => {
    try {
      if (!user?.fkEmpresaId) return;
      const data = await getResumoCertificadoEmpresa();
      setResumo(data);
    } catch (error) {
      console.error("Erro ao atualizar resumo de certificados:", error);
    }
  };

  // Carrega ao iniciar o app
  useEffect(() => {
    atualizarResumo();
  }, []);

  return (
    <CertificadosContext.Provider value={{ resumo, atualizarResumo }}>
      {children}
    </CertificadosContext.Provider>
  );
}

export function useCertificados() {
  const context = useContext(CertificadosContext);
  if (!context) {
    throw new Error("useCertificados deve ser usado dentro de <CertificadosProvider>");
  }
  return context;
}
