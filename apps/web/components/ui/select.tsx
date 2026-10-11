"use client";

import React, { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, helperText, options, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 tracking-tight">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={!!error}
            className={cn(
              "flex h-9.5 w-full appearance-none rounded-xl border border-neutral-200/90 bg-white px-3 py-2 pr-9 text-xs md:text-sm text-[#272A30] shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D3139] focus-visible:border-[#2D3139] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:focus-visible:ring-neutral-100",
              error && "border-red-500 focus-visible:ring-red-500",
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled} className="bg-white text-[#272A30] dark:bg-neutral-900 dark:text-neutral-100">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        </div>
        {error ? (
          <p className="text-xs text-red-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-neutral-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";
