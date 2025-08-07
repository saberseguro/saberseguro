import { prisma } from "../../config/prisma-client";
import { registrarEvento } from "../../shared/utils/registrarEvento";

export const criarMaterialComplementar = {
  async execute(data: any, usuario: any) {
    const aula = await prisma.aula.findUnique({
      where: { idAula: data.fkAulaId }
    });

    if (!aula) throw new Error("Aula não encontrada");

    const novoMaterial = await prisma.materialcomplementar.create({
      data: {
        titulo: data.titulo,
        tipo: data.tipo,
        material: data.material,
        fkAulaId: data.fkAulaId,
      }
    });

    await registrarEvento({
      idUsuario: usuario.idUsuario,
      tipo: "criar",
      entidade: "materialcomplementar",
      entidadeId: novoMaterial.idMaterialComplementar,
      descricao: `Material adicionado à aula ${aula.titulo}`,
      dadosDepois: novoMaterial,
    });

    return novoMaterial;
  }
};