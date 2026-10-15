import { randomUUID } from 'crypto';

// Domínio reservado, sem caixa postal. CPF e identificador de login não viram e-mail de contato.
export function novoEmailInternoFirebase() {
  return `${randomUUID().replace(/-/g, '')}@cpf.saberseguro.invalid`;
}
