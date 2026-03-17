import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  clearSelectedCompany,
  getSelectedCompany,
  setSelectedCompany,
  type SelectedCompany,
} from "../auxiliares/saberStorage";

type CompanyContextType = {
  selectedCompany: SelectedCompany | null;
  companyId: number | null;
  enterCompany: (company: SelectedCompany) => void;
  leaveCompany: () => void;
};

const CompanyContext = createContext({} as CompanyContextType);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [selectedCompany, setSelectedCompanyState] = useState<SelectedCompany | null>(null);

  useEffect(() => {
    const company = getSelectedCompany();
    setSelectedCompanyState(company);
  }, []);

  useEffect(() => {
    if (user?.fkEmpresaId) {
      const current = getSelectedCompany();

      if (!current || current.idEmpresa !== user.fkEmpresaId) {
        const fixedCompany = {
          idEmpresa: user.fkEmpresaId,
          razaoSocial: user.empresa?.razaoSocial || "",
          nomeFantasia: user.empresa?.nomeFantasia || "",
          cnpj: user.empresa?.cnpj || "",
        };

        setSelectedCompany(fixedCompany);
        setSelectedCompanyState(fixedCompany);
      }
    }
  }, [user]);

  const enterCompany = (company: SelectedCompany) => {
    setSelectedCompany(company);
    setSelectedCompanyState(company);
  };

  const leaveCompany = () => {
    clearSelectedCompany();
    setSelectedCompanyState(null);
  };

  const companyId = user?.fkEmpresaId ?? selectedCompany?.idEmpresa ?? null;

  const value = useMemo(
    () => ({
      selectedCompany,
      companyId,
      enterCompany,
      leaveCompany,
    }),
    [selectedCompany, companyId]
  );

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  return useContext(CompanyContext);
}