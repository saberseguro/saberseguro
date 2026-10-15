import { Router } from 'express';
import { auth } from 'firebase-admin';
import { prisma } from '../config/prisma-client';
import { authorize } from '../middlewares/authorize';

const router = Router();
router.post('/:id/configurar-acesso', authorize(['editar_usuarios']), async (req, res) => {
  let criado: string | undefined;
  try {
    const idUsuario = Number(req.params.id);
    if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) return res.status(400).json({ error: 'Funcionário inválido.' });
    const usuario = await prisma.usuario.findUnique({ where: { idUsuario }, include: { usuariorole: true, usuariohorario: true } });
    if (!usuario || (!req.user?.roles.includes('admin') && (!req.user?.fkEmpresaId || req.user.fkEmpresaId !== usuario.fkEmpresaId))) return res.status(403).json({ error: 'Sem permissão para configurar este acesso.' });
    if (usuario.firebaseId) return res.status(409).json({ error: 'Este funcionário já possui acesso configurado.' });
    const { email, senha } = req.body;
    if (typeof email !== 'string' || email.length > 250 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof senha !== 'string' || senha.length < 6) return res.status(400).json({ error: 'Informe um e-mail válido e uma senha com pelo menos 6 caracteres.' });
    if (!usuario.usuariorole.length || !usuario.usuariohorario.some(h => h.permitido)) return res.status(400).json({ error: 'Salve o perfil e os horários do funcionário antes de configurar o acesso.' });
    const existente = await prisma.usuario.findFirst({ where: { email: email.toLowerCase(), NOT: { idUsuario } } });
    if (existente) return res.status(409).json({ error: 'E-mail já cadastrado.' });
    const firebase = await auth().createUser({ email: email.toLowerCase(), password: senha, displayName: usuario.nome });
    criado = firebase.uid;
    await prisma.$transaction(async tx => {
      const atualizado = await tx.usuario.updateMany({ where: { idUsuario, firebaseId: null }, data: { email: email.toLowerCase(), firebaseId: firebase.uid, trocarsenha: true, editado_em: new Date() } });
      if (atualizado.count !== 1) throw new Error('O acesso foi alterado por outra operação. Atualize a página.');
      await tx.logevento.create({ data: { fkUsuarioId: req.user!.idUsuario, tipo: 'editar', entidade: 'usuario', entidade_id: idUsuario, descricao: 'Acesso de funcionário importado configurado.' } });
    });
    criado = undefined;
    return res.json({ message: 'Acesso configurado.' });
  } catch (error) {
    if (criado) {
      try { await auth().deleteUser(criado); }
      catch { console.error('Falha ao reverter conta Firebase da configuração de acesso:', criado); }
    }
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Não foi possível configurar o acesso.' });
  }
});
export default router;
