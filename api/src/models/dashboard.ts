import { subDays, startOfMonth, format } from "date-fns";
import { prisma } from "../config/prisma-client";

type StatusResumo = {
  status: "NAO_INICIADO" | "EM_ANDAMENTO" | "CONCLUIDO" | "ATRASADO";
  quantidade: number;
};

type CertificadosPorMes = {
  mes: string; // "2025-01"
  total: number;
};

type FuncionarioCursoAndamento = {
  funcionarioId: number;
  funcionarioNome: string;
  cursoId: number;
  cursoNome: string;
  unidade: string;
  setor: string;
  cargo: string;
  status: "NAO_INICIADO" | "EM_ANDAMENTO" | "CONCLUIDO" | "ATRASADO";
  percentualConclusao: number;
  dataConclusao: string | null;
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
  funcionariosCursos: FuncionarioCursoAndamento[];
};

// Chave usada para agrupar funcionários que compartilham o mesmo cargo (e,
// portanto, o mesmo escopo de setor/unidade/empresa para fins de cursos e
// medidas). Funcionários sem cargo caem todos na mesma chave "sem-cargo".
const SEM_CARGO = "sem-cargo";
type ChaveEscopo = number | typeof SEM_CARGO;

type EscopoCargo = {
  fkCargoId: number | null;
  fkSetorId: number;
  fkUnidadeId: number;
  fkEmpresaId: number;
};

export const getDashboardHome = {
  async execute(fkEmpresaId: number) {
    // 🔹 Buscar todos os funcionários da empresa
    const funcionarios = await prisma.usuario.findMany({
      where: { fkEmpresaId },
      select: {
        idUsuario: true,
        nome: true,
        fkCargoId: true,
        cargo: {
          select: {
            nome: true,
            setor: {
              select: {
                nome: true,
                unidade: {
                  select: {
                    nomeFantasia: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const funcionariosAtivos = funcionarios.length;
    const funcionarioIds = funcionarios.map((f) => f.idUsuario);

    // 🔹 Certificados (últimos 30 dias e total)
    const hoje = new Date();
    const trintaDiasAtras = subDays(hoje, 30);

    const certificadosTotal = await prisma.certificado.count({
      where: { fkEmpresaId },
    });

    const certificadosUltimos30Dias = await prisma.certificado.count({
      where: {
        fkEmpresaId,
        dataGeracao: { gte: trintaDiasAtras },
      },
    });

    // 🔹 Certificados por mês (ano atual)
    const inicioAno = new Date(hoje.getFullYear(), 0, 1);

    const certificadosDoAno = await prisma.certificado.findMany({
      where: {
        fkEmpresaId,
        dataGeracao: { gte: inicioAno },
      },
      select: { dataGeracao: true },
    });

    const certificadosPorMesMap = new Map<string, number>();
    for (const c of certificadosDoAno) {
      const mesKey = format(startOfMonth(c.dataGeracao), "yyyy-MM");
      certificadosPorMesMap.set(mesKey, (certificadosPorMesMap.get(mesKey) ?? 0) + 1);
    }

    const certificadosPorMes = Array.from(certificadosPorMesMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, total]) => ({ mes, total }));

    // ──────────────────────────────────────────────────────────────────
    // A partir daqui: cursos/medidas disponíveis e progresso por funcionário.
    // Tudo é buscado em lote (poucas consultas, com `IN`) em vez de uma
    // consulta por funcionário/curso — é isso que fazia essa tela demorar
    // muito em empresas com mais gente/cursos.
    // ──────────────────────────────────────────────────────────────────

    // 1) Resolver o escopo (setor/unidade/empresa) de cada cargo distinto
    //    usado pelos funcionários — uma consulta só para todos os cargos.
    const cargoIdsDistintos = Array.from(
      new Set(funcionarios.map((f) => f.fkCargoId).filter((id): id is number => !!id))
    );

    const cargosInfo = cargoIdsDistintos.length
      ? await prisma.cargo.findMany({
        where: { idCargo: { in: cargoIdsDistintos } },
        select: {
          idCargo: true,
          setor: {
            select: {
              idSetor: true,
              fkUnidadeId: true,
              unidade: { select: { fkEmpresaId: true } },
            },
          },
        },
      })
      : [];

    const escoposPorCargo = new Map<ChaveEscopo, EscopoCargo>();
    for (const cargo of cargosInfo) {
      escoposPorCargo.set(cargo.idCargo, {
        fkCargoId: cargo.idCargo,
        fkSetorId: cargo.setor?.idSetor ?? 0,
        fkUnidadeId: cargo.setor?.fkUnidadeId ?? 0,
        fkEmpresaId: cargo.setor?.unidade?.fkEmpresaId ?? 0,
      });
    }

    const temFuncionarioSemCargo = funcionarios.some((f) => !f.fkCargoId);
    if (temFuncionarioSemCargo) {
      escoposPorCargo.set(SEM_CARGO, {
        fkCargoId: null,
        fkSetorId: 0,
        fkUnidadeId: 0,
        fkEmpresaId: 0,
      });
    }

    // 2) Para cada escopo distinto (cargo, ou "sem cargo"), buscar os cursos e
    //    medidas vinculados nesse nível — uma consulta por escopo distinto
    //    (não por funcionário), todas em paralelo.
    const chaveDoFuncionario = (fkCargoId: number | null): ChaveEscopo =>
      fkCargoId ?? SEM_CARGO;

    const escopos = Array.from(escoposPorCargo.entries());

    const resultadosEscopo = await Promise.all(
      escopos.map(async ([chave, escopo]) => {
        const condicaoOr = [
          { fkCargoId: escopo.fkCargoId },
          { fkSetorId: escopo.fkSetorId },
          { fkUnidadeId: escopo.fkUnidadeId },
          { fkEmpresaId: escopo.fkEmpresaId },
        ];

        const [cursos, medidas] = await Promise.all([
          prisma.cursoacesso.findMany({
            where: { OR: condicaoOr },
            select: { fkCursoId: true },
          }),
          prisma.medidavinculo.findMany({
            where: { OR: condicaoOr },
            select: { fkMedidaId: true },
          }),
        ]);

        return {
          chave,
          cursoIds: cursos.map((c) => c.fkCursoId),
          medidaIds: medidas.map((m) => m.fkMedidaId),
        };
      })
    );

    const cursoIdsPorEscopo = new Map<ChaveEscopo, number[]>();
    const medidaIdsPorEscopo = new Map<ChaveEscopo, number[]>();
    for (const r of resultadosEscopo) {
      cursoIdsPorEscopo.set(r.chave, r.cursoIds);
      medidaIdsPorEscopo.set(r.chave, r.medidaIds);
    }

    // 3) Cursos/medidas vinculados diretamente ao funcionário (nível usuário)
    //    — também em uma única consulta para todos os funcionários de uma vez.
    const [acessosUsuarioNivel, medidasUsuarioNivel] = funcionarioIds.length
      ? await Promise.all([
        prisma.cursoacesso.findMany({
          where: { fkUsuarioId: { in: funcionarioIds } },
          select: { fkUsuarioId: true, fkCursoId: true, concluido: true, dataConclusao: true, prazoLimite: true },
        }),
        prisma.medidavinculo.findMany({
          where: { fkUsuarioId: { in: funcionarioIds } },
          select: { fkUsuarioId: true, fkMedidaId: true },
        }),
      ])
      : [[], []];

    const cursoIdsPorUsuario = new Map<number, number[]>();
    const acessoPorChave = new Map<string, (typeof acessosUsuarioNivel)[number]>();
    for (const a of acessosUsuarioNivel) {
      // fkUsuarioId é opcional no schema (cursoacesso também é usado pra
      // vínculos por cargo/setor/unidade/empresa), mas a query acima já
      // filtra só por `fkUsuarioId: { in: funcionarioIds }`, então aqui
      // nunca vem null de fato — o guard só satisfaz o TS.
      if (a.fkUsuarioId == null) continue;
      const lista = cursoIdsPorUsuario.get(a.fkUsuarioId) ?? [];
      lista.push(a.fkCursoId);
      cursoIdsPorUsuario.set(a.fkUsuarioId, lista);
      acessoPorChave.set(`${a.fkUsuarioId}:${a.fkCursoId}`, a);
    }

    const medidaIdsPorUsuario = new Map<number, number[]>();
    for (const m of medidasUsuarioNivel) {
      // Mesmo caso do loop acima: medidavinculo.fkUsuarioId é opcional no
      // schema, mas a query já filtrou só pelos funcionarioIds informados.
      if (m.fkUsuarioId == null) continue;
      const lista = medidaIdsPorUsuario.get(m.fkUsuarioId) ?? [];
      lista.push(m.fkMedidaId);
      medidaIdsPorUsuario.set(m.fkUsuarioId, lista);
    }

    // 4) Resolver quais cursos cada medida libera (medidacurso) — uma
    //    consulta só, para todas as medidas relevantes da empresa inteira.
    const todosMedidaIds = new Set<number>();
    for (const arr of medidaIdsPorEscopo.values()) arr.forEach((id) => todosMedidaIds.add(id));
    for (const arr of medidaIdsPorUsuario.values()) arr.forEach((id) => todosMedidaIds.add(id));

    const medidaCursoRows = todosMedidaIds.size
      ? await prisma.medidacurso.findMany({
        where: { fkMedidaId: { in: Array.from(todosMedidaIds) } },
        select: { fkMedidaId: true, fkCursoId: true },
      })
      : [];

    const cursoIdsPorMedida = new Map<number, number[]>();
    for (const r of medidaCursoRows) {
      const lista = cursoIdsPorMedida.get(r.fkMedidaId) ?? [];
      lista.push(r.fkCursoId);
      cursoIdsPorMedida.set(r.fkMedidaId, lista);
    }

    // 5) Montar, em memória, os cursos disponíveis de cada funcionário
    //    (escopo do cargo + vínculo direto do usuário + cursos liberados
    //    por medida) — sem nenhuma consulta extra ao banco.
    const cursosDisponiveisGlobal = new Set<number>();
    const cursosDisponiveisPorUsuario = new Map<number, number[]>();

    for (const f of funcionarios) {
      const chave = chaveDoFuncionario(f.fkCargoId ?? null);
      const cursosEscopo = cursoIdsPorEscopo.get(chave) ?? [];
      const medidasEscopo = medidaIdsPorEscopo.get(chave) ?? [];
      const cursosUsuario = cursoIdsPorUsuario.get(f.idUsuario) ?? [];
      const medidasUsuario = medidaIdsPorUsuario.get(f.idUsuario) ?? [];

      const medidaIdsDoFuncionario = new Set([...medidasEscopo, ...medidasUsuario]);
      const cursosViaMedida: number[] = [];
      for (const mid of medidaIdsDoFuncionario) {
        (cursoIdsPorMedida.get(mid) ?? []).forEach((cid) => cursosViaMedida.push(cid));
      }

      const disponiveis = Array.from(new Set([...cursosEscopo, ...cursosUsuario, ...cursosViaMedida]));
      cursosDisponiveisPorUsuario.set(f.idUsuario, disponiveis);
      disponiveis.forEach((id) => cursosDisponiveisGlobal.add(id));
    }

    const todosCursoIds = Array.from(cursosDisponiveisGlobal);

    // 6) Título de cada curso — uma consulta só para todos os cursos usados.
    const cursosInfo = todosCursoIds.length
      ? await prisma.curso.findMany({
        where: { idCurso: { in: todosCursoIds } },
        select: { idCurso: true, titulo: true },
      })
      : [];
    const tituloPorCurso = new Map(cursosInfo.map((c) => [c.idCurso, c.titulo]));

    // 7) Total de aulas de cada curso — uma consulta só.
    const aulas = todosCursoIds.length
      ? await prisma.aula.findMany({
        where: { modulo: { fkCursoId: { in: todosCursoIds } } },
        select: { idAula: true, modulo: { select: { fkCursoId: true } } },
      })
      : [];

    const totalAulasPorCurso = new Map<number, number>();
    const cursoPorAula = new Map<number, number>();
    for (const a of aulas) {
      const cid = a.modulo.fkCursoId;
      totalAulasPorCurso.set(cid, (totalAulasPorCurso.get(cid) ?? 0) + 1);
      cursoPorAula.set(a.idAula, cid);
    }
    const todosAulaIds = Array.from(cursoPorAula.keys());

    // 8) Aulas concluídas por (funcionário, curso) — uma consulta só para
    //    todo mundo, em vez de uma consulta por funcionário por curso.
    const aulasConcluidas = todosAulaIds.length && funcionarioIds.length
      ? await prisma.aulausuario.findMany({
        where: {
          fkUsuarioId: { in: funcionarioIds },
          fkAulaId: { in: todosAulaIds },
          concluida: 1,
        },
        select: { fkUsuarioId: true, fkAulaId: true },
      })
      : [];

    const concluidasPorChave = new Map<string, number>();
    for (const c of aulasConcluidas) {
      const cid = cursoPorAula.get(c.fkAulaId);
      if (cid == null) continue;
      const chave = `${c.fkUsuarioId}:${cid}`;
      concluidasPorChave.set(chave, (concluidasPorChave.get(chave) ?? 0) + 1);
    }

    const calcularProgresso = (idUsuario: number, idCurso: number): number => {
      const total = totalAulasPorCurso.get(idCurso) ?? 0;
      if (total === 0) return 0;
      const feitas = concluidasPorChave.get(`${idUsuario}:${idCurso}`) ?? 0;
      return Math.round((feitas / total) * 100);
    };

    // 9) Montagem final: mesma lógica de status de antes, só que 100% em
    //    memória (sem await dentro do loop).
    let totalNaoIniciado = 0;
    let totalEmAndamento = 0;
    let totalConcluido = 0;
    let totalAtrasado = 0;
    const funcionariosCursos: FuncionarioCursoAndamento[] = [];

    for (const user of funcionarios) {
      const cursosDisponiveis = cursosDisponiveisPorUsuario.get(user.idUsuario) ?? [];

      for (const idCurso of cursosDisponiveis) {
        const acesso = acessoPorChave.get(`${user.idUsuario}:${idCurso}`);
        const percentualCalculado = calcularProgresso(user.idUsuario, idCurso);

        let status: FuncionarioCursoAndamento["status"] = "NAO_INICIADO";
        let percentualConclusao = percentualCalculado;
        let dataConclusao: string | null = null;

        if (!acesso && percentualCalculado === 0) {
          status = "NAO_INICIADO";
          totalNaoIniciado++;
        } else if (percentualCalculado >= 100 || acesso?.concluido === 1) {
          status = "CONCLUIDO";
          percentualConclusao = 100;
          dataConclusao = acesso?.dataConclusao ? format(acesso.dataConclusao, "dd/MM/yyyy") : null;
          totalConcluido++;
        } else {
          const prazo = acesso?.prazoLimite ? new Date(acesso.prazoLimite) : null;

          if (prazo && prazo < hoje) {
            status = "ATRASADO";
            totalAtrasado++;
          } else if (percentualCalculado > 0) {
            status = "EM_ANDAMENTO";
            totalEmAndamento++;
          } else {
            status = "NAO_INICIADO";
            totalNaoIniciado++;
          }
        }

        funcionariosCursos.push({
          funcionarioId: user.idUsuario,
          funcionarioNome: user.nome,
          cursoId: idCurso,
          cursoNome: tituloPorCurso.get(idCurso) ?? "Curso não encontrado",
          unidade: user.cargo?.setor?.unidade?.nomeFantasia ?? "-",
          setor: user.cargo?.setor?.nome ?? "-",
          cargo: user.cargo?.nome ?? "-",
          status,
          percentualConclusao,
          dataConclusao,
        });
      }
    }

    return {
      kpis: {
        funcionariosAtivos,
        cursosDisponiveis: cursosDisponiveisGlobal.size,
        cursosObrigatorios: totalNaoIniciado + totalEmAndamento + totalConcluido + totalAtrasado,
        cursosNaoIniciados: totalNaoIniciado,
        cursosEmAndamento: totalEmAndamento,
        cursosConcluidos: totalConcluido,
        cursosAtrasados: totalAtrasado,
        certificadosTotal,
        certificadosUltimos30Dias,
      },

      certificadosPorMes,

      statusCursos: [
        { status: "NAO_INICIADO", quantidade: totalNaoIniciado },
        { status: "EM_ANDAMENTO", quantidade: totalEmAndamento },
        { status: "CONCLUIDO", quantidade: totalConcluido },
        { status: "ATRASADO", quantidade: totalAtrasado },
      ],

      funcionariosCursos,
    };
  },
};
