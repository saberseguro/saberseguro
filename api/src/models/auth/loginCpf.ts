export const ERRO_CREDENCIAIS = 'CPF ou senha inválidos.';

export function normalizarCpfLogin(valor: unknown): string | null {
  if (typeof valor !== 'string' || !/^[\d.\-\s]+$/.test(valor)) return null;
  const cpf = valor.replace(/\D/g, '');
  return /^\d{11}$/.test(cpf) ? cpf : null;
}

interface Dependencias<T> {
  buscarUsuario: (cpf: string) => Promise<{ firebaseId: string | null; ativo: number } | null>;
  buscarConta: (uid: string) => Promise<{ uid: string; email?: string; disabled: boolean }>;
  verificarSenha: (email: string, senha: string) => Promise<{ localId: string; idToken: string }>;
  validarAcesso: (idToken: string) => Promise<T>;
  criarToken: (uid: string) => Promise<string>;
}

// O identificador interno nunca é exposto antes de autenticar a senha.
export async function autenticarCpf<T>(cpfInformado: unknown, senha: unknown, deps: Dependencias<T>) {
  const cpf = normalizarCpfLogin(cpfInformado);
  if (!cpf || typeof senha !== 'string' || !senha || senha.length > 4096) throw new Error(ERRO_CREDENCIAIS);
  const usuario = await deps.buscarUsuario(cpf);
  if (!usuario?.firebaseId || usuario.ativo !== 1) throw new Error(ERRO_CREDENCIAIS);
  let conta;
  try { conta = await deps.buscarConta(usuario.firebaseId); }
  catch { throw new Error(ERRO_CREDENCIAIS); }
  if (!conta.email || conta.disabled || conta.uid !== usuario.firebaseId) throw new Error(ERRO_CREDENCIAIS);
  const credencial = await deps.verificarSenha(conta.email, senha);
  if (credencial.localId !== usuario.firebaseId || !credencial.idToken) throw new Error(ERRO_CREDENCIAIS);
  // Mesmas verificações de empresa, ativo, horários, roles e logs do login por e-mail.
  const sessao = await deps.validarAcesso(credencial.idToken);
  const customToken = await deps.criarToken(usuario.firebaseId);
  return { ...sessao, customToken };
}

export async function verificarSenhaFirebase(email: string, senha: string, apiKey: string, request: typeof fetch = fetch) {
  if (!apiKey) throw new Error('Login por CPF indisponível: configure FIREBASE_WEB_API_KEY na API.');
  let response;
  try {
    response = await request(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: senha, returnSecureToken: true }),
      signal: AbortSignal.timeout(15000),
    });
  } catch { throw new Error('Serviço de autenticação indisponível. Tente novamente.'); }
  if (!response.ok) throw new Error(ERRO_CREDENCIAIS);
  const data = await response.json() as { localId?: string; idToken?: string };
  if (!data.localId || !data.idToken) throw new Error(ERRO_CREDENCIAIS);
  return { localId: data.localId, idToken: data.idToken };
}
