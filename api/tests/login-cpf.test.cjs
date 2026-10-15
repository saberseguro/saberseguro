const { test } = require('node:test');
const assert = require('node:assert/strict');
const { autenticarCpf, normalizarCpfLogin, verificarSenhaFirebase, ERRO_CREDENCIAIS } = require('../dist/models/auth/loginCpf');

function dependencias() {
  const chamadas = [];
  return { chamadas,
    buscarUsuario: async cpf => { chamadas.push(['buscar', cpf]); return { firebaseId: 'uid-1', ativo: 1 }; },
    buscarConta: async uid => ({ uid, email: 'interno@cpf.saberseguro.invalid', disabled: false }),
    verificarSenha: async (email, senha) => { chamadas.push(['senha', email, senha]); return { localId: 'uid-1', idToken: 'firebase-token' }; },
    validarAcesso: async token => { chamadas.push(['acesso', token]); return { token: 'sessao', usuario: { idUsuario: 1 } }; },
    criarToken: async uid => { chamadas.push(['custom', uid]); return 'custom-token'; },
  };
}

test('login CPF normaliza máscara e valida senha antes de liberar sessão Firebase', async () => {
  const deps = dependencias(); const result = await autenticarCpf('012.345.678-90', 'senha', deps);
  assert.equal(deps.chamadas[0][1], '01234567890');
  assert.deepEqual(deps.chamadas.map(c => c[0]), ['buscar', 'senha', 'acesso', 'custom']);
  assert.equal(result.customToken, 'custom-token'); assert.equal(result.token, 'sessao');
  assert.equal(result.email, undefined);
});
test('login CPF também aceita conta Firebase com e-mail real existente', async () => {
  const deps = dependencias(); deps.buscarConta = async uid => ({ uid, email: 'pessoa@example.com', disabled: false });
  await autenticarCpf('01234567890', 'senha', deps);
  assert.equal(deps.chamadas[1][1], 'pessoa@example.com');
});
test('CPF inválido, inexistente, conta pendente e conta inativa retornam erro genérico', async () => {
  assert.equal(normalizarCpfLogin('012abc34567890'), null);
  for (const usuario of [null, { firebaseId: null, ativo: 1 }, { firebaseId: 'uid-1', ativo: 0 }]) {
    const deps = dependencias(); deps.buscarUsuario = async () => usuario;
    await assert.rejects(() => autenticarCpf('01234567890', 'senha', deps), { message: ERRO_CREDENCIAIS });
    assert.equal(deps.chamadas.length, 0);
  }
  await assert.rejects(() => autenticarCpf('123', 'senha', dependencias()), { message: ERRO_CREDENCIAIS });
});
test('senha incorreta, UID diferente ou conta desabilitada nunca recebem custom token', async () => {
  for (const caso of ['senha', 'uid', 'desabilitada']) {
    const deps = dependencias();
    if (caso === 'senha') deps.verificarSenha = async () => { throw new Error(ERRO_CREDENCIAIS); };
    if (caso === 'uid') deps.verificarSenha = async () => ({ localId: 'outra-pessoa', idToken: 'token' });
    if (caso === 'desabilitada') deps.buscarConta = async uid => ({ uid, email: 'a@example.com', disabled: true });
    await assert.rejects(() => autenticarCpf('01234567890', 'senha', deps), { message: ERRO_CREDENCIAIS });
    assert.ok(!deps.chamadas.some(c => c[0] === 'custom'));
  }
});
test('regras de horário da aplicação continuam bloqueando o acesso', async () => {
  const deps = dependencias(); deps.validarAcesso = async () => { throw new Error('Fora do horário permitido'); };
  await assert.rejects(() => autenticarCpf('01234567890', 'senha', deps), /horário/);
  assert.ok(!deps.chamadas.some(c => c[0] === 'custom'));
});
test('REST usa endpoint fixo, password e não repassa erros internos do Firebase', async () => {
  const result = await verificarSenhaFirebase('a@example.com', 'senha', 'key', async (url, options) => {
    assert.equal(url, 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=key');
    assert.deepEqual(JSON.parse(options.body), { email: 'a@example.com', password: 'senha', returnSecureToken: true });
    return { ok: true, json: async () => ({ localId: 'uid', idToken: 'token' }) };
  });
  assert.equal(result.localId, 'uid');
  await assert.rejects(() => verificarSenhaFirebase('a@example.com', 'senha', 'key', async () => ({ ok: false })), { message: ERRO_CREDENCIAIS });
});
