import { Request, Response } from "express";
import { atualizarAssinatura, loginUser, trocarSenha } from "../models/auth/loginUser";
import { registrarEvento } from "../shared/utils/registrarEvento";

export async function login(req: Request, res: Response) {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: "ID Token ausente" });
  }

  try {
    const result = await loginUser(idToken);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(401).json({ message: error.message });
  }
}

export async function atualizarSenha(req: Request, res: Response) {
  const { idUsuario } = req.body;

  if (!idUsuario) {
    return res.status(400).json({ error: "idUsuario é obrigatório." });
  }

  try {
    const usuario = await trocarSenha(Number(idUsuario));
    return res.json({ ok: true, usuario });
  } catch (error: any) {
    console.error("Erro ao atualizar trocarsenha:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }
    return res.status(500).json({ error: error.message || "Erro interno ao atualizar trocarsenha." });
  }
}

export async function atualizarAssinaturaController(req: Request, res: Response) {
  const { url, idUsuario } = req.body;

  if (!url) {
    return res.status(400).json({ error: "Parametros inválidos." });
  }

  try {
    const usuario = await atualizarAssinatura(url, idUsuario);
    return res.json({ ok: true, usuario });
  } catch (error: any) {
    console.error("Erro ao atualizar assinatura:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }
    return res.status(500).json({ error: error.message || "Erro interno ao atualizar assinatura." });
  }
}

export async function logout(req: Request, res: Response) {
  const user = req.user;

  if (!user || !user.idUsuario) {
    return res.status(401).json({ message: "Usuário não autenticado." });
  }

  await registrarEvento({
    idUsuario: user.idUsuario,
    tipo: "logout",
  });

  return res.status(200).json({ message: "Logout bem-sucedido" });
}

export async function verifyToken(req: Request, res: Response) {
  try {
    if (!req.user?.idUsuario) {
      return res.status(401).json({ valid: false });
    }

    return res.status(200).json({ valid: true });
  } catch {
    return res.status(401).json({ valid: false });
  }
}
