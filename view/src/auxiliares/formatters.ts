export function formatarData(data?: string | Date): string {
  if (!data) return "";
  const date = typeof data === "string" ? new Date(data) : data;
  return date.toLocaleDateString("pt-BR");
}

export function formatarCEP(cep: string): string {
  const clean = cep.replace(/\D/g, "");
  return clean.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}

export function formatarCPF(cpf: string): string {
  const clean = cpf.replace(/\D/g, "");
  return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

export function formatarCNPJ(cnpj: string): string {
  const clean = cnpj.replace(/\D/g, "");
  return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

export function formatarCAEPF(caepf: string): string {
  const clean = caepf.replace(/\D/g, "");
  return clean.replace(/^(\d{8})(\d{6})$/, "$1/$2");
}

export function formatarRG(rg: string): string {
  return rg.replace(/\D/g, "").replace(/^(\d{2})(\d{3})(\d{3})(\d?)$/, "$1.$2.$3-$4");
}

export function formatarCNH(cnh: string): string {
  return cnh.replace(/\D/g, "").replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1 $2 $3 $4");
}

export function formatarDocumento(doc: string, type: string): string {
  if (!doc || !type) {
    console.error("Dados ausentes");
    return "";
  };

  const clean = doc.replace(/\D/g, "");

  switch (type) {
    case 'rg': return formatarRG(clean);
    case 'cnh': return formatarCNH(clean);
    case 'caepf': return formatarCAEPF(clean);
    case 'cnpj': return formatarCNPJ(clean);
    case 'cpf': return formatarCPF(clean);
    case 'cep': return formatarCEP(clean);
    default: return doc;
  }
}

// exemplo: formatador
export function formatarMinutosEmHoras(min?: number): string {
  const minutes = Number.isFinite(min) && (min as number) >= 0 ? (min as number) : 0;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}min`;
  if (h) return `${h}h`;
  return `${m}min`;
}

export function formatarTelefone(telefone: string): string {
  const clean = telefone.replace(/\D/g, "");
  return clean.replace(/^(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3");
}