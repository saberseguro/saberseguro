const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ProcessosImportacao } = require('../dist/models/importacao/processosImportacao');
const turno = () => new Promise(resolve => setImmediate(resolve));

test('processo responde imediatamente, informa progresso e impede duplicação', async () => {
  const manager = new ProcessosImportacao(); let liberar; let execucoes = 0;
  const final = new Promise(resolve => { liberar = resolve; });
  const job = manager.iniciar(10, 1, 'assinatura', async informar => {
    execucoes++; informar({ fase: 'acessos', concluidos: 12, total: 30, mensagem: 'Criando acessos' });
    await final; return { funcionario: { criar: 30 } };
  });
  assert.equal(job.status, 'executando');
  assert.equal(manager.iniciar(10, 1, 'assinatura', async () => assert.fail()).id, job.id);
  assert.throws(() => manager.iniciar(10, 1, 'outra', async () => {}), /em andamento/);
  await turno(); assert.equal(job.progresso.concluidos, 12); assert.equal(execucoes, 1);
  liberar(); await turno();
  assert.equal(job.status, 'concluido'); assert.equal(job.resultado.funcionario.criar, 30);
  assert.equal(manager.ativo(10, 1), undefined);
  assert.equal(manager.iniciar(10, 1, 'assinatura', async () => assert.fail()).id, job.id);
});

test('consulta de progresso exige usuário e empresa corretos', async () => {
  const manager = new ProcessosImportacao(); const job = manager.iniciar(10, 1, 'assinatura', async () => ({}));
  assert.equal(manager.buscar(job.id, 20, 1), undefined);
  assert.equal(manager.buscar(job.id, 10, 2), undefined);
  assert.equal(manager.buscar(job.id, 10, 1), job);
  await turno();
});

test('erro permanece consultável e só libera nova tentativa depois da compensação', async () => {
  const manager = new ProcessosImportacao();
  const job = manager.iniciar(10, 1, 'assinatura', async () => { throw new Error('Falha revertida'); });
  await turno(); assert.equal(job.status, 'erro'); assert.equal(job.erro, 'Falha revertida');
  assert.equal(manager.buscar(job.id, 10, 1), job);
  const novo = manager.iniciar(10, 1, 'assinatura', async () => ({}));
  assert.notEqual(novo.id, job.id); await turno(); assert.equal(novo.status, 'concluido');
});
