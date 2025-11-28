import { Request, Response } from 'express';
import { buscarCursoCompleto, buscarCursoAcessos, buscarCursos, buscarMeusCursos, criarCurso, criarCursoAcesso, editarCurso, excluirCurso, excluirCursoAcesso, syncCurso, finalizarCurso, registrarCursoAcesso, vincularCertificado } from '../../models/curso/curso';
import { desvincularCursoDaMedida, listarMedidasDoCurso, vincularCursoNaMedida } from '../../models/medida';
import { listarCertificados, previewCertificado } from '../../models/curso/certificado';
import { registrarEvento } from '../../shared/utils/registrarEvento';

export const buscarCursoController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const curso = await buscarCursoCompleto.execute(Number(id), req.user as any);
    if (!curso) return res.status(404).json({ error: 'Curso não encontrado' });
    return res.json(curso);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const buscarCursosController = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const resultado = await buscarCursos.execute({
      ...req.query,
      user,
    });

    if (!resultado.data.length) {
      return res.status(404).json({ error: "Nenhum curso encontrado" });
    }

    return res.json(resultado);
  } catch (err: any) {
    console.error("Erro ao buscar cursos:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const buscarMeusCursosController = async (req: Request, res: Response) => {
  try {
    const usuario = req.user;

    const cursos = await buscarMeusCursos.execute(usuario);

    res.json(cursos);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Erro ao buscar cursos do usuário." });
  }
};

export const criarCursoController = async (req: Request, res: Response) => {
  try {
    const curso = await criarCurso.execute(req.body, req.user as any);
    return res.status(201).json(curso);
  } catch (err: any) {
    if (err.message?.includes("O curso precisa de pelo menos uma categoria válida")) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
};

export const editarCursoController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido.' });
    }

    const curso = await editarCurso.execute(id, req.body, req.user as any);
    return res.json(curso);
  } catch (err: any) {
    if (err.message?.includes("Nenhum curso encontrado")) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
};

export const excluirCursoController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido.' });
    }

    await excluirCurso.execute(id, req.user as any);
    return res.status(200).json({ message: 'Curso excluído com sucesso.' });
  } catch (err: any) {
    if (err.message?.includes("Nenhum curso encontrado")) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
};

// Adicionar Medidas
export const listarMedidasDoCursoController = async (req: Request, res: Response) => {
  try {
    const fkCursoId = Number(req.params.id);
    if (isNaN(fkCursoId)) return res.status(400).json({ error: 'ID inválido.' });

    const data = await listarMedidasDoCurso.execute(fkCursoId);
    return res.json(data);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const vincularMedidaAoCursoController = async (req: Request, res: Response) => {
  try {
    const fkCursoId = Number(req.params.id);
    const { fkMedidaId, validade } = req.body;

    if (isNaN(fkCursoId) || isNaN(Number(fkMedidaId))) {
      return res.status(400).json({ error: 'Dados inválidos.' });
    }

    if (validade !== undefined && isNaN(Number(validade))) {
      return res.status(400).json({ error: 'Campo "validade" deve ser número.' });
    }

    const vinculo = await vincularCursoNaMedida.execute(
      Number(fkMedidaId),
      fkCursoId,
      req.user as any,
      validade !== undefined ? Number(validade) : undefined
    );

    return res.status(201).json(vinculo);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const desvincularMedidaDoCursoController = async (req: Request, res: Response) => {
  try {
    const fkCursoId = Number(req.params.id);
    const fkMedidaId = Number(req.params.fkMedidaId);

    if (isNaN(fkCursoId) || isNaN(fkMedidaId)) {
      return res.status(400).json({ error: 'IDs inválidos.' });
    }

    await desvincularCursoDaMedida.execute(fkMedidaId, fkCursoId, req.user as any);
    return res.json({ message: 'Vínculo removido com sucesso.' });
  } catch (err: any) {
    if (err.message.includes('Vínculo não encontrado')) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
};

export const vincularCertificadoController = async (req: Request, res: Response) => {
  try {
    const idCurso = Number(req.params.id);
    const { fkCertificadoModeloId } = req.body;
    const usuario = req.user;

    const curso = await vincularCertificado.execute(idCurso, fkCertificadoModeloId, usuario);
    return res.json(curso);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Erro ao vincular certificado." });
  }
};

// Controlar Acessos
export const buscarCursoAcessosController = async (req: Request, res: Response) => {
  try {
    const idCurso = Number(req.params.id);
    if (isNaN(idCurso)) return res.status(400).json({ error: 'ID inválido.' });

    const acessos = await buscarCursoAcessos.execute(idCurso);
    return res.json(acessos);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const criarCursoAcessoController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { fkEmpresaId, fkUnidadeId, fkSetorId, fkCargoId, fkUsuarioId } = req.body;

    const data = {
      fkCursoId: Number(id),
      fkEmpresaId: fkEmpresaId ?? null,
      fkUnidadeId: fkUnidadeId ?? null,
      fkSetorId: fkSetorId ?? null,
      fkCargoId: fkCargoId ?? null,
      fkUsuarioId: fkUsuarioId ?? null,
    };

    const resultado = await criarCursoAcesso.execute(data, req.user as any);
    return res.status(201).json(resultado);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const excluirCursoAcessoController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });

    await excluirCursoAcesso.execute(id, req.user as any);
    return res.json({ message: 'Acesso removido com sucesso.' });
  } catch (err: any) {
    if (err.message.includes('Acesso não encontrado')) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
};

export const finalizarCursoController = async (req: Request, res: Response) => {
  try {
    const idCurso = Number(req.params.id);
    const usuario = req.user as any;

    const resultado = await finalizarCurso.execute(idCurso, usuario);

    return res.json({ sucesso: true, ...resultado });
  } catch (err: any) {
    console.error("Erro ao finalizar curso:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Sincronização
export const syncCursoController = async (req: Request, res: Response) => {
  try {
    const idCursoParam = Number(req.params.id) || 0;
    const result = await syncCurso.execute(idCursoParam, req.body, req.user as any);
    return res.json(result);
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
};

export const listarCertificadosController = async (req: Request, res: Response) => {
  const usuario = req.user;

  if (!usuario) {
    return res.status(401).json({ erro: "Usuário não autenticado." });
  }

  try {
    const certificados = await listarCertificados.execute(usuario);

    if (!certificados.length) {
      return res.status(200).json([]);
    }

    return res.status(200).json(certificados);
  } catch (error) {
    console.error("Erro ao listar certificados:", error);
    return res.status(500).json({ erro: "Erro ao listar certificados." });
  }
};

export const previewCertificadoController = async (req: Request, res: Response) => {
  const idCertificado = Number(req.params.id);
  const usuario = req.user;

  if (isNaN(idCertificado) || !usuario) {
    return res.status(400).json({ error: "ID inválido ou usuário não autenticado." });
  }

  try {
    const resultado = await previewCertificado.execute(idCertificado, usuario);
    return res.json(resultado);
  } catch (error: any) {
    console.error("Erro ao gerar preview do certificado:", error);
    return res.status(500).json({ error: error.message || "Erro ao gerar preview." });
  }
};

export const registrarCursoAcessoController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.idUsuario;
    const idCurso = Number(req.params.id);

    const resultado = await registrarCursoAcesso.execute(Number(idCurso), Number(userId));

    return res.status(200).json(resultado);
  } catch (err: any) {
    console.error("Erro ao registrar curso acesso:", err);
    return res.status(500).json({ error: err.message || "Erro ao registrar acesso ao curso" });
  }
};