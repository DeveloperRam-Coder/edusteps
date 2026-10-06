import React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/primitives/shadcn"
import { cn } from "@/lib/utils"
import { EmptyState, Skeleton } from "@/components"

interface DataTableColumn<T> {
  key: keyof T
  label: string
  render?: (value: any, row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (row: T) => void
  className?: string
  rowClassName?: string
}

const DataTable = React.forwardRef<
  HTMLTableElement,
  DataTableProps<any>
>(
  (
    {
      columns,
      data,
      loading = false,
      emptyMessage = "No data found",
      onRowClick,
      className,
      rowClassName,
    },
    ref
  ) => {
    return (
      <div className="w-full overflow-auto rounded-2xl border border-border/70">
        <Table ref={ref} className={className}>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={String(column.key)} className={column.className}>
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-10 text-center">
                  <div className="mx-auto flex max-w-md flex-col items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-2xl" />
                    <div className="w-full space-y-2">
                      <Skeleton className="h-4 w-2/3 mx-auto" variant="text" />
                      <Skeleton className="h-4 w-5/6 mx-auto" variant="text" />
                      <Skeleton className="h-4 w-3/4 mx-auto" variant="text" />
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-10 text-center">
                  <div className="mx-auto max-w-md">
                    <EmptyState title={emptyMessage} description="Try adjusting your filters or search." />
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, idx) => (
                <TableRow
                  key={idx}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    onRowClick && "cursor-pointer hover:bg-muted",
                    rowClassName
                  )}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={`${idx}-${String(column.key)}`}
                      className={column.className}
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : String(row[column.key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    )
  }
)
DataTable.displayName = "DataTable"

export { DataTable }
export type { DataTableColumn, DataTableProps }
