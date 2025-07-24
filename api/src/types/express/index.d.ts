import { UsuarioTokenPayload } from "../UsuarioTokenPayload";

export {};

declare global {
  namespace Express {
    interface Request {
      user?: UsuarioTokenPayload;
    }
  }
}
