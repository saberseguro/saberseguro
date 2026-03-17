const SABER_STORAGE_KEY = "@saberseguro";

export type SelectedCompany = {
  idEmpresa: number;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj?: string;
};

type SaberStorage = {
  selectedCompany: SelectedCompany | null;
};

export function getSaberStorage(): SaberStorage {
  const raw = localStorage.getItem(SABER_STORAGE_KEY);

  if (!raw) {
    return { selectedCompany: null };
  }

  try {
    return JSON.parse(raw);
  } catch {
    return { selectedCompany: null };
  }
}

export function setSaberStorage(data: SaberStorage) {
  localStorage.setItem(SABER_STORAGE_KEY, JSON.stringify(data));
}

export function getSelectedCompany(): SelectedCompany | null {
  return getSaberStorage().selectedCompany;
}

export function setSelectedCompany(company: SelectedCompany | null) {
  const current = getSaberStorage();

  setSaberStorage({
    ...current,
    selectedCompany: company,
  });
}

export function clearSelectedCompany() {
  const current = getSaberStorage();

  setSaberStorage({
    ...current,
    selectedCompany: null,
  });
}