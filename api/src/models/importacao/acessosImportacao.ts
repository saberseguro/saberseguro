import { randomUUID } from 'crypto';
import { listar, ModeloImportacao } from './modelo1';
import { novoEmailInternoFirebase } from '../../services/auth/identificadorFirebase';
import { executarConcorrente, InformarProgresso } from './progressoImportacao';

export function validarOpcoesAcesso(senha: unknown, inicio: unknown, fim: unknown) {
  if (typeof senha !== 'string' || senha.length < 8 || senha.length > 128) throw new Error('Informe uma senha inicial entre 8 e 128 caracteres para os novos acessos.');
  const horario = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (typeof inicio !== 'string' || typeof fim !== 'string' || !horario.test(inicio) || !horario.test(fim) || inicio >= fim) throw new Error('Informe horários válidos, com início anterior ao fim.');
  return { senha, inicio, fim };
}

interface Provedor {
  createUser: (data: { uid: string; email: string; password: string; displayName: string; disabled: boolean }) => Promise<unknown>;
  deleteUser: (uid: string) => Promise<unknown>;
}

// Compensa apenas contas criadas por esta tentativa, nunca contas Firebase preexistentes.
export async function comNovosAcessos<T>(modelo: ModeloImportacao, senha: string, provedor: Provedor,
  gravar: (contas: Map<string, string>) => Promise<T>,
  estaVinculado: (uid: string) => Promise<boolean>,
  falhaLimpeza: (uid: string) => void,
  informar: InformarProgresso = () => {}) {
  const contas = new Map<string, string>();
  const pendentes = listar(modelo.empresas).filter(i => i.configurarAcesso);
  let concluidos = 0;
  try {
    informar({ fase: 'acessos', concluidos, total: pendentes.length, mensagem: 'Criando acessos no Firebase' });
    await executarConcorrente(pendentes, 8, async item => {
      const uid = `import-${randomUUID()}`;
      contas.set(item.chave, uid);
      try {
        await provedor.createUser({ uid, email: String(item.dados.email || item.atual?.email || novoEmailInternoFirebase()),
          password: senha, displayName: item.nome, disabled: item.atual?.ativo === '0' });
      } catch (erro) {
        if ((erro as { code?: string }).code === 'auth/too-many-requests' || (erro as { code?: string }).code === 'auth/quota-exceeded') throw new Error('O Firebase limitou a criação de contas. Aguarde a reversão antes de tentar novamente.');
        throw new Error(`Não foi possível criar o acesso do funcionário da linha ${item.linha}. Verifique se o e-mail já existe no Firebase e se a senha atende à política do projeto.`);
      }
      informar({ fase: 'acessos', concluidos: ++concluidos, total: pendentes.length, mensagem: 'Criando acessos no Firebase' });
    });
    return await gravar(contas);
  } catch (erro) {
    let revertidos = 0;
    informar({ fase: 'revertendo', concluidos: 0, total: contas.size, mensagem: 'Revertendo acessos após falha; aguarde antes de tentar novamente' });
    await executarConcorrente([...contas.values()], 8, async uid => {
      try {
        // Uma resposta de commit perdida não autoriza apagar uma conta que já foi vinculada.
        if (!await estaVinculado(uid)) await provedor.deleteUser(uid);
      } catch (falha) {
        if ((falha as { code?: string }).code !== 'auth/user-not-found') falhaLimpeza(uid);
      }
      informar({ fase: 'revertendo', concluidos: ++revertidos, total: contas.size, mensagem: 'Revertendo acessos após falha' });
    });
    throw erro;
  }
}
