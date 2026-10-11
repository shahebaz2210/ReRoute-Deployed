"use client";

import React, { forwardRef, useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 tracking-tight">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-neutral-400 dark:text-neutral-500 pointer-events-none flex items-center justify-center">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            className={cn(
              "flex h-9.5 w-full rounded-xl border border-neutral-200/90 bg-white px-3 py-2 text-xs md:text-sm text-[#272A30] shadow-2xs transition-colors file:border-0 file:bg-transparent file:text-xs file:font-semibold placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D3139] focus-visible:border-[#2D3139] disabled:cursor-not-allowed disabled:opacity-50",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              error && "border-red-500 focus-visible:ring-red-500",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-neutral-400 dark:text-neutral-500 pointer-events-none flex items-center justify-center">
              {rightIcon}
            </span>
          )}
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

Input.displayName = "Input";

export interface SearchInputProps extends Omit<InputProps, "onChange"> {
  value: string;
  onChange: (val: string) => void;
  debounceMs?: number;
}

export function SearchInput({ value, onChange, debounceMs = 300, placeholder = "Search...", ...props }: SearchInputProps) {
  const [internalVal, setInternalVal] = useState(value);

  useEffect(() => {
    setInternalVal(value);
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (internalVal !== value) {
        onChange(internalVal);
      }
    }, debounceMs);
    return () => clearTimeout(handler);
  }, [internalVal, debounceMs, onChange, value]);

  return (
    <div className="relative w-full">
      <Input
        value={internalVal}
        onChange={(e) => setInternalVal(e.target.value)}
        placeholder={placeholder}
        leftIcon={<Search className="h-4 w-4" />}
        rightIcon={
          internalVal ? (
            <button
              type="button"
              onClick={() => {
                setInternalVal("");
                onChange("");
              }}
              className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : undefined
        }
        {...props}
      />
    </div>
  );
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", label, error, helperText, id, rows = 3, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 tracking-tight">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          aria-invalid={!!error}
          className={cn(
            "flex min-h-[80px] w-full rounded-xl border border-neutral-200/90 bg-white p-3 text-xs md:text-sm text-[#272A30] shadow-2xs transition-colors placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D3139] focus-visible:border-[#2D3139] disabled:cursor-not-allowed disabled:opacity-50 resize-y",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-red-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-neutral-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
