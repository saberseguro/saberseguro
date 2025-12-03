import { subDays, startOfMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { prisma } from "../config/prisma-client";

type StatusResumo = {
  status: "NAO_INICIADO" | "EM_ANDAMENTO" | "CONCLUIDO" | "ATRASADO";
  quantidade: number;
};

type CertificadosPorMes = {
  mes: string; // "2025-01"
  total: number;
};

type DashboardHomeDTO = {
  kpis: {
    funcionariosAtivos: number;
    cursosDisponiveis: number;
    totalVinculosObrigatorios: number;
    cursosNaoIniciados: number;
    cursosEmAndamento: number;
    cursosConcluidos: number;
    cursosAtrasados: number;
    certificadosTotal: number;
    certificadosUltimos30Dias: number;
  };
  statusCursos: StatusResumo[];
  certificadosPorMes: CertificadosPorMes[];
};


async function buscarCursosDisponiveisDashboard(idUsuario: number, fkCargoId: number | null) {
  let fkSetorId = 0;
  let fkUnidadeId = 0;
  let fkEmpresaId = 0;

  if (fkCargoId) {
    const cargo = await prisma.cargo.findUnique({
      where: { idCargo: fkCargoId },
      select: {
        setor: {
          select: {
            idSetor: true,
            fkUnidadeId: true,
            unidade: {
              select: {
                fkEmpresaId: true
              }
            }
          }
        }
      }
    });

    fkSetorId = cargo?.setor?.idSetor ?? 0;
    fkUnidadeId = cargo?.setor?.fkUnidadeId ?? 0;
    fkEmpresaId = cargo?.setor?.unidade?.fkEmpresaId ?? 0;
  }

  // 🔹 2. Buscar cursos via cursoacesso (escopo)
  const acessosDiretos = await prisma.cursoacesso.findMany({
    where: {
      OR: [
        { fkUsuarioId: idUsuario },
        { fkCargoId },
        { fkSetorId },
        { fkUnidadeId },
        { fkEmpresaId },
      ],
    },
    select: { fkCursoId: true },
  });

  const cursoIdsDiretos = acessosDiretos.map((a) => a.fkCursoId);

  // 🔹 3. Buscar medidas vinculadas
  const medidas = await prisma.medidavinculo.findMany({
    where: {
      OR: [
        { fkUsuarioId: idUsuario },
        { fkCargoId },
        { fkSetorId },
        { fkUnidadeId },
        { fkEmpresaId },
      ],
    },
    select: { fkMedidaId: true },
  });

  const medidaIds = medidas.map((m) => m.fkMedidaId);

  const cursosMedidas = await prisma.medidacurso.findMany({
    where: { fkMedidaId: { in: medidaIds } },
    select: { fkCursoId: true },
  });

  const cursoIdsMedidas = cursosMedidas.map((c) => c.fkCursoId);

  // 🔹 4. Juntar e remover duplicados
  const todosIds = Array.from(new Set([...cursoIdsDiretos, ...cursoIdsMedidas]));

  return todosIds; // retorna só IDs
};

export const getDashboardHome = {
  async execute(fkEmpresaId: number) {

    // 🔹 Buscar todos os funcionários da empresa
    const funcionarios = await prisma.usuario.findMany({
      where: { fkEmpresaId },
      select: { idUsuario: true, fkCargoId: true }
    });

    const funcionariosAtivos = funcionarios.length;

    // 🔹 Certificados (últimos 30 dias e total)
    const hoje = new Date();
    const trintaDiasAtras = subDays(hoje, 30);

    const certificadosTotal = await prisma.certificado.count({
      where: { fkEmpresaId }
    });

    const certificadosUltimos30Dias = await prisma.certificado.count({
      where: {
        fkEmpresaId,
        dataGeracao: { gte: trintaDiasAtras }
      }
    });

    // 🔹 Certificados por mês (ano atual)
    const inicioAno = new Date(hoje.getFullYear(), 0, 1);

    const certificadosDoAno = await prisma.certificado.findMany({
      where: {
        fkEmpresaId,
        dataGeracao: { gte: inicioAno }
      },
      select: { dataGeracao: true }
    });

    const certificadosPorMesMap = new Map<string, number>();

    for (const c of certificadosDoAno) {
      const mesKey = format(startOfMonth(c.dataGeracao), "yyyy-MM");
      certificadosPorMesMap.set(
        mesKey,
        (certificadosPorMesMap.get(mesKey) ?? 0) + 1
      );
    }

    const certificadosPorMes = Array.from(certificadosPorMesMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, total]) => ({ mes, total }));

    // 🔹 Status acumulado
    let totalNaoIniciado = 0;
    let totalEmAndamento = 0;
    let totalConcluido = 0;
    let totalAtrasado = 0;

    // 🔹 Guardar acessos (cache)
    const acessosCache: Record<number, any[]> = {};

    // 🔹 Lista de todos os cursos obrigatórios da empresa (sem duplicação)
    const cursosDisponiveisGlobal = new Set<number>();

    // 🔥 PROCESSAMENTO PRINCIPAL
    for (const user of funcionarios) {
      const idUsuario = user.idUsuario;
      const fkCargoId = user.fkCargoId ?? null;

      // 1) Buscar cursos disponíveis via hierarquia
      let cursosDisponiveis = await buscarCursosDisponiveisDashboard(idUsuario, fkCargoId);

      // 2) Eliminar duplicações
      cursosDisponiveis = [...new Set(cursosDisponiveis)];

      // 3) Adicionar ao set global
      cursosDisponiveis.forEach(id => cursosDisponiveisGlobal.add(id));

      // 4) Cache de cursoacesso
      if (!acessosCache[idUsuario]) {
        acessosCache[idUsuario] = await prisma.cursoacesso.findMany({
          where: { fkUsuarioId: idUsuario }
        });
      }

      const acessosDoUsuario = acessosCache[idUsuario];

      // 5) Classificação do status dos cursos
      for (const idCurso of cursosDisponiveis) {
        const acesso = acessosDoUsuario.find(a => a.fkCursoId === idCurso);

        const hoje = new Date();

        if (!acesso) {
          totalNaoIniciado++;
          continue;
        }

        // Concluído
        if (acesso.concluido === 1) {
          totalConcluido++;
        }
        else {
          const prazo = acesso.prazoLimite ? new Date(acesso.prazoLimite) : null;

          // ATRASADO
          if (prazo && prazo < hoje) {
            totalAtrasado++;
          }
          // EM ANDAMENTO
          else {
            totalEmAndamento++;
          }
        }
      }
    }

    // 🔥 Retorno final
    return {
      kpis: {
        funcionariosAtivos,
        cursosDisponiveis: cursosDisponiveisGlobal.size,
        cursosObrigatorios:
          totalNaoIniciado +
          totalEmAndamento +
          totalConcluido +
          totalAtrasado,
        cursosNaoIniciados: totalNaoIniciado,
        cursosEmAndamento: totalEmAndamento,
        cursosConcluidos: totalConcluido,
        cursosAtrasados: totalAtrasado,
        certificadosTotal,
        certificadosUltimos30Dias
      },

      certificadosPorMes,

      statusCursos: [
        { status: "NAO_INICIADO", quantidade: totalNaoIniciado },
        { status: "EM_ANDAMENTO", quantidade: totalEmAndamento },
        { status: "CONCLUIDO", quantidade: totalConcluido },
        { status: "ATRASADO", quantidade: totalAtrasado }
      ]
    };
  },
};