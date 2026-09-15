// Metadados dos tipos de relatório suportados por gerarRelatorio.execute().
// Espelha view/src/services/apiRelatorio.ts (opcoesRelatorio) — mantidos em
// arquivos separados porque um é usado pelo front (pra montar a tela) e
// este pelo back (pra montar o assunto do e-mail do envio agendado e
// validar o tipo recebido), mas os `id`/`titulo` devem ficar em sincronia.
export interface OpcaoRelatorio {
  id: string;
  titulo: string;
  descricao: string;
  formato: "pdf" | "xlsx" | "csv";
  categoria?: string;
}

export const opcoesRelatorio: OpcaoRelatorio[] = [
  {
    id: "funcionarios_listagem",
    titulo: "Listagem de Funcionários",
    descricao: "Exporta a listagem de funcionários em Excel com base nos filtros selecionados.",
    formato: "xlsx",
    categoria: "Estrutura",
  },
  {
    id: "pendencias_cursos",
    titulo: "Pendências de Cursos",
    descricao: "Gera um PDF com funcionários que concluíram e que ainda possuem cursos pendentes.",
    formato: "pdf",
    categoria: "Treinamentos",
  },
  {
    id: "lista_presenca_cursos",
    titulo: "Listagem de Presença",
    descricao: "Gera um PDF com listagem de presença.",
    formato: "pdf",
    categoria: "Treinamentos",
  },
];
