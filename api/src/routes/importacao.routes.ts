import { Router, json } from 'express';
import { Prisma } from '@prisma/client';
import { authorize } from '../middlewares/authorize';
import { prisma } from '../config/prisma-client';
import { env } from '../config/env';
import { lerModelo1, listar } from '../models/importacao/modelo1';
import admin from '../infra/firebase/firebase';
import { comNovosAcessos, validarOpcoesAcesso } from '../models/importacao/acessosImportacao';
import { assinaturaImportacao, validarAssinatura, prepararImportacao, gravarImportacao, validarEmpresaSelecionada, ContextoImportacao } from '../models/importacao/importacao';
import { ProcessosImportacao } from '../models/importacao/processosImportacao';
import { InformarProgresso } from '../models/importacao/progressoImportacao';

const router = Router();
const processos = new ProcessosImportacao();
router.use(authorize(['ver_empresas', 'ver_usuarios', 'editar_empresas']));
router.use(json({ limit: '14mb' }));

router.get('/processos/ativo', (req, res) => {
  try {
    const contexto = { ...req.user!, empresaSelecionadaId: Number(req.query.empresaId) };
    validarEmpresaSelecionada(contexto);
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ processo: processos.ativo(contexto.idUsuario, contexto.empresaSelecionadaId) ?? null });
  } catch (error) { return res.status(400).json({ error: error instanceof Error ? error.message : 'Empresa inválida.' }); }
});
router.get('/processos/:id', (req, res) => {
  try {
    const contexto = { ...req.user!, empresaSelecionadaId: Number(req.query.empresaId) };
    validarEmpresaSelecionada(contexto);
    res.setHeader('Cache-Control', 'no-store');
    const processo = processos.buscar(String(req.params.id), contexto.idUsuario, contexto.empresaSelecionadaId);
    if (!processo) return res.status(404).json({ error: 'Processo não encontrado. Se a API foi reiniciada, gere uma nova prévia e confira os cadastros antes de importar novamente.' });
    return res.json(processo);
  } catch (error) { return res.status(400).json({ error: error instanceof Error ? error.message : 'Empresa inválida.' }); }
});

for (const confirmar of [false, true]) router.post(confirmar ? '/confirmar' : '/previa', async (req, res) => {
  try {
    const { modelo, arquivo, nomeArquivo, assinatura, expira, senhaInicial, horarioInicio, horarioFim } = req.body || {};
    const contexto: ContextoImportacao = { ...req.user!, empresaSelecionadaId: req.body?.empresaId };
    validarEmpresaSelecionada(contexto);
    if (modelo !== 'modelo1' || typeof nomeArquivo !== 'string' || !/\.xlsx$/i.test(nomeArquivo) || typeof arquivo !== 'string' || arquivo.length > 14_000_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(arquivo)) {
      return res.status(400).json({ error: 'Selecione o Modelo 1 e envie um arquivo XLSX de até 10 MB.' });
    }
    const buffer = Buffer.from(arquivo, 'base64');
    if (buffer.length > 10 * 1024 * 1024 || buffer.toString('ascii', 0, 2) !== 'PK') return res.status(400).json({ error: 'Arquivo XLSX inválido ou maior que 10 MB.' });
    if (!confirmar) {
      const previa = await prepararImportacao(prisma, await lerModelo1(buffer), contexto);
      const expira = Date.now() + 30 * 60_000;
      return res.json({ ...previa, expira, assinatura: assinaturaImportacao(previa, contexto, expira, env.JWT_SECRET) });
    }
    if (!Number.isSafeInteger(expira) || expira < Date.now() || expira > Date.now() + 30 * 60_000 || typeof assinatura !== 'string' || !/^[a-f0-9]{64}$/.test(assinatura)) return res.status(409).json({ error: 'Prévia inválida ou expirada. Gere uma nova prévia antes de confirmar.' });
    const executar = async (informar: InformarProgresso) => {
      try {
        const dados = await lerModelo1(buffer);
        const validarPrevia = (previa: Awaited<ReturnType<typeof prepararImportacao>>) => {
          if (previa.erros.length) throw new Error(previa.erros[0]);
          if (!validarAssinatura(assinatura, assinaturaImportacao(previa, contexto, expira, env.JWT_SECRET))) throw new Error('Os dados mudaram desde a prévia. Gere uma nova prévia e confira as alterações.');
        };
        const previa = await prepararImportacao(prisma, structuredClone(dados), contexto);
        validarPrevia(previa);
        const opcoes = previa.acessosNovos ? validarOpcoesAcesso(senhaInicial, horarioInicio, horarioFim) : { senha: '', inicio: '', fim: '' };
        let idRole: number | undefined;
        if (listar(previa.empresas).some(i => i.perfilPendente)) {
          const roles = await prisma.role.findMany({ where: { nome: 'funcionario' } });
          if (roles.length !== 1) throw new Error('Cadastre um único perfil funcionario antes de importar novos acessos.');
          idRole = roles[0].idRole;
        }
        return await comNovosAcessos(previa, opcoes.senha, admin.auth(), contas => {
          informar({ fase: 'banco', concluidos: 0, total: 0, mensagem: 'Revalidando e preparando a gravação em lotes' });
          return prisma.$transaction(async tx => {
            const atual = await prepararImportacao(tx, structuredClone(dados), contexto);
            validarPrevia(atual);
            return gravarImportacao(tx, atual, contexto, { contas, idRole, horarioInicio: opcoes.inicio, horarioFim: opcoes.fim }, informar);
          }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 10000, timeout: 120000 });
        }, async uid => !!await prisma.usuario.findUnique({ where: { firebaseId: uid }, select: { idUsuario: true } }),
        uid => console.error('Verificar compensação da conta Firebase de importação:', uid), informar);
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError) throw new Error('Não foi possível concluir o lote no banco. Gere uma nova prévia e verifique conflitos nos cadastros.');
        throw err;
      }
    };
    const processo = processos.iniciar(contexto.idUsuario, contexto.empresaSelecionadaId, assinatura, executar);
    return res.status(202).json(processo);
  } catch (err) {
    return res.status(400).json({ error: err instanceof Error ? err.message : 'Não foi possível importar a planilha.' });
  }
});
export default router;
