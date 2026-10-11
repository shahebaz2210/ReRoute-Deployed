"use client";

import React, { useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./table";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  isLoading = false,
  emptyMessage = "No records found.",
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === "asc") setSortDirection("desc");
      else {
        setSortKey(null);
        setSortDirection("asc");
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      const comp = valA < valB ? -1 : 1;
      return sortDirection === "asc" ? comp : -comp;
    });
  }, [data, sortKey, sortDirection]);

  return (
    <div className={cn("w-full overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-2xs", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => {
              const isSorted = sortKey === col.key;
              return (
                <TableHead
                  key={col.key}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={cn(
                    col.sortable && "cursor-pointer hover:text-[#272A30]",
                    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                  )}
                >
                  <div
                    className={cn(
                      "inline-flex items-center gap-1.5",
                      col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : "justify-start"
                    )}
                  >
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-neutral-400">
                        {isSorted ? (
                          sortDirection === "asc" ? (
                            <ChevronUp className="h-3 w-3 text-[#2D3139]" />
                          ) : (
                            <ChevronDown className="h-3 w-3 text-[#2D3139]" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3 w-3 opacity-40 hover:opacity-100" />
                        )}
                      </span>
                    )}
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, rIdx) => (
              <TableRow key={rIdx} className="h-10">
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    <div className="h-4 w-3/4 animate-pulse rounded-md bg-neutral-100" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : sortedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-28 text-center text-xs text-neutral-500">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((row) => (
              <TableRow
                key={keyExtractor(row)}
                onClick={() => onRowClick && onRowClick(row)}
                className={cn(
                  onRowClick && "cursor-pointer"
                )}
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={cn(
                      col.align === "right" ? "text-right font-mono tabular-nums" : col.align === "center" ? "text-center" : "text-left"
                    )}
                  >
                    {col.render ? col.render(row) : String(row[col.key] ?? "—")}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
