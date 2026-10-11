"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-xl bg-neutral-200/70 dark:bg-neutral-800", className)}
      {...props}
    />
  );
}

export function TableSkeletonRows({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="h-9 border-b border-neutral-100 dark:border-neutral-800">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} className="px-3 py-2">
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
