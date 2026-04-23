import type { ReactNode } from "react";
import { IconChevronRight } from "@tabler/icons-react";
import { Pagination } from "./pagination";

export type DataTableColumn<TData> = {
  key: string;
  header: string;
  align?: "left" | "center" | "right";
  width?: string;
  render: (row: TData) => ReactNode;
};

type DataTableProps<TData> = {
  columns: DataTableColumn<TData>[];
  data: TData[];
  getRowKey: (row: TData, index: number) => string;
  getRowClassName?: (row: TData, index: number) => string;
  enableRowNavigation?: boolean;
  onRowNavigate?: (row: TData) => void;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  loadingRowCount?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  onPageChange?: (nextPage: number) => void;
  onPageSizeChange?: (nextPageSize: number) => void;
  className?: string;
};

function alignClass(align: DataTableColumn<unknown>["align"]): string {
  if (align === "right") {
    return "text-right";
  }

  if (align === "center") {
    return "text-center";
  }

  return "text-left";
}

export function DataTable<TData>({
  columns,
  data,
  getRowKey,
  getRowClassName,
  enableRowNavigation = false,
  onRowNavigate,
  isLoading = false,
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting filters or adding a new entry.",
  loadingRowCount = 5,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  className,
}: DataTableProps<TData>) {
  const shouldRenderPagination =
    typeof page === "number" &&
    typeof totalPages === "number" &&
    typeof onPageChange === "function" &&
    typeof onPageSizeChange === "function";

  return (
    <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white ${className ?? ""}`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-160 border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 ${alignClass(column.align)}`}
                  style={column.width ? { width: column.width } : undefined}
                  scope="col"
                >
                  {column.header}
                </th>
              ))}
              {enableRowNavigation ? (
                <th
                  className="w-12 px-2 py-3"
                  scope="col"
                  aria-label="Row navigation"
                />
              ) : null}
            </tr>
          </thead>

          <tbody>
            {isLoading
              ? Array.from({ length: loadingRowCount }, (_, index) => (
                  <tr key={`loading-${index}`} className="border-b border-slate-100 last:border-0">
                    {columns.map((column) => (
                      <td
                        key={`${column.key}-${index}`}
                        className={`px-4 py-3 ${alignClass(column.align)}`}
                      >
                        <div className="h-4 animate-pulse rounded bg-slate-100" />
                      </td>
                    ))}
                    {enableRowNavigation ? <td className="w-12 px-2 py-3" /> : null}
                  </tr>
                ))
              : data.map((row, rowIndex) => (
                  <tr
                    key={getRowKey(row, rowIndex)}
                    className={`group border-b border-slate-100 transition-colors hover:bg-slate-50 last:border-0 ${getRowClassName?.(row, rowIndex) ?? ""}`}
                  >
                    {columns.map((column) => (
                      <td
                        key={`${column.key}-${getRowKey(row, rowIndex)}`}
                        className={`px-4 py-3 text-sm text-slate-700 ${alignClass(column.align)}`}
                      >
                        {column.render(row)}
                      </td>
                    ))}
                    {enableRowNavigation ? (
                      <td className="w-12 px-2 py-3 text-right">
                        <button
                          type="button"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 opacity-0 transition-opacity hover:text-slate-900 group-hover:opacity-100"
                          aria-label="Navigate row"
                          onClick={() => onRowNavigate?.(row)}
                        >
                          <IconChevronRight aria-hidden="true" size={16} stroke={2} />
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {!isLoading && data.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm font-semibold text-slate-900">{emptyTitle}</p>
          <p className="mt-1 text-sm text-slate-500">{emptyDescription}</p>
        </div>
      ) : null}

      {shouldRenderPagination ? (
        <div className="border-t border-slate-200 p-4">
          <Pagination
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </div>
      ) : null}
    </div>
  );
}

export type { DataTableProps };
