import { Request, Response } from 'express';
import {
  buscarUsuario,
  criarUsuario,
  editarUsuario,
  buscarRolesComPermissoes,
  verificarHorarioAcesso,
  buscarUsuarioDetalhado,
  buscarUsuarioEmailEEmpresa,
  gerarLinkRedefinicaoSenha,
} from '../models/usuario';

export const buscarUsuarioController = async (req: Request, res: Response) => {
  try {
    const { idUsuario, fkEmpresaId, fkCargoId, fkResponsavelTecnicoId } = req.query;

    const params = {
      idUsuario: idUsuario ? parseInt(idUsuario as string) : undefined,
      fkEmpresaId: fkEmpresaId ? parseInt(fkEmpresaId as string) : undefined,
      fkCargoId: fkCargoId ? parseInt(fkCargoId as string) : undefined,
      fkResponsavelTecnicoId: fkResponsavelTecnicoId ? parseInt(fkResponsavelTecnicoId as string) : undefined,
    };

    // Correção de segurança: o model já suportava restringir a busca por
    // idUsuario à própria empresa de quem não é admin (contexto), mas o
    // controller nunca repassava esse contexto — então, na prática, qualquer
    // usuário autenticado conseguia buscar idUsuario de OUTRA empresa.
    const usuarioLogado = (req as any).user;
    const isAdmin = Array.isArray(usuarioLogado?.roles) && usuarioLogado.roles.includes("admin");

    const usuarios = await buscarUsuario(params, {
      isAdmin,
      fkEmpresaId: usuarioLogado?.fkEmpresaId,
    });

    if (!usuarios || usuarios.length === 0) {
      return res.status(404).json({ error: 'Nenhum usuário encontrado' });
    }

    return res.json(usuarios);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const criarUsuarioController = async (req: Request, res: Response) => {
  try {
    const idUsuario = (req.user as any)?.idUsuario;
    const { nome, cpf, telefone, email, senha, ativo, fkEmpresaId, fkCargoId, fkResponsavelTecnicoId, roles, horarios, cursos, medidas } = req.body;

    if (!nome || !email || !senha || !roles || roles.length === 0) {
      return res.status(400).json({ error: "Nome, email, senha e roles são obrigatórios." });
    }

    const usuario = await criarUsuario({
      nome,
      cpf,
      telefone,
      email,
      senha,
      ativo,
      fkEmpresaId,
      fkCargoId,
      fkResponsavelTecnicoId,
      roles,
      idUsuario,
      horarios,
      cursos,
      medidas,
    });

    res.status(201).json(usuario);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

export const editarUsuarioController = async (req: Request, res: Response) => {
  try {
    const editadoPor = (req.user as any)?.idUsuario;
    const idUsuario = parseInt(req.params.id);

    const { nome, cpf, telefone, ativo, fkCargoId, fkEmpresaId, fkResponsavelTecnicoId, roles, horarios, cursos, medidas } = req.body;

    await editarUsuario({
      idUsuario,
      nome,
      cpf,
      telefone,
      ativo,
      fkCargoId,
      fkEmpresaId,
      fkResponsavelTecnicoId,
      roles,
      editadoPor,
      horarios,
      cursos,
      medidas
    });

    res.status(200).json({ message: 'Usuário atualizado com sucesso' });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Detalhes completos de UM funcionário (roles, horários, cursos/medidas),
// usado pelo modal de edição pra não depender do resumo (às vezes leve, sem
// esses campos) que a tela de origem tinha em mãos.
export const buscarDetalhesUsuarioController = async (req: Request, res: Response) => {
  try {
    const idUsuario = parseInt(req.params.id);
    if (!idUsuario || Number.isNaN(idUsuario)) {
      return res.status(400).json({ error: "ID do usuário inválido." });
    }

    const usuario = await buscarUsuarioDetalhado(idUsuario);
    if (!usuario) return res.status(404).json({ error: "Usuário não encontrado" });

    // Mesma regra de segurança das demais buscas de usuário: quem não é
    // admin só pode ver detalhes de funcionários da própria empresa.
    const usuarioLogado = (req as any).user;
    const isAdmin = Array.isArray(usuarioLogado?.roles) && usuarioLogado.roles.includes("admin");
    if (!isAdmin && usuario.fkEmpresaId !== usuarioLogado?.fkEmpresaId) {
      return res.status(403).json({ error: "Sem permissão para acessar este usuário." });
    }

    return res.json(usuario);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

// Gera o link de redefinição de senha do funcionário pra copiar e mandar
// manualmente (o e-mail automático do Firebase pode não chegar/cair no
// spam). O e-mail usado é sempre o que está cadastrado no banco — nunca o
// que vier do corpo da requisição — pra não dar pra ninguém gerar link de
// redefinição pra um e-mail arbitrário.
export const gerarLinkRedefinicaoSenhaController = async (req: Request, res: Response) => {
  try {
    const idUsuario = parseInt(req.params.id);
    if (!idUsuario || Number.isNaN(idUsuario)) {
      return res.status(400).json({ error: "ID do usuário inválido." });
    }

    const usuario = await buscarUsuarioEmailEEmpresa(idUsuario);
    if (!usuario) return res.status(404).json({ error: "Usuário não encontrado" });
    if (!usuario.email) return res.status(400).json({ error: "Funcionário sem e-mail cadastrado." });

    const usuarioLogado = (req as any).user;
    const isAdmin = Array.isArray(usuarioLogado?.roles) && usuarioLogado.roles.includes("admin");
    if (!isAdmin && usuario.fkEmpresaId !== usuarioLogado?.fkEmpresaId) {
      return res.status(403).json({ error: "Sem permissão para acessar este usuário." });
    }

    const link = await gerarLinkRedefinicaoSenha(usuario.email);

    return res.json({ link });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Erro ao gerar link de redefinição de senha." });
  }
};

export const buscarRoleComPermissoes = async (req: Request, res: Response) => {
  try {
    const roles = await buscarRolesComPermissoes();

    const resultado = roles.map((role) => ({
      idRole: role.idRole,
      nome: role.nome,
      permissoes: role.rolepermissao.map((rp) => rp.permissao.nome),
    }));

    return res.status(200).json(resultado);
  } catch (error: any) {
    console.error("Erro ao buscar roles:", error);
    return res.status(500).json({ error: "Erro ao buscar roles com permissões" });
  }
};

export async function verificarHorarioAcessoController(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email é obrigatório." });
    }

    const horario = await verificarHorarioAcesso(email);

    if (!horario) {
      return res.status(404).json({ error: "Horário de acesso não encontrado." });
    }

    return res.status(200).json(horario);
  } catch (error: any) {
    console.error("Erro ao verificar horário:", error);
    return res.status(500).json({ error: "Erro ao verificar horário de acesso." });
  }
}