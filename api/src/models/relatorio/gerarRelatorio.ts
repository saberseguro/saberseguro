import { gerarRelatorioListaPresencaCursosPdf } from "./gerarListaPresenca";
import { gerarRelatorioFuncionariosExcel } from "./gerarRelatorioFuncionariosExcel";
import { gerarRelatorioPendenciasCursosPdf } from "./gerarRelatorioPendenciasCursosPdf";

interface GerarRelatorioParams {
  tipo: string;
  formato: string;
  filtros: any;
  usuario?: any;
}

export const gerarRelatorio = {
  async execute({ tipo, formato, filtros, usuario }: GerarRelatorioParams) {
    switch (tipo) {
      case "funcionarios_listagem":
        return await gerarRelatorioFuncionariosExcel.execute({
          formato,
          filtros,
          usuario,
        });

      case "pendencias_cursos":
        return await gerarRelatorioPendenciasCursosPdf.execute({
          formato,
          filtros,
          usuario,
        });

      case "lista_presenca_cursos":
        return await gerarRelatorioListaPresencaCursosPdf.execute({
          formato,
          filtros,
          usuario,
        });

      default:
        throw new Error("Tipo de relatório não suportado.");
    }
  },
};