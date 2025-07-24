import { Request, Response } from "express";
import { loginUser } from "../useCases/auth/loginUser";
import { registrarEvento } from "../shared/utils/registrarEvento";
import { VerifyToken } from "../useCases/auth/verifyToken";

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
