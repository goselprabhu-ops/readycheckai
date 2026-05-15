import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { EmptyState } from "./EmptyState";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  rowKey: (row: T, index: number) => string;
}

export function DataTable<T>({
  columns,
  rows,
  isLoading,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  rowKey,
}: DataTableProps<T>) {
  if (isLoading) return <LoadingSkeleton variant="table" rows={5} />;
  if (!rows.length) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <div className="overflow-x-auto rounded-md border border-border/60">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((c) => (
              <TableHead key={c.key} className={c.className}>
                {c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={rowKey(row, i)}>
              {columns.map((c) => (
                <TableCell key={c.key} className={c.className}>
                  {c.render(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}