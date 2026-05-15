import { Request, Response } from 'express';
import {
  buscarUsuario,
  criarUsuario,
  editarUsuario,
  buscarRolesComPermissoes,
  verificarHorarioAcesso,
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

    const usuarios = await buscarUsuario(params);

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