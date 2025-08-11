import React, { useMemo, useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Pencil, Trash2 } from "lucide-react";
import Loading from "../Loading";
import ToolTip from "../Auxiliares/ToolTip";

interface Column<T> {
  header: string;
  accessor: keyof T;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

interface TabelaBaseProps<T> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  itemsPerPage?: number;
  isLoading?: boolean;
  legenda?: { cor: string; texto: string }[];
}

export default function TabelaBase<T extends object>({
  columns,
  data,
  onEdit,
  onDelete,
  itemsPerPage = 10,
  isLoading = false,
  legenda = [],
}: TabelaBaseProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof T | null; direction: "asc" | "desc" }>({
    key: null,
    direction: "asc",
  });

  const [currentPage, setCurrentPage] = useState(1);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key as keyof T];
      const bVal = b[sortConfig.key as keyof T];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === "string") {
        return sortConfig.direction === "asc"
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }

      return sortConfig.direction === "asc" ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
    });
  }, [data, sortConfig]);

  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = sortedData.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="flex flex-col">
      <div className="rounded-md border border-gray-200">
        {/* Tabela */}
        <div className="overflow-auto custom-scrollbar rounded-t-md">
          <table className="w-full bg-white text-sm text-center rounded-t-md">
            <thead className="bg-gray-50 text-gray-700 sticky top-0">
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} className="px-4 py-3 font-bold cursor-pointer select-none">
                    <div className="flex items-center justify-center gap-1">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <button
                          onClick={() =>
                            setSortConfig((prev) => ({
                              key: col.accessor,
                              direction:
                                prev.key === col.accessor && prev.direction === "asc" ? "desc" : "asc",
                            }))
                          }
                        >
                          {sortConfig.key === col.accessor ? (
                            sortConfig.direction === "asc" ? (
                              <ChevronUp size={14} />
                            ) : (
                              <ChevronDown size={14} />
                            )
                          ) : (
                            <ChevronsUpDown size={14} />
                          )}
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                {(onEdit || onDelete) && <th className="px-4 py-3 font-bold">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 border-b border-t border-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-6 text-gray-400 text-center">
                    <Loading />
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-6 text-gray-400 text-center">
                    Nenhum item encontrado.
                  </td>
                </tr>
              ) : (
                currentData.map((row, idx) => (
                  <tr key={idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                    {columns.map((col, i) => (
                      <td key={i} className="px-4 py-3">
                        {col.render ? col.render(row[col.accessor], row) : (row[col.accessor] as any) ?? "—"}
                      </td>
                    ))}
                    {(onEdit || onDelete) && (
                      <td className="px-4 py-3 flex justify-center items-center gap-2">
                        {onEdit && (
                          <ToolTip text="Editar">
                            <button onClick={() => onEdit(row)} className="text-blue-500 hover:text-blue-700 cursor-pointer">
                              <Pencil size={14} />
                            </button>
                          </ToolTip>
                        )}
                        {onDelete && (
                          <ToolTip text="Excluir">
                            <button onClick={() => onDelete(row)} className="text-red-500 hover:text-red-700 cursor-pointer">
                              <Trash2 size={14} />
                            </button>
                          </ToolTip>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="flex justify-between items-center px-4 py-3 bg-gray-50 text-gray-700 rounded-b-md text-sm font-bold">
          <p>
            Mostrando {startIndex + 1} a {Math.min(endIndex, totalItems)} de {totalItems} itens
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => goToPage(1)} disabled={currentPage === 1} className="px-3 py-1 rounded hover:bg-gray-100 cursor-pointer disabled:hover:bg-transparent disabled:cursor-not-allowed disabled:opacity-50 disabled:text-gray-500">«</button>
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 rounded hover:bg-gray-100 cursor-pointer disabled:hover:bg-transparent disabled:cursor-not-allowed disabled:opacity-50 disabled:text-gray-500">‹</button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum =
                totalPages <= 5 ? i + 1 :
                  currentPage <= 3 ? i + 1 :
                    currentPage >= totalPages - 2 ? totalPages - 4 + i :
                      currentPage - 2 + i;

              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`px-3 py-1 rounded ${pageNum === currentPage ? "bg-blue-600 text-white" : ""}`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 rounded hover:bg-gray-100 cursor-pointer disabled:hover:bg-transparent disabled:cursor-not-allowed disabled:opacity-50 disabled:text-gray-500">›</button>
            <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} className="px-3 py-1 rounded hover:bg-gray-100 cursor-pointer disabled:hover:bg-transparent disabled:cursor-not-allowed disabled:opacity-50 disabled:text-gray-500">»</button>
          </div>
        </div>
      </div>

      {/* Legenda */}
      {legenda.length > 0 && (
        <div className="w-full px-2 mt-2 text-xs text-gray-700 flex flex-wrap justify-end gap-2">
          <span className="font-medium">Legenda:</span>
          {legenda.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${item.cor}`}></span>
              <span>{item.texto}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
