import { randomUUID } from 'crypto';
import { InformarProgresso, ProgressoImportacao } from './progressoImportacao';

export interface ProcessoImportacao<T = unknown> {
  id: string;
  empresaId: number;
  usuarioId: number;
  status: 'executando' | 'concluido' | 'erro';
  progresso: ProgressoImportacao;
  iniciadoEm: number;
  atualizadoEm: number;
  resultado?: T;
  erro?: string;
}

// A API atual é um único processo. Guarda somente status/resumo, nunca planilha ou senha.
// Para múltiplas réplicas, substituir este registro por uma fila persistente compartilhada.
export class ProcessosImportacao {
  private processos = new Map<string, ProcessoImportacao>();
  private chaves = new Map<string, string>();
  private ativos = new Map<number, string>();

  buscar(id: string, usuarioId: number, empresaId: number) {
    const processo = this.processos.get(id);
    return processo?.usuarioId === usuarioId && processo.empresaId === empresaId ? processo : undefined;
  }

  ativo(usuarioId: number, empresaId: number) {
    const id = this.ativos.get(empresaId);
    return id ? this.buscar(id, usuarioId, empresaId) : undefined;
  }

  iniciar<T>(usuarioId: number, empresaId: number, assinatura: string,
    executar: (informar: InformarProgresso) => Promise<T>) {
    for (const [id, p] of this.processos) if (p.status !== 'executando' && p.atualizadoEm < Date.now() - 2 * 60 * 60_000) this.processos.delete(id);
    for (const [chave, id] of this.chaves) if (!this.processos.has(id)) this.chaves.delete(chave);
    const chave = `${usuarioId}:${empresaId}:${assinatura}`;
    const anterior = this.chaves.get(chave);
    if (anterior) return this.processos.get(anterior)!;
    if (this.ativos.has(empresaId)) throw new Error('Já existe uma importação em andamento nesta empresa. Aguarde a conclusão.');
    if (this.ativos.size >= 4) throw new Error('Há outras importações em andamento. Aguarde um instante para começar.');
    const processo: ProcessoImportacao<T> = {
      id: randomUUID(), usuarioId, empresaId, status: 'executando', iniciadoEm: Date.now(), atualizadoEm: Date.now(),
      progresso: { fase: 'validando', concluidos: 0, total: 0, mensagem: 'Validando arquivo e cadastros' },
    };
    this.processos.set(processo.id, processo);
    this.chaves.set(chave, processo.id);
    this.ativos.set(empresaId, processo.id);
    const informar: InformarProgresso = progresso => { processo.progresso = progresso; processo.atualizadoEm = Date.now(); };
    void Promise.resolve().then(() => executar(informar)).then(resultado => {
      processo.resultado = resultado; processo.status = 'concluido';
    }, erro => {
      processo.status = 'erro'; processo.erro = erro instanceof Error ? erro.message : 'Não foi possível concluir a importação.';
    }).finally(() => {
      processo.atualizadoEm = Date.now(); this.ativos.delete(empresaId);
      if (processo.status === 'erro') this.chaves.delete(chave);
    });
    return processo;
  }
}
