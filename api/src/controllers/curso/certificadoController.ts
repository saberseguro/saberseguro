import { Request, Response } from "express";
import {
  listarModelosCertificado,
  criarModeloCertificado,
  editarModeloCertificado,
  excluirModeloCertificado,
  buscarModeloCertificado
} from "../../models/curso/certificado";

export const listarModelosCertificadoController = async (req: Request, res: Response) => {
  try {
    const usuario = req.user;
    const resultado = await listarModelosCertificado.execute(usuario);
    res.json(resultado);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Erro ao listar modelos de certificado." });
  }
};

export const buscarModeloCertificadoController = async (req: Request, res: Response) => {
  try {
    const usuario = req.user;
    const id = Number(req.params.id);
    const resultado = await buscarModeloCertificado.execute(id, usuario);
    res.json(resultado);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Erro ao buscar modelo de certificado." });
  }
};

export const criarModeloCertificadoController = async (req: Request, res: Response) => {
  try {
    const usuario = req.user;
    const resultado = await criarModeloCertificado.execute(req.body, usuario);
    res.status(201).json(resultado);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Erro ao criar modelo de certificado." });
  }
};

export const editarModeloCertificadoController = async (req: Request, res: Response) => {
  try {
    const usuario = req.user;
    const id = Number(req.params.id);
    const resultado = await editarModeloCertificado.execute(id, req.body, usuario);
    res.json(resultado);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Erro ao editar modelo de certificado." });
  }
};

export const excluirModeloCertificadoController = async (req: Request, res: Response) => {
  try {
    const usuario = req.user;
    const id = Number(req.params.id);
    const resultado = await excluirModeloCertificado.execute(id, usuario);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Erro ao excluir modelo de certificado." });
  }
};