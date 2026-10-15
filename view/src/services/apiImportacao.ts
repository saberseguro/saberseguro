export interface ProcessoImportacao<T = unknown> {
  id: string;
  empresaId: number;
  usuarioId: number;
  status: 'executando' | 'concluido' | 'erro';
  progresso: { fase: 'validando' | 'acessos' | 'banco' | 'revertendo'; concluidos: number; total: number; mensagem: string };
  iniciadoEm: number;
  atualizadoEm: number;
  resultado?: T;
  erro?: string;
}

export async function consultarImportacao<T>(empresaId: number, id: string | null): Promise<ProcessoImportacao<T> | null> {
  const caminho = id ? `/processos/${encodeURIComponent(id)}` : '/processos/ativo';
  const response = await fetch(`${import.meta.env.VITE_API_URL}/importacao${caminho}?empresaId=${empresaId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, signal: AbortSignal.timeout(15000), cache: 'no-store',
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Não foi possível consultar o andamento. Verifique a conexão e sua sessão. A importação pode continuar no servidor.');
  const data = await response.json();
  return id ? data : data.processo;
}
