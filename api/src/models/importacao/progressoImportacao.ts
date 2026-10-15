export interface ProgressoImportacao {
  fase: 'validando' | 'acessos' | 'banco' | 'revertendo';
  concluidos: number;
  total: number;
  mensagem: string;
}
export type InformarProgresso = (progresso: ProgressoImportacao) => void;

// Aguarda também os trabalhos já iniciados em caso de falha, antes de permitir compensação.
export async function executarConcorrente<T>(itens: T[], limite: number, executar: (item: T) => Promise<void>) {
  let indice = 0;
  let falhou = false;
  let erro: unknown;
  const trabalhador = async () => {
    while (!falhou && indice < itens.length) {
      const item = itens[indice++];
      try { await executar(item); }
      catch (e) { if (!falhou) erro = e; falhou = true; }
    }
  };
  await Promise.all(Array.from({ length: Math.min(Math.max(1, limite), itens.length) }, trabalhador));
  if (falhou) throw erro;
}

export function lotes<T>(itens: T[], tamanho = 300): T[][] {
  const resultado: T[][] = [];
  for (let i = 0; i < itens.length; i += tamanho) resultado.push(itens.slice(i, i + tamanho));
  return resultado;
}
